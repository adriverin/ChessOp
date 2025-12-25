from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from datetime import datetime, timezone as dt_timezone
from django.db.models import Q, Sum, Count, Case, When, IntegerField
from django.core.cache import cache
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import stripe
import random
import json
import hashlib
import logging
from functools import wraps
from .billing import compute_is_premium, compute_effective_status
from .entitlements import user_has_premium_access, has_premium_override

from .models import (
    OpeningCategory,
    Opening,
    Variation,
    UserProgress,
    UserSRSProgress,
    UserMistake,
    MoveLog,
    DailyQuest,
    UserQuestProgress,
    UserDrillSRSProgress,
    UserDrillAttempt,
    UserRepertoireOpening,
    infer_side_from_opening,
)
from .monetization import MonetizationManager, stamina_required
from .drill_badges import get_opening_drill_badges

logger = logging.getLogger(__name__)


def premium_required_response():
    return JsonResponse(
        {"error": "PREMIUM_REQUIRED", "detail": "This feature requires Premium."},
        status=403,
    )


def require_premium(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        if not user_has_premium_access(request.user):
            return premium_required_response()

        return view_func(request, *args, **kwargs)

    return _wrapped_view

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
        'daily_moves_remaining': profile.daily_moves_remaining,
        'daily_moves_max': 20,
        'is_premium': user_has_premium_access(request.user),
        'effective_premium': user_has_premium_access(request.user),
        'subscription': {
            'status': compute_effective_status(
                profile.subscription_status,
                profile.current_period_end,
                cancel_at_period_end=profile.cancel_at_period_end,
            ),
            'currentPeriodEnd': profile.current_period_end.isoformat() if profile.current_period_end else None,
            'planInterval': profile.plan_interval,
            'cancelAtPeriodEnd': profile.cancel_at_period_end,
            'trialEndsAt': profile.trial_ends_at.isoformat() if profile.trial_ends_at else None,
            'canceledAt': profile.canceled_at.isoformat() if profile.canceled_at else None,
        },
        'is_superuser': request.user.is_superuser,
        'is_staff': request.user.is_staff,
        'quests': quests,
        'one_move_current_streak': profile.one_move_current_streak,
        'one_move_best_streak': profile.one_move_best_streak,
        # Add Heatmap summary if needed (or fetch via separate endpoint)
    })


@login_required
def api_get_mistakes(request):
    profile = request.user.profile
    mistakes = (
        UserMistake.objects.filter(profile=profile, resolved=False)
        .select_related('variation', 'variation__opening')
        .order_by('-created_at')
    )

    payload = []
    for m in mistakes:
        payload.append({
            'id': str(m.id),
            'variation_id': m.variation.slug if m.variation else None,
            'variation_name': m.variation.name if m.variation else None,
            'opening_id': m.variation.opening.slug if m.variation else None,
            'opening_name': m.variation.opening.name if m.variation else None,
            'fen': m.fen,
            'wrong_move': m.wrong_move,
            'correct_move': m.correct_move,
            'created_at': m.created_at.isoformat(),
        })
    return JsonResponse({'mistakes': payload})

@login_required
@require_http_methods(["DELETE"])
def api_clear_mistakes(request):
    """
    Bulk delete for "Clear All" in the Blunder Basket.
    Only clears unresolved mistakes (the ones shown in the UI).
    """
    profile = request.user.profile
    UserMistake.objects.filter(profile=profile, resolved=False).delete()
    return JsonResponse({'success': True})

@login_required
@require_http_methods(["DELETE"])
def api_delete_mistake(request, mistake_id):
    profile = request.user.profile
    mistake = get_object_or_404(UserMistake, id=mistake_id, profile=profile)
    mistake.delete()
    return JsonResponse({'success': True})

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


def _serialize_repertoire(user):
    repertoire = (
        UserRepertoireOpening.objects.filter(user=user, is_active=True)
        .select_related("opening")
    )
    grouped = {"white": [], "black": []}
    for item in repertoire:
        grouped[item.side].append(
            {"opening_id": item.opening.slug, "name": item.opening.name, "side": item.side}
        )
    return grouped


def _get_unlocked_opening_slugs(user):
    """
    Mirrors the Hard Lock gating used in api_get_openings.
    Returns slugs of openings with at least one unlocked variation.
    """
    # Allow anonymous users (Free Tier Guest)
    if user.is_authenticated and user_has_premium_access(user):
        return set(Opening.objects.values_list("slug", flat=True))

    strategy = MonetizationManager.get_strategy()
    if strategy != "HARD_LOCK":
        return set(Opening.objects.values_list("slug", flat=True))

    limit = 5
    variations_count = 0
    unlocked = set()

    categories = OpeningCategory.objects.prefetch_related("openings__variations").all()
    for category in categories:
        for opening in category.openings.all():
            opening_has_access = False
            for _ in opening.variations.all():
                is_locked = False
                if variations_count >= limit:
                    is_locked = True
                variations_count += 1

                if not is_locked:
                    opening_has_access = True

            if opening_has_access:
                unlocked.add(opening.slug)

    return unlocked


def _get_unlocked_variation_ids(user):
    """
    Mirrors the Hard Lock gating used in api_get_openings.
    Returns DB IDs of variations that are unlocked for free users.

    Returns:
      - None for premium users or non-HARD_LOCK strategies (meaning "no restriction")
      - list[int] for HARD_LOCK free users (authenticated or guest)
    """
    if user.is_authenticated and user_has_premium_access(user):
        return None

    strategy = MonetizationManager.get_strategy()
    if strategy != "HARD_LOCK":
        return None

    limit = 5
    variations_count = 0
    unlocked_ids = []

    categories = OpeningCategory.objects.prefetch_related("openings__variations").all()
    for category in categories:
        for opening in category.openings.all():
            for var in opening.variations.all():
                if variations_count >= limit:
                    return unlocked_ids
                unlocked_ids.append(var.id)
                variations_count += 1

    return unlocked_ids


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
            is_premium = user_has_premium_access(request.user)
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
def api_get_repertoire(request):
    """
    Returns the current user's repertoire grouped by side.
    """
    return JsonResponse(_serialize_repertoire(request.user))


@require_POST
@login_required
def api_toggle_repertoire(request):
    """
    Toggle an opening in the user's repertoire.
    Enforces monetization rules for free users.
    """
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    opening_id = data.get('opening_id')
    active = data.get('active')

    if opening_id is None:
        return JsonResponse({'error': 'opening_id is required'}, status=400)
    if active is None:
        return JsonResponse({'error': 'active flag is required'}, status=400)

    opening = Opening.objects.filter(slug=opening_id).first() or Opening.objects.filter(id=opening_id).first()
    if not opening:
        return JsonResponse({'error': 'Invalid opening_id'}, status=404)

    side = infer_side_from_opening(opening)
    user = request.user

    # Monetization gating: free users can only add unlocked openings
    if not user_has_premium_access(user):
        unlocked_slugs = _get_unlocked_opening_slugs(user)
        if opening.slug not in unlocked_slugs:
            return premium_required_response()

    if active:
        repertoire_entry, _ = UserRepertoireOpening.objects.get_or_create(
            user=user,
            opening=opening,
            side=side,
            defaults={'is_active': True},
        )
        if not repertoire_entry.is_active:
            repertoire_entry.is_active = True
            repertoire_entry.save()
    else:
        repertoire_entry = UserRepertoireOpening.objects.filter(
            user=user, opening=opening, side=side
        ).first()
        if repertoire_entry:
            repertoire_entry.is_active = False
            repertoire_entry.save()

    return JsonResponse(_serialize_repertoire(user))


@stamina_required
def api_get_recall_session(request):
    """
    SRS Logic with Filter Support:
    1. Specific Variation (if requested via ?id=)
    2. Blunder Basket (UserMistake) - Skipped if specific filters applied? Maybe not.
    3. SRS Due (UserSRSProgress) - Filtered by params
    4. New Random Variations - Filtered by params
    """
    profile = None
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
        except:
            pass

    # Specific mistake request (Blunder Basket item)
    mistake_id = request.GET.get('mistake_id')
    if mistake_id:
        if not profile:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        mistake = UserMistake.objects.filter(profile=profile, resolved=False, id=mistake_id).first()
        if not mistake:
            return JsonResponse({'error': 'Mistake not found'}, status=404)
        return _return_mistake(mistake)
    
    # Parse Filter Params
    # Expected format: ?difficulties=beginner,elite&training_goals=tactics&themes=IQP,pawn_storm
    difficulties = request.GET.get('difficulties', '').split(',')
    training_goals = request.GET.get('training_goals', '').split(',')
    themes = request.GET.get('themes', '').split(',')
    opening_slug = request.GET.get('opening_id')
    mode = request.GET.get('mode')
    requested_id = request.GET.get('id')
    opening = None
    if opening_slug:
        opening = get_object_or_404(Opening, slug=opening_slug)

    # Optional repertoire-only flag (query param or JSON body if POST)
    use_repertoire_only = False
    if request.method == "POST":
        try:
            body_data = json.loads(request.body or "{}")
            use_repertoire_only = bool(body_data.get("use_repertoire_only", False))
        except Exception:
            pass
    qp_flag = request.GET.get("use_repertoire_only")
    if qp_flag and qp_flag.lower() in ("1", "true", "yes", "on"):
        use_repertoire_only = True

    # Guest users cannot use repertoire
    if not profile:
        use_repertoire_only = False

    # Clean up empty strings
    difficulties = [d for d in difficulties if d]
    training_goals = [g for g in training_goals if g]
    themes = [t for t in themes if t]

    side_param = request.GET.get("side")
    side_to_train = None
    
    if side_param in [UserRepertoireOpening.SIDE_WHITE, UserRepertoireOpening.SIDE_BLACK]:
        side_to_train = side_param
    elif opening:
        side_to_train = infer_side_from_opening(opening)
    else:
        # Default to White only if NOT in one_move mode, to preserve legacy behavior for other modes
        # In one_move mode, we want mixed sides if not specified
        if mode != 'one_move':
            side_to_train = UserRepertoireOpening.SIDE_WHITE

    repertoire_opening_ids = []
    if use_repertoire_only and profile:
        qs = UserRepertoireOpening.objects.filter(
            user=request.user,
            is_active=True,
        )
        if side_to_train:
            qs = qs.filter(side=side_to_train)
            
        repertoire_opening_ids = list(qs.values_list("opening_id", flat=True))
        
        # If user explicitly requested repertoire-only but has none, return an error
        if not repertoire_opening_ids:
            return JsonResponse({'error': 'No repertoire openings for this side'}, status=404)

    # 0. Specific Variation Request (Overrides everything)
    if requested_id:
        variation = get_object_or_404(Variation, slug=requested_id)
        
        # Check if locked for guest/free user
        unlocked_ids = _get_unlocked_variation_ids(request.user)
        if unlocked_ids is not None and variation.id not in unlocked_ids:
            return premium_required_response()

        if opening and variation.opening_id != opening.id:
            return JsonResponse({'message': 'Variation not in requested opening'}, status=404)
        if use_repertoire_only and repertoire_opening_ids and variation.opening_id not in repertoire_opening_ids:
            return JsonResponse({'message': 'Variation not in repertoire for this side'}, status=404)
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
            'themes': variation.themes,
            'opening': {
                'slug': variation.opening.slug,
                'name': variation.opening.name
            }
        })

    # One Move Drill Mode: Strict randomization across openings/lines (bypass SRS/New/Blunders)
    if mode == 'one_move':
        unlocked_variation_ids = _get_unlocked_variation_ids(request.user)

        def _pick_random_variation_for_opening(opening_obj):
            qs = opening_obj.variations.all()
            if unlocked_variation_ids is not None:
                qs = qs.filter(id__in=unlocked_variation_ids)
            variations = list(qs)
            if not variations:
                return None
            return random.choice(variations)

        # If a specific opening is explicitly provided, stay within it (specific-opening flow).
        if opening:
            if use_repertoire_only and repertoire_opening_ids and opening.id not in repertoire_opening_ids:
                return JsonResponse({'error': 'Opening not in repertoire for this side'}, status=404)

            variation = _pick_random_variation_for_opening(opening)
            if not variation:
                return JsonResponse({'error': 'No variations found for this opening'}, status=404)

            return _return_variation(
                variation,
                'new_learn',
                extra={
                    'pool_size_openings': 1,
                    'opening_id': opening.id,
                    'opening_slug': opening.slug,
                    'opening_name': opening.name,
                    'variation_id': variation.slug,
                    'variation_name': variation.name,
                },
            )

        # Generic One Move Drill: pick an opening first, then a random variation from it.
        eligible_openings = Opening.objects.all()
        if unlocked_variation_ids is not None:
            eligible_openings = eligible_openings.filter(variations__id__in=unlocked_variation_ids).distinct()

        if use_repertoire_only and repertoire_opening_ids:
            eligible_openings = eligible_openings.filter(id__in=repertoire_opening_ids)

        if side_to_train == UserRepertoireOpening.SIDE_BLACK:
            eligible_openings = eligible_openings.filter(tags__icontains="Black")
        elif side_to_train == UserRepertoireOpening.SIDE_WHITE:
            eligible_openings = eligible_openings.exclude(tags__icontains="Black")

        eligible_ids = list(eligible_openings.values_list('id', flat=True).distinct())
        if not eligible_ids:
            return JsonResponse({'error': 'No eligible openings found'}, status=404)

        pool_size_openings = len(eligible_ids)

        # Avoid immediate repeat (unless pool size is 1)
        last_opening_id = request.session.get('last_one_move_opening_id')
        candidates = eligible_ids
        if last_opening_id and pool_size_openings > 1 and last_opening_id in eligible_ids:
            candidates = [oid for oid in eligible_ids if oid != last_opening_id] or eligible_ids

        selected_opening_id = random.choice(candidates)
        selected_opening = Opening.objects.get(id=selected_opening_id)
        request.session['last_one_move_opening_id'] = selected_opening_id

        variation = _pick_random_variation_for_opening(selected_opening)
        if not variation:
            return JsonResponse({'error': 'No variations found for selected opening'}, status=404)

        return _return_variation(
            variation,
            'new_learn',
            extra={
                'pool_size_openings': pool_size_openings,
                'opening_id': selected_opening.id,
                'opening_slug': selected_opening.slug,
                'opening_name': selected_opening.name,
                'variation_id': variation.slug,
                'variation_name': variation.name,
            },
        )

    has_filters = bool(difficulties or training_goals or themes or opening or use_repertoire_only)
    
    # Helper to apply filters to a QuerySet (UserSRSProgress or Variation)
    def apply_filters(queryset, model_prefix='', repertoire_ids=None):
        # model_prefix allows filtering on 'variation__' for SRSProgress or direct fields for Variation
        prefix = f"{model_prefix}__" if model_prefix else ""
        
        if difficulties:
            queryset = queryset.filter(**{f"{prefix}difficulty__in": difficulties})
        if training_goals:
            queryset = queryset.filter(**{f"{prefix}training_goal__in": training_goals})
        if opening:
            queryset = queryset.filter(**{f"{prefix}opening": opening})
        if repertoire_ids:
            queryset = queryset.filter(**{f"{prefix}opening_id__in": repertoire_ids})
        
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
    if profile:
        if not has_filters:
            # Standard logic: prioritize blunders
            blunders = UserMistake.objects.filter(profile=profile, resolved=False)
            if opening:
                blunders = blunders.filter(variation__opening=opening)
            if blunders.exists():
                mistake = blunders.first()
                return _return_mistake(mistake)
        else:
            # Filtered logic: Only show blunders that match criteria
            blunders = UserMistake.objects.filter(profile=profile, resolved=False)
            # This requires joining on variation to filter
            blunders = apply_filters(
                blunders,
                model_prefix='variation',
                repertoire_ids=repertoire_opening_ids if use_repertoire_only else None,
            )
            
            # Apply theme filter in Python
            if themes and blunders.exists():
                blunders_list = list(blunders)
                blunders_list = filter_by_themes(blunders_list, is_variation_objects=False) # UserMistake has variation relation
                if blunders_list:
                    return _return_mistake(blunders_list[0])
            elif blunders.exists():
                 return _return_mistake(blunders.first())

    # 2. SRS Due
    if profile:
        now = timezone.now()
        due_srs = UserSRSProgress.objects.filter(profile=profile, next_review_date__lte=now).order_by('next_review_date')
        
        if has_filters:
            due_srs = apply_filters(
                due_srs,
                model_prefix='variation',
                repertoire_ids=repertoire_opening_ids if use_repertoire_only else None,
            )
            
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
    known_ids = []
    if profile:
        known_ids_qs = UserSRSProgress.objects.filter(profile=profile)
        if opening:
            known_ids_qs = known_ids_qs.filter(variation__opening=opening)
        if use_repertoire_only and repertoire_opening_ids:
            known_ids_qs = known_ids_qs.filter(variation__opening_id__in=repertoire_opening_ids)
        known_ids = known_ids_qs.values_list('variation_id', flat=True)

    available = Variation.objects.exclude(id__in=known_ids)
    
    # Enforce Free Tier Locking
    unlocked_ids = _get_unlocked_variation_ids(request.user)
    if unlocked_ids is not None:
        available = available.filter(id__in=unlocked_ids)

    if opening:
        available = available.filter(opening=opening)
    
    if has_filters:
        available = apply_filters(
            available,
            repertoire_ids=repertoire_opening_ids if use_repertoire_only else None,
        )
    
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
        # Enforce Free Tier Locking on Fallback too
        if unlocked_ids is not None:
            fallback_candidates = fallback_candidates.filter(id__in=unlocked_ids)
            
        if opening:
            fallback_candidates = fallback_candidates.filter(opening=opening)
        fallback_candidates = apply_filters(
            fallback_candidates,
            repertoire_ids=repertoire_opening_ids if use_repertoire_only else None,
        )
        
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

@require_premium
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

@require_premium
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


@require_premium
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
        status = _drill_status(srs)

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

def _return_variation(variation, type_label, extra=None):
    tags = variation.opening.get_tags_list()
    orientation = 'black' if 'Black' in tags else 'white'
    payload = {
        'type': type_label,
        'id': variation.slug,
        'name': variation.name,
        'moves': variation.moves,
        'orientation': orientation,
        'difficulty': variation.difficulty,
        'training_goal': variation.training_goal,
        'themes': variation.themes,
        'opening': {
            'slug': variation.opening.slug,
            'name': variation.opening.name
        }
    }
    if extra:
        payload.update(extra)
    return JsonResponse(payload)

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
        'orientation': orientation,
        'opening': {
            'slug': mistake.variation.opening.slug,
            'name': mistake.variation.opening.name
        } if mistake.variation else None
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
def api_submit_result(request):
    """
    Handles completion of a session (Standard or Recall).
    Updates SRS, XP, Quests, Blunders.
    """
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
    # Guest user handling: Just return success, don't save anything.
    if not request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'Practice complete (Guest)'})

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
            success = not hint_used
            _update_drill_srs(profile, variation, success=success)
            
            # Log attempt for stats
            UserDrillAttempt.objects.create(
                user=request.user,
                variation=variation,
                opening=variation.opening,
                was_success=success,
                mode='opening_drill'
            )
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

    elif result_type == 'one_move_complete':
        success = data.get('success', False)
        if success:
            profile.one_move_current_streak += 1
            if profile.one_move_current_streak > profile.one_move_best_streak:
                profile.one_move_best_streak = profile.one_move_current_streak
            msg = f"Streak: {profile.one_move_current_streak}"
        else:
            profile.one_move_current_streak = 0
            msg = "Streak reset"
        profile.save()
        return JsonResponse({'success': True, 'message': msg})
        
    elif result_type == 'blunder_made':
        # Frontend reports a mistake
        variation_slug = data.get('id')
        if not variation_slug:
            return JsonResponse({'error': 'id is required'}, status=400)

        # mode comes from the payload; we only persist blunders for non-one-move modes.
        # (Opening Training uses mode='opening' to be explicit.)
        mode = data.get('mode')

        var = Variation.objects.filter(slug=variation_slug).first()
        if mode != 'one_move' and var is None:
            return JsonResponse({'error': 'Variation not found'}, status=404)

        fen = data.get('fen')
        if not fen:
            return JsonResponse({'error': 'fen is required'}, status=400)

        if mode != 'one_move':
            mistake, created = UserMistake.objects.get_or_create(
                profile=profile,
                variation=var,
                fen=fen,
                defaults={
                    'wrong_move': data.get('wrong_move') or '',
                    'correct_move': data.get('correct_move') or '',
                },
            )

            if not created:
                # Deduplicate: keep a single record per (user, variation, position).
                # We don't overwrite wrong/correct move; just refresh recency so it surfaces in the UI.
                updates = {'resolved': False}
                # If a last_practiced-style field exists in the future, prefer it.
                if hasattr(mistake, 'last_practiced'):
                    updates['last_practiced'] = timezone.now()
                else:
                    # No last_practiced field in this project; treat created_at as "last seen" for ordering.
                    updates['created_at'] = timezone.now()
                UserMistake.objects.filter(id=mistake.id).update(**updates)
        
        # SRS Penalty
        if var:
            if mode == 'opening_drill':
                _update_drill_srs(profile, var, success=False)
                
                # Log attempt for stats
                UserDrillAttempt.objects.create(
                    user=request.user,
                    variation=var,
                    opening=var.opening,
                    was_success=False,
                    mode='opening_drill'
                )
            elif mode == 'one_move':
                profile.one_move_current_streak = 0
                profile.save()
            else:
                srs = UserSRSProgress.objects.filter(profile=profile, variation=var).first()
                if srs:
                    srs.streak = 0
                    srs.interval = 1 # Reset to day 1
                    srs.next_review_date = timezone.now()
                    srs.save()
                    
        return JsonResponse({'success': True, 'message': 'Mistake recorded.'})

    return JsonResponse({'error': 'Unknown result type'}, status=400)

@login_required
@require_premium
def api_get_opening_drill_stats(request):
    """
    Returns stats and badges for a specific opening in Drill Mode.
    """
    opening_slug = request.GET.get('opening_id')
    if not opening_slug:
        return JsonResponse({'error': 'opening_id parameter is required'}, status=400)

    opening = get_object_or_404(Opening, slug=opening_slug)
    profile = request.user.profile

    # Gating Check
    if not opening_drill_unlocked(request.user, opening):
        # Allow checking stats even if locked? 
        # Requirement says: "If user not allowed (monetization or unlock gating) -> 403"
        return JsonResponse({'error': 'Opening drill not unlocked for this opening'}, status=403)

    # 1. Counts (use the same status definition as UI)
    variations = opening.variations.all()
    total_variations = variations.count()
    
    srs_records = UserDrillSRSProgress.objects.filter(profile=profile, variation__opening=opening)

    mastered_count = 0
    due_count = 0
    learning_count = 0

    now = timezone.now()
    for var in variations:
        srs = srs_records.filter(variation=var).first()
        status = _drill_status(srs)
        if status == 'mastered':
            mastered_count += 1
        elif status == 'due':
            due_count += 1
        else:
            learning_count += 1

    # 2. Activity (Reviews)
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = now - timezone.timedelta(days=7)
    
    attempts_qs = UserDrillAttempt.objects.filter(user=request.user, opening=opening, mode='opening_drill')
    
    reviews_today = attempts_qs.filter(created_at__gte=today_start).count()
    reviews_last_7_days = attempts_qs.filter(created_at__gte=seven_days_ago).count()
    
    # 3. Streaks
    # Optimization: Fetch only necessary fields
    attempts_history = list(attempts_qs.order_by('created_at').values_list('was_success', flat=True))
    
    current_flawless_streak = 0
    longest_flawless_streak = 0
    temp_streak = 0
    
    for success in attempts_history:
        if success:
            temp_streak += 1
            if temp_streak > longest_flawless_streak:
                longest_flawless_streak = temp_streak
        else:
            temp_streak = 0
    
    current_flawless_streak = temp_streak
    
    mastery_percentage = (mastered_count / total_variations) if total_variations > 0 else 0.0

    stats = {
        "total_variations": total_variations,
        "mastered_variations": mastered_count,
        "due_count": due_count,
        "learning_count": learning_count,
        "reviews_today": reviews_today,
        "reviews_last_7_days": reviews_last_7_days,
        "current_flawless_streak": current_flawless_streak,
        "longest_flawless_streak": longest_flawless_streak,
        "mastery_percentage": round(mastery_percentage, 2)
    }

    # 4. Badges
    badges = get_opening_drill_badges(request.user, opening, stats, attempts_qs, srs_records)

    return JsonResponse({
        "opening": {
            "id": opening.slug,
            "slug": opening.slug,
            "name": opening.name
        },
        "stats": stats,
        "badges": badges
    })


# --- Auth Endpoints ---

@require_POST
def api_signup(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirmPassword', '')

    if not email:
        return JsonResponse({'error': 'Email is required'}, status=400)
    if not password or len(password) < 10:
        return JsonResponse({'error': 'Password must be at least 10 characters'}, status=400)
    if password != confirm_password:
        return JsonResponse({'error': 'Passwords do not match'}, status=400)

    # Check email uniqueness
    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email already in use'}, status=400)

    # Create User
    # Strategy: username = email prefix + random suffix to ensure uniqueness
    username_prefix = email.split('@')[0][:20]
    username_suffix = str(random.randint(1000, 9999))
    username = f"{username_prefix}_{username_suffix}"
    
    # Ensure username is unique (simplified loop)
    while User.objects.filter(username=username).exists():
        username_suffix = str(random.randint(1000, 9999))
        username = f"{username_prefix}_{username_suffix}"

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        # UserProfile is created via signal
        
        # Log the user in
        login(request, user)
        
        return JsonResponse({
            'id': user.id,
            'email': user.email,
            'isAuthenticated': True
        })
    except Exception as e:
        return JsonResponse({'error': 'Signup failed. Please try again.'}, status=500)

@require_POST
def api_login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Accept "identifier" (email or username)
    identifier = data.get('identifier', '').strip()
    # Fallback to email if identifier is missing
    if not identifier:
        identifier = data.get('email', '').strip()
        
    password = data.get('password', '')

    if not identifier or not password:
        return JsonResponse({'error': 'Email/Username and password are required'}, status=400)

    # Rate limiting
    ip = request.META.get('REMOTE_ADDR')
    # Hash identifier to avoid storing PII
    identifier_hash = hashlib.md5(identifier.lower().encode()).hexdigest()
    cache_key = f"login_attempts:{ip}:{identifier_hash}"
    attempts = cache.get(cache_key, 0)

    if attempts >= 10:
        return JsonResponse({'error': 'Too many attempts, try again later.'}, status=429)

    # Determine if identifier is email or username
    user_obj = None
    if '@' in identifier:
        user_obj = User.objects.filter(email__iexact=identifier).first()
    else:
        user_obj = User.objects.filter(username__iexact=identifier).first()
    
    user = None
    if user_obj:
        user = authenticate(request, username=user_obj.username, password=password)

    if user is not None:
        login(request, user)
        # Reset rate limit
        cache.delete(cache_key)
        return JsonResponse({
            'id': user.id,
            'email': user.email,
            'isAuthenticated': True
        })
    else:
        # Increment rate limit
        cache.set(cache_key, attempts + 1, timeout=600) # 10 minutes
        return JsonResponse({'error': 'Invalid email/username or password'}, status=400)

@require_POST
def api_logout(request):
    if request.user.is_authenticated:
        logout(request)
    return JsonResponse({'ok': True})

@require_http_methods(["GET"])
def api_me(request):
    if request.user.is_authenticated:
        profile = request.user.profile
        return JsonResponse({
            'id': request.user.id,
            'email': request.user.email,
            'isAuthenticated': True,
            'isPremium': user_has_premium_access(request.user),
            'subscription': {
                'status': compute_effective_status(
                    profile.subscription_status,
                    profile.current_period_end,
                    cancel_at_period_end=profile.cancel_at_period_end,
                ),
                'currentPeriodEnd': profile.current_period_end.isoformat() if profile.current_period_end else None,
                'planInterval': profile.plan_interval,
                'cancelAtPeriodEnd': profile.cancel_at_period_end,
                'trialEndsAt': profile.trial_ends_at.isoformat() if profile.trial_ends_at else None,
                'canceledAt': profile.canceled_at.isoformat() if profile.canceled_at else None,
            }
        })
    return JsonResponse({'isAuthenticated': False}, status=401)


# --- Billing Endpoints ---

@require_POST
@login_required
def create_checkout_session(request):
    try:
        data = json.loads(request.body)
        plan = data.get('plan') # 'monthly' or 'yearly'
    except:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    profile = request.user.profile
    if profile.is_premium and profile.subscription_status in ("active", "trialing"):
        return JsonResponse({'error': 'Already subscribed'}, status=400)

    if plan not in ("monthly", "yearly"):
        return JsonResponse({'error': 'Invalid plan'}, status=400)

    if not settings.STRIPE_SECRET_KEY:
        logger.error("Stripe secret key missing (STRIPE_SECRET_KEY)")
        return JsonResponse(
            {'error': 'BILLING_NOT_CONFIGURED', 'detail': 'Missing STRIPE_SECRET_KEY'},
            status=500
        )

    if plan == "monthly":
        price_id = settings.STRIPE_PRICE_ID_MONTHLY
        if not price_id:
            logger.error("Stripe monthly price missing (STRIPE_PRICE_ID_MONTHLY)")
            return JsonResponse(
                {'error': 'PRICE_NOT_CONFIGURED', 'detail': 'Missing STRIPE_PRICE_ID_MONTHLY'},
                status=500
            )
    else:
        price_id = settings.STRIPE_PRICE_ID_YEARLY
        if not price_id:
            logger.error("Stripe yearly price missing (STRIPE_PRICE_ID_YEARLY)")
            return JsonResponse(
                {'error': 'PRICE_NOT_CONFIGURED', 'detail': 'Missing STRIPE_PRICE_ID_YEARLY'},
                status=500
            )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        # Get or create customer
        customer_id = profile.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=request.user.email,
                metadata={'user_id': request.user.id}
            )
            customer_id = customer.id
            profile.stripe_customer_id = customer_id
            profile.save()

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            subscription_data={
                'trial_period_days': 7,
                'metadata': {'user_id': request.user.id, 'plan': plan}
            },
            client_reference_id=str(request.user.id),
            success_url=settings.STRIPE_CHECKOUT_SUCCESS_URL,
            cancel_url=settings.STRIPE_CHECKOUT_CANCEL_URL,
            allow_promotion_codes=True,
        )
        return JsonResponse({'url': session.url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_POST
@login_required
def create_portal_session(request):
    profile = request.user.profile
    if not profile.stripe_customer_id:
        return JsonResponse({'error': 'No billing account found'}, status=400)

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe.billing_portal.Session.create(
            customer=profile.stripe_customer_id,
            return_url=settings.STRIPE_CUSTOMER_PORTAL_RETURN_URL
        )
        return JsonResponse({'url': session.url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook secret not configured")
        return JsonResponse({'error': 'Webhook secret not set'}, status=500)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.warning("Stripe webhook received invalid payload")
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification failed")
        return JsonResponse({'error': 'Invalid signature'}, status=400)

    # Handle the event
    def _update_profile_from_subscription(profile, subscription_obj):
        if not subscription_obj:
            return

        status = subscription_obj.get('status')
        period_end_ts = subscription_obj.get('current_period_end')
        trial_end_ts = subscription_obj.get('trial_end')
        cancel_at_period_end = subscription_obj.get('cancel_at_period_end', False)
        canceled_at_ts = subscription_obj.get('canceled_at')

        profile.stripe_subscription_id = subscription_obj.get('id')
        profile.subscription_status = status
        profile.cancel_at_period_end = bool(cancel_at_period_end)

        if period_end_ts:
            profile.current_period_end = datetime.fromtimestamp(period_end_ts, tz=dt_timezone.utc)
        if canceled_at_ts:
            profile.canceled_at = datetime.fromtimestamp(canceled_at_ts, tz=dt_timezone.utc)
        if trial_end_ts:
            profile.trial_ends_at = datetime.fromtimestamp(trial_end_ts, tz=dt_timezone.utc)

        if subscription_obj.get('items') and subscription_obj['items'].data:
            profile.plan_interval = subscription_obj['items'].data[0].price.recurring.interval

        profile.is_premium = compute_is_premium(
            profile.subscription_status,
            profile.current_period_end,
            cancel_at_period_end=profile.cancel_at_period_end,
        )
        profile.save()

    if event['type'] in ('checkout.session.completed', 'customer.subscription.created',
                         'customer.subscription.updated', 'customer.subscription.deleted'):

        session = event['data']['object']
        
        # Try to find user profile
        customer_id = session.get('customer')
        profile = None
        
        if customer_id:
            from .models import UserProfile
            profile = UserProfile.objects.filter(stripe_customer_id=customer_id).first()
        
        if not profile and event['type'] == 'checkout.session.completed':
            # Fallback to client_reference_id
            user_id = session.get('client_reference_id')
            if user_id:
                try:
                    profile = UserProfile.objects.get(user_id=user_id)
                    # Link customer id if not present
                    if not profile.stripe_customer_id and customer_id:
                        profile.stripe_customer_id = customer_id
                        profile.save()
                except Exception:
                    logger.warning("Stripe webhook could not find profile for user_id=%s", user_id)

        if profile:
            # If it's a subscription event, we get the subscription object directly
            # If it's checkout session, we need to fetch subscription or it might be in 'subscription' field
            subscription_id = session.get('subscription')

            # For checkout completed, 'subscription' is an ID. For subscription events, object is subscription.
            if event['type'].startswith('customer.subscription.'):
                sub = session # it is the subscription object
                subscription_id = sub.get('id')
            else:
                # Checkout session completed
                # We can update basic info, but usually subscription.created/updated follows immediately
                if subscription_id:
                    stripe.api_key = settings.STRIPE_SECRET_KEY
                    sub = stripe.Subscription.retrieve(subscription_id)
                else:
                    sub = None

            if sub:
                _update_profile_from_subscription(profile, sub)
        else:
            logger.warning(
                "Stripe webhook profile not found for customer=%s subscription=%s",
                customer_id,
                session.get('id'),
            )

    return JsonResponse({'status': 'success'})
