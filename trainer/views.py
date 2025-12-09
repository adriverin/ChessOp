from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.db.models import Q, Sum, Count, Case, When, IntegerField
import random
import json

from .models import (
    OpeningCategory, Opening, Variation, UserProgress, 
    UserSRSProgress, UserMistake, MoveLog, DailyQuest, UserQuestProgress,
    UserDrillSRSProgress
)
from .monetization import MonetizationManager, stamina_required

@ensure_csrf_cookie
def dashboard(request):
    return render(request, 'dashboard.html')

def api_get_dashboard_data(request):
    """Returns user stats: XP, Level, Quests, Heatmap data"""
    if not request.user.is_authenticated:
        return JsonResponse({'is_authenticated': False})

    profile = request.user.profile
    
    # Quests
    quests = []
    # Assign default quests if none exist for today (simplified logic)
    today = timezone.now().date()
    
    # Check existing progress for today
    daily_progress = UserQuestProgress.objects.filter(profile=profile, assigned_date=today)
    if not daily_progress.exists():
        # Assign random quests
        available = list(DailyQuest.objects.all())
        if available:
            selected = random.sample(available, min(len(available), 3))
            for q in selected:
                UserQuestProgress.objects.create(profile=profile, quest=q, assigned_date=today)
            daily_progress = UserQuestProgress.objects.filter(profile=profile, assigned_date=today)
    
    for qp in daily_progress:
        quests.append({
            'title': qp.quest.title,
            'description': qp.quest.description,
            'progress': qp.progress,
            'target': qp.quest.target_count,
            'completed': qp.is_completed,
            'reward': qp.quest.xp_reward
        })
        
    return JsonResponse({
        'is_authenticated': True,
        'xp': profile.total_xp,
        'level': profile.level,
        'is_premium': profile.is_premium,
        'quests': quests,
        # Add Heatmap summary if needed (or fetch via separate endpoint)
    })

def opening_drill_unlocked(user, opening):
    """
    Helper: Checks if user has successfully trained all variations of an opening
    (i.e. has a UserProgress record for each variation).
    """
    # Get all variation IDs for this opening
    var_ids = set(opening.variations.values_list('id', flat=True))
    
    # Get completed variation IDs for this user
    # UserProgress implies success without hints (based on api_submit_result logic)
    completed_ids = set(UserProgress.objects.filter(
        profile=user.profile, 
        variation__opening=opening
    ).values_list('variation_id', flat=True))
    
    return var_ids.issubset(completed_ids)


# --- Opening Drill SRS Helpers (SM-2 inspired) ---
def _get_or_create_drill_srs(profile, variation):
    srs, _ = UserDrillSRSProgress.objects.get_or_create(
        profile=profile,
        variation=variation,
        defaults={
            'ease_factor': 2.5,
            'interval_days': 0.0,
            'due_date': timezone.now(),
            'streak': 0,
            'total_attempts': 0,
            'total_successes': 0,
            'last_result': ''
        }
    )
    return srs


def _update_drill_srs(profile, variation, success: bool):
    """Apply SM-2 style updates for Opening Drill mode."""
    now = timezone.now()
    srs = _get_or_create_drill_srs(profile, variation)

    srs.total_attempts += 1
    if success:
        srs.total_successes += 1
        srs.last_result = 'success'
        srs.ease_factor = srs.ease_factor + 0.1
        if srs.streak == 0:
            srs.interval_days = 1
        elif srs.streak == 1:
            srs.interval_days = 3
        else:
            srs.interval_days = srs.interval_days * srs.ease_factor
        srs.streak += 1
        srs.due_date = now + timezone.timedelta(days=srs.interval_days)
    else:
        srs.last_result = 'failure'
        srs.ease_factor = max(1.3, srs.ease_factor - 0.2)
        srs.interval_days = 0
        srs.streak = 0
        # Review soon (1 hour)
        srs.due_date = now + timezone.timedelta(hours=1)

    srs.save()
    return srs


def _drill_status(srs):
    if not srs or srs.total_attempts == 0:
        return 'learning'
    if srs.due_date <= timezone.now():
        return 'due'
    return 'mastered'


def _drill_srs_payload(srs):
    if not srs:
        return {
            'interval_days': 0,
            'ease_factor': 2.5,
            'streak': 0,
            'due_date': None,
            'status': 'learning'
        }
    return {
        'interval_days': srs.interval_days,
        'ease_factor': srs.ease_factor,
        'streak': srs.streak,
        'due_date': srs.due_date.isoformat(),
        'status': _drill_status(srs)
    }


def _select_drill_variation(profile, opening):
    """
    SM-2 selection priority:
    1) Due lines (weighted: smaller interval + recent failures)
    2) New/Learning lines
    3) Not-due lines (soft review: earliest due_date)
    """
    now = timezone.now()
    variations = list(opening.variations.all())
    due = []
    learning = []
    scheduled = []

    for var in variations:
        srs = UserDrillSRSProgress.objects.filter(profile=profile, variation=var).first()
        if not srs or srs.total_attempts == 0:
            learning.append((var, srs))
            continue

        if srs.due_date <= now:
            failure_rate = 1 - (srs.total_successes / srs.total_attempts) if srs.total_attempts > 0 else 1
            weight = (1.0 / (srs.interval_days + 0.5)) + failure_rate
            due.append((var, srs, weight))
        else:
            scheduled.append((var, srs))

    if due:
        total = sum(w for _, _, w in due)
        r = random.uniform(0, total)
        upto = 0
        for var, srs, w in due:
            if upto + w >= r:
                return var, srs
            upto += w

    if learning:
        var, srs = random.choice(learning)
        return var, srs

    if scheduled:
        scheduled.sort(key=lambda item: (item[1].due_date, item[1].interval_days))
        var, srs = scheduled[0]
        return var, srs

    return None, None

def api_get_openings(request):
    categories = OpeningCategory.objects.prefetch_related('openings__variations').all()
    
    data = {}
    
    # Determine if user is premium
    is_premium = False
    user_completed_ids = set()
    
    if request.user.is_authenticated:
        try:
            is_premium = request.user.profile.is_premium
            user_completed_ids = set(
                UserProgress.objects.filter(profile=request.user.profile)
                .values_list('variation__slug', flat=True)
            )
        except:
            pass
    
    # Hard Lock Strategy
    strategy = MonetizationManager.get_strategy()
    variations_count = 0
    limit = 5

    for cat in categories:
        cat_openings = []
        for opening in cat.openings.all():
            vars_data = []
            total_vars = 0
            completed_vars = 0
            
            for var in opening.variations.all():
                total_vars += 1
                is_completed = var.slug in user_completed_ids
                if is_completed:
                    completed_vars += 1
                
                var_dict = {
                    'id': var.slug, # using slug as ID for frontend
                    'name': var.name,
                    'locked': False,
                    'completed': is_completed,
                    # Added Metadata fields
                    'difficulty': var.difficulty,
                    'training_goal': var.training_goal,
                    'themes': var.themes
                }
                
                # Logic: If premium, always moves.
                # If Hard Lock Strategy and not premium, limit variations.
                # If Stamina Strategy, all are visible but play is limited elsewhere.
                
                is_locked = False
                if not is_premium and strategy == 'HARD_LOCK':
                    if variations_count >= limit:
                        is_locked = True
                    variations_count += 1
                
                if is_locked:
                    var_dict['moves'] = []
                    var_dict['locked'] = True
                else:
                    var_dict['moves'] = var.moves
                    var_dict['locked'] = False
                
                vars_data.append(var_dict)
            
            # Check if drill mode is unlocked
            drill_unlocked = False
            if request.user.is_authenticated:
                drill_unlocked = opening_drill_unlocked(request.user, opening)

            opening_dict = {
                'id': opening.slug,
                'name': opening.name,
                'tags': opening.get_tags_list(),
                'variations': vars_data,
                'progress': {
                    'total': total_vars,
                    'completed': completed_vars,
                    'percentage': int((completed_vars / total_vars * 100)) if total_vars > 0 else 0
                },
                'drill_mode_unlocked': drill_unlocked
            }
            cat_openings.append(opening_dict)
        
        data[cat.name] = cat_openings
        
    return JsonResponse(data)

@login_required
@stamina_required
def api_get_recall_session(request):
    """
    SRS Logic with Filter Support:
    1. Specific Variation (if requested via ?id=)
    2. Blunder Basket (UserMistake) - Skipped if specific filters applied? Maybe not.
    3. SRS Due (UserSRSProgress) - Filtered by params
    4. New Random Variations - Filtered by params
    """
    profile = request.user.profile
    
    # Parse Filter Params
    # Expected format: ?difficulties=beginner,elite&training_goals=tactics&themes=IQP,pawn_storm
    
    difficulties = request.GET.get('difficulties', '').split(',')
    training_goals = request.GET.get('training_goals', '').split(',')
    themes = request.GET.get('themes', '').split(',')
    
    # Clean up empty strings
    difficulties = [d for d in difficulties if d]
    training_goals = [g for g in training_goals if g]
    themes = [t for t in themes if t]
    
    has_filters = bool(difficulties or training_goals or themes)

    # 0. Specific Variation Request (Overrides everything)
    requested_id = request.GET.get('id')
    if requested_id:
        variation = get_object_or_404(Variation, slug=requested_id)
        tags = variation.opening.get_tags_list()
        orientation = 'black' if 'Black' in tags else 'white'
        return JsonResponse({
            'type': 'new_learn',
            'id': variation.slug,
            'name': variation.name,
            'moves': variation.moves,
            'orientation': orientation,
            'difficulty': variation.difficulty,
            'training_goal': variation.training_goal,
            'themes': variation.themes
        })
    
    # Helper to apply filters to a QuerySet (UserSRSProgress or Variation)
    def apply_filters(queryset, model_prefix=''):
        # model_prefix allows filtering on 'variation__' for SRSProgress or direct fields for Variation
        prefix = f"{model_prefix}__" if model_prefix else ""
        
        if difficulties:
            queryset = queryset.filter(**{f"{prefix}difficulty__in": difficulties})
        if training_goals:
            queryset = queryset.filter(**{f"{prefix}training_goal__in": training_goals})
        
        # NOTE: Theme filtering is done in Python later because SQLite doesn't support JSON contains
            
        return queryset

    # Helper to filter by themes in Python
    def filter_by_themes(candidates_list, is_variation_objects=True):
        if not themes:
            return candidates_list
            
        filtered = []
        for item in candidates_list:
            # item is either a Variation or UserSRSProgress (which has .variation)
            var = item if is_variation_objects else item.variation
            
            # Check if variation themes contain ANY of the requested themes
            if var.themes:
                # var.themes is a list of strings
                if any(t in var.themes for t in themes):
                    filtered.append(item)
                    
        return filtered

    # 1. Blunders (Skip if specific filters are requested, as blunders might not match)
    # However, if the blunder's variation matches the filters, we should show it.
    if not has_filters:
        # Standard logic: prioritize blunders
        blunders = UserMistake.objects.filter(profile=profile, resolved=False)
        if blunders.exists():
            mistake = blunders.first()
            return _return_mistake(mistake)
    else:
        # Filtered logic: Only show blunders that match criteria
        blunders = UserMistake.objects.filter(profile=profile, resolved=False)
        # This requires joining on variation to filter
        blunders = apply_filters(blunders, model_prefix='variation')
        
        # Apply theme filter in Python
        if themes and blunders.exists():
            blunders_list = list(blunders)
            blunders_list = filter_by_themes(blunders_list, is_variation_objects=False) # UserMistake has variation relation
            if blunders_list:
                return _return_mistake(blunders_list[0])
        elif blunders.exists():
             return _return_mistake(blunders.first())

    # 2. SRS Due
    now = timezone.now()
    due_srs = UserSRSProgress.objects.filter(profile=profile, next_review_date__lte=now).order_by('next_review_date')
    
    if has_filters:
        due_srs = apply_filters(due_srs, model_prefix='variation')
        
    # Apply theme filter in Python
    if themes and due_srs.exists():
        due_srs_list = list(due_srs)
        due_srs_list = filter_by_themes(due_srs_list, is_variation_objects=False) # UserSRSProgress has variation relation
        if due_srs_list:
            return _return_variation(due_srs_list[0].variation, 'srs_review')
    elif due_srs.exists():
        srs_item = due_srs.first()
        return _return_variation(srs_item.variation, 'srs_review')

    # 3. New Random (if not locked)
    known_ids = UserSRSProgress.objects.filter(profile=profile).values_list('variation_id', flat=True)
    available = Variation.objects.exclude(id__in=known_ids)
    
    if has_filters:
        available = apply_filters(available)
    
    # Apply theme filter in Python
    candidates = []
    if available.exists():
        # Optimization: If theme filter exists, we might need to fetch all to filter in Python
        # If list is huge, this is slow. But for chess openings ~200 items, it's fine.
        if themes:
            available_list = list(available)
            candidates = filter_by_themes(available_list, is_variation_objects=True)
        else:
            # No themes, just pick one efficiently
            count = available.count()
            random_idx = random.randint(0, count - 1)
            variation = available[random_idx]
            return _return_variation(variation, 'new_learn')

    if candidates:
        random_idx = random.randint(0, len(candidates) - 1)
        variation = candidates[random_idx]
        return _return_variation(variation, 'new_learn')

    # 4. Fallback for Filtered Requests (Ignore SRS/Due status)
    # If the user explicitly requested a theme/difficulty, show them something 
    # even if they've already learned it or it's not due.
    if has_filters:
        fallback_candidates = Variation.objects.all()
        fallback_candidates = apply_filters(fallback_candidates)
        
        candidates_list = []
        if fallback_candidates.exists():
            if themes:
                fallback_list = list(fallback_candidates)
                candidates_list = filter_by_themes(fallback_list, is_variation_objects=True)
            else:
                candidates_list = list(fallback_candidates) # Should limit this if large
        
        if candidates_list:
            # Prioritize ones that are NOT in user progress (if any were missed by logic above, unlikely)
            random_idx = random.randint(0, len(candidates_list) - 1)
            variation = candidates_list[random_idx]
            
            # Determine type label: 'review' if they've seen it, 'new_learn' if not
            is_known = variation.id in known_ids
            type_label = 'srs_review' if is_known else 'new_learn'
            
            return _return_variation(variation, type_label)
        
    return JsonResponse({'message': 'No content available matching your criteria'}, status=404)

@login_required
@stamina_required
def api_get_opening_drill_session(request):
    """
    Opening Drill Mode:
    User plays a random variation of a chosen opening without knowing which one.
    """
    opening_slug = request.GET.get('opening_id')
    
    if opening_slug:
        opening = get_object_or_404(Opening, slug=opening_slug)
    else:
        return JsonResponse({'error': 'opening_id parameter is required'}, status=400)

    # Gating Check
    if not opening_drill_unlocked(request.user, opening):
        return JsonResponse({'error': 'Opening drill not unlocked for this opening'}, status=403)

    profile = request.user.profile

    # SM-2 based selection
    selected_var, srs = _select_drill_variation(profile, opening)
    if not selected_var:
        return JsonResponse({'error': 'No variations found'}, status=404)

    # Return Data (Hiding variation name)
    tags = selected_var.opening.get_tags_list()
    orientation = 'black' if 'Black' in tags else 'white'
    
    return JsonResponse({
        'opening': {
            'id': opening.slug,
            'name': opening.name
        },
        'variation': {
            'id': selected_var.slug,
            'moves': selected_var.moves,
            'orientation': orientation,
            # name is OMITTED to keep it hidden
        },
        'srs': _drill_srs_payload(srs)
    })

@login_required
def api_get_opening_drill_openings(request):
    """
    Returns list of openings with drill unlock status.
    """
    openings = Opening.objects.all()
    results = []
    
    for opening in openings:
        drill_unlocked = opening_drill_unlocked(request.user, opening)
        results.append({
            'id': opening.id,
            'slug': opening.slug,
            'name': opening.name,
            'drill_unlocked': drill_unlocked
        })
        
    return JsonResponse({'openings': results})


@login_required
def api_get_opening_drill_progress(request):
    """
    Returns SRS progress for all variations of an opening (names hidden).
    """
    opening_slug = request.GET.get('opening_id')
    if not opening_slug:
        return JsonResponse({'error': 'opening_id parameter is required'}, status=400)

    opening = get_object_or_404(Opening, slug=opening_slug)
    profile = request.user.profile
    variations = list(opening.variations.all())
    now = timezone.now()

    progress_items = []
    for idx, var in enumerate(variations, start=1):
        srs = UserDrillSRSProgress.objects.filter(profile=profile, variation=var).first()
        status = 'learning'
        if srs:
            if srs.due_date <= now:
                status = 'due'
            else:
                status = 'mastered'

        progress_items.append({
            'variation_id': var.slug,
            'line_number': idx,
            'interval_days': srs.interval_days if srs else 0,
            'ease_factor': srs.ease_factor if srs else 2.5,
            'streak': srs.streak if srs else 0,
            'due_date': srs.due_date.isoformat() if srs else None,
            'status': status
        })

    return JsonResponse({
        'opening': {
            'id': opening.slug,
            'name': opening.name
        },
        'progress': progress_items
    })

def _return_variation(variation, type_label):
    tags = variation.opening.get_tags_list()
    orientation = 'black' if 'Black' in tags else 'white'
    return JsonResponse({
        'type': type_label,
        'id': variation.slug,
        'name': variation.name,
        'moves': variation.moves,
        'orientation': orientation,
        'difficulty': variation.difficulty,
        'training_goal': variation.training_goal,
        'themes': variation.themes
    })

def _return_mistake(mistake):
    fen_parts = mistake.fen.split(' ')
    turn = fen_parts[1] if len(fen_parts) > 1 else 'w'
    orientation = 'white' if turn == 'w' else 'black'
    return JsonResponse({
        'type': 'mistake',
        'id': mistake.id,
        'fen': mistake.fen,
        'wrong_move': mistake.wrong_move,
        'correct_move': mistake.correct_move,
        'variation_name': mistake.variation.name if mistake.variation else "Unknown Position",
        'orientation': orientation
    })

@login_required
def api_get_theme_stats(request):
    """
    Aggregates performance by theme.
    Accuracy = Successes / Attempts
    Attempts = Successes + Mistakes
    Successes = UserProgress.times_completed
    Mistakes = Count of UserMistake (approximate)
    """
    profile = request.user.profile
    
    # 1. Get all completed variations (Successes)
    progress_data = UserProgress.objects.filter(profile=profile).select_related('variation')
    
    # 2. Get all mistakes (Failures)
    mistake_data = UserMistake.objects.filter(profile=profile).select_related('variation')
    
    theme_stats = {} # { "IQP": { attempts: 0, successes: 0 } }
    
    def ensure_theme(t):
        if t not in theme_stats:
            theme_stats[t] = {'attempts': 0, 'successes': 0}

    # Process Successes
    for p in progress_data:
        var = p.variation
        for theme in var.themes:
            ensure_theme(theme)
            # Each completion is a "success" and an "attempt"
            # Note: times_completed might count repetitions. 
            # If we want unique mastery, we could just count 1.
            # But accuracy implies ratio of tries. Let's use times_completed.
            count = p.times_completed
            theme_stats[theme]['successes'] += count
            theme_stats[theme]['attempts'] += count
            
    # Process Mistakes
    for m in mistake_data:
        if m.variation:
            for theme in m.variation.themes:
                ensure_theme(theme)
                # Each mistake is an "attempt" but not a "success"
                theme_stats[theme]['attempts'] += 1
                
    # Format for response
    results = []
    for theme, stats in theme_stats.items():
        attempts = stats['attempts']
        successes = stats['successes']
        accuracy = (successes / attempts) if attempts > 0 else 0
        
        if attempts >= 3: # Minimum threshold
            results.append({
                'name': theme,
                'attempts': attempts,
                'successes': successes,
                'accuracy': round(accuracy, 3)
            })
            
    # Sort by accuracy ascending (weakest first)
    results.sort(key=lambda x: x['accuracy'])
    
    return JsonResponse({'themes': results})


@require_POST
@login_required
def api_submit_result(request):
    """
    Handles completion of a session (Standard or Recall).
    Updates SRS, XP, Quests, Blunders.
    """
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    profile = request.user.profile
    result_type = data.get('type') # 'variation_complete', 'mistake_fixed', 'move_played'
    mode = data.get('mode')  # 'opening_drill' | None
    
    # Log Move for Heatmap (if provided)
    if 'move_data' in data:
        m = data['move_data']
        MoveLog.objects.create(
            user=request.user,
            variation=None, # Could lookup
            source_square=m.get('from'),
            target_square=m.get('to'),
            is_correct=m.get('is_correct', True)
        )
        
        # Check Quest: Complete Moves? 
        # Simplified: Only checking 'complete_lines' below

    if result_type == 'variation_complete':
        variation_slug = data.get('id')
        hint_used = data.get('hint_used', False)
        variation = get_object_or_404(Variation, slug=variation_slug)
        
        # Consume Stamina
        MonetizationManager.consume_resource(request.user, 'PLAY_MOVE')

        # Opening Drill SRS update
        if mode == 'opening_drill':
            _update_drill_srs(profile, variation, success=not hint_used)
        else:
            # Standard Progress - Only count as "completed" if no hints used
            if not hint_used:
                prog, _ = UserProgress.objects.get_or_create(profile=profile, variation=variation)
                prog.times_completed += 1
                prog.save()
            
            # SRS Update - If hints used, reset streak as penalty
            srs, created = UserSRSProgress.objects.get_or_create(profile=profile, variation=variation)
            if created:
                srs.interval = 1
                srs.streak = 1
            else:
                if hint_used:
                    srs.streak = 0  # Reset streak to force review soon
                    srs.interval = 1
                else:
                    srs.streak += 1
                    srs.interval = srs.interval * srs.ease_factor
                
            srs.next_review_date = timezone.now() + timezone.timedelta(days=srs.interval)
            srs.save()
        
        # XP & Level - No XP if hints used
        xp_gain = 0
        if not hint_used:
            xp_gain = 20
            profile.total_xp += xp_gain
            profile.level = 1 + (profile.total_xp // 100)
            profile.save()
        
        # Quest Update: Complete Lines - Only if no hints
        if not hint_used:
            quests = UserQuestProgress.objects.filter(profile=profile, quest__quest_type='complete_lines', is_completed=False)
            for q in quests:
                q.progress += 1
                if q.progress >= q.quest.target_count:
                    q.is_completed = True
                    profile.total_xp += q.quest.xp_reward
                    profile.save()
                q.save()
            
        msg = f'Completed! +{xp_gain} XP' if not hint_used else 'Completed (with hint). Keep practicing!'
        return JsonResponse({'success': True, 'message': msg})

    elif result_type == 'mistake_fixed':
        mistake_id = data.get('mistake_id')
        hint_used = data.get('hint_used', False)
        mistake = get_object_or_404(UserMistake, id=mistake_id, profile=profile)
        mistake.resolved = True
        mistake.save()
        
        if not hint_used:
            profile.total_xp += 10
            profile.save()
            msg = 'Mistake Resolved! +10 XP'
        else:
            msg = 'Mistake Resolved (with hint). Keep practicing!'
        
        return JsonResponse({'success': True, 'message': msg})
        
    elif result_type == 'blunder_made':
        # Frontend reports a mistake
        variation_slug = data.get('id')
        var = Variation.objects.filter(slug=variation_slug).first()
        
        UserMistake.objects.create(
            profile=profile,
            variation=var,
            fen=data.get('fen'),
            wrong_move=data.get('wrong_move'),
            correct_move=data.get('correct_move')
        )
        
        # SRS Penalty
        if var:
            if mode == 'opening_drill':
                _update_drill_srs(profile, var, success=False)
            else:
                srs = UserSRSProgress.objects.filter(profile=profile, variation=var).first()
                if srs:
                    srs.streak = 0
                    srs.interval = 1 # Reset to day 1
                    srs.next_review_date = timezone.now()
                    srs.save()
                    
        return JsonResponse({'success': True, 'message': 'Mistake recorded.'})

    return JsonResponse({'error': 'Unknown result type'}, status=400)
