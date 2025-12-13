from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from functools import wraps
from .entitlements import user_has_premium_access

class MonetizationManager:
    """
    Handles switching between Hard-Lock (Content Restriction) and 
    Stamina (Action Restriction) models.
    """
    
    @staticmethod
    def get_strategy():
        # Could be pulled from settings.py or database config
        # Options: 'HARD_LOCK', 'STAMINA'
        return getattr(settings, 'MONETIZATION_STRATEGY', 'HARD_LOCK')

    @staticmethod
    def is_effective_premium(user):
        """
        Returns True if the user should be treated as premium for all gating.
        Delegates to centralized entitlement logic.
        """
        return user_has_premium_access(user)

    @staticmethod
    def check_permission(user, action_type, context=None):
        strategy = MonetizationManager.get_strategy()
        
        if MonetizationManager.is_effective_premium(user):
            return True

        if strategy == 'HARD_LOCK':
            # Context should be {'opening_count': int} or similar
            # For free users, limit number of unique openings/variations
            # This check is usually done at the Data Fetch level (views.py)
            return True # Handled in view logic usually
            
        elif strategy == 'STAMINA':
            if action_type == 'PLAY_MOVE':
                return user.profile.daily_moves_remaining > 0
                
        return True

    @staticmethod
    def consume_resource(user, action_type):
        strategy = MonetizationManager.get_strategy()
        if MonetizationManager.is_effective_premium(user):
            return

        if strategy == 'STAMINA' and action_type == 'PLAY_MOVE':
            profile = user.profile
            # Reset stamina if new day (simple check)
            now = timezone.now()
            if (now - profile.last_stamina_reset).days >= 1:
                profile.daily_moves_remaining = 20 # Default daily
                profile.last_stamina_reset = now
            
            if profile.daily_moves_remaining > 0:
                profile.daily_moves_remaining -= 1
                profile.save()

def stamina_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if MonetizationManager.get_strategy() == 'STAMINA':
            # Allow unauthenticated users (guest mode) - they don't consume stamina because they don't save progress
            if not request.user.is_authenticated:
                return view_func(request, *args, **kwargs)
            
            if not MonetizationManager.check_permission(request.user, 'PLAY_MOVE'):
                 return JsonResponse({'error': 'Out of stamina'}, status=403)
                 
            # Note: Resource consumption happens on success usually, 
            # but for simplicity we might check here. 
            # Ideally consumption happens when move is validated.
            
        return view_func(request, *args, **kwargs)
    return _wrapped_view

