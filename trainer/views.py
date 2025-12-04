from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.db.models import Q
import random
import json

from .models import (
    OpeningCategory, Opening, Variation, UserProgress, 
    UserSRSProgress, UserMistake, MoveLog, DailyQuest, UserQuestProgress
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
                    'completed': is_completed
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
            
            opening_dict = {
                'id': opening.slug,
                'name': opening.name,
                'tags': opening.get_tags_list(),
                'variations': vars_data,
                'progress': {
                    'total': total_vars,
                    'completed': completed_vars,
                    'percentage': int((completed_vars / total_vars * 100)) if total_vars > 0 else 0
                }
            }
            cat_openings.append(opening_dict)
        
        data[cat.name] = cat_openings
        
    return JsonResponse(data)

@login_required
@stamina_required
def api_get_recall_session(request):
    """
    SRS Logic:
    1. Specific Variation (if requested via ?id=)
    2. Blunder Basket (UserMistake)
    3. SRS Due (UserSRSProgress)
    4. New Random Variations
    """
    profile = request.user.profile
    
    # 0. Specific Variation Request
    requested_id = request.GET.get('id')
    if requested_id:
        variation = get_object_or_404(Variation, slug=requested_id)
        tags = variation.opening.get_tags_list()
        orientation = 'black' if 'Black' in tags else 'white'
        return JsonResponse({
            'type': 'new_learn', # Treat specific requests as learning/review
            'id': variation.slug,
            'name': variation.name,
            'moves': variation.moves,
            'orientation': orientation
        })
    
    # 1. Blunders
    blunders = UserMistake.objects.filter(profile=profile, resolved=False)
    if blunders.exists():
        mistake = blunders.first() # FIFO or Random
        # Determine orientation from FEN (whose turn it is)
        # In mistake mode, the FEN represents the position where the user needs to make the correct move
        # The turn in the FEN tells us which color the user is playing
        fen_parts = mistake.fen.split(' ')
        turn = fen_parts[1] if len(fen_parts) > 1 else 'w'
        orientation = 'white' if turn == 'w' else 'black'
        # Construct a session object
        return JsonResponse({
            'type': 'mistake',
            'id': mistake.id,
            'fen': mistake.fen,
            'wrong_move': mistake.wrong_move,
            'correct_move': mistake.correct_move,
            'variation_name': mistake.variation.name if mistake.variation else "Unknown Position",
            'orientation': orientation
        })
        
    # 2. SRS Due
    now = timezone.now()
    due_srs = UserSRSProgress.objects.filter(profile=profile, next_review_date__lte=now).order_by('next_review_date')
    if due_srs.exists():
        srs_item = due_srs.first()
        variation = srs_item.variation
        # Determine orientation from opening tags
        tags = variation.opening.get_tags_list()
        orientation = 'black' if 'Black' in tags else 'white'
        return JsonResponse({
            'type': 'srs_review',
            'id': variation.slug,
            'name': variation.name,
            'moves': variation.moves,
            'orientation': orientation
        })

    # 3. New Random (if not locked)
    # Ideally filter out ones already in SRS
    known_ids = UserSRSProgress.objects.filter(profile=profile).values_list('variation_id', flat=True)
    available = Variation.objects.exclude(id__in=known_ids)
    
    # Apply permissions/lock logic if needed, but for Recall maybe we allow all?
    # Or adhere to the Hard Lock limits.
    
    if available.exists():
        # Pick random
        count = available.count()
        random_idx = random.randint(0, count - 1)
        variation = available[random_idx]
        # Determine orientation from opening tags
        tags = variation.opening.get_tags_list()
        orientation = 'black' if 'Black' in tags else 'white'
        return JsonResponse({
            'type': 'new_learn',
            'id': variation.slug,
            'name': variation.name,
            'moves': variation.moves,
            'orientation': orientation
        })
        
    return JsonResponse({'message': 'No content available'}, status=404)


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
        
        # SRS Penalty? Reset streak?
        if var:
            srs = UserSRSProgress.objects.filter(profile=profile, variation=var).first()
            if srs:
                srs.streak = 0
                srs.interval = 1 # Reset to day 1
                srs.next_review_date = timezone.now()
                srs.save()
                
        return JsonResponse({'success': True, 'message': 'Mistake recorded.'})

    return JsonResponse({'error': 'Unknown result type'}, status=400)
