from django.contrib.auth import get_user_model

def has_premium_override(user) -> bool:
    """
    Returns True if the user has a premium override via:
    - Staff status
    - Superuser status
    - 'premium_override' group membership
    - 'trainer.premium_override' permission
    """
    if not user.is_authenticated:
        return False
        
    if user.is_staff or user.is_superuser:
        return True
        
    if user.groups.filter(name="premium_override").exists():
        return True
        
    if user.has_perm("trainer.premium_override"):
        return True
        
    return False

def user_has_premium_access(user) -> bool:
    """
    Source of truth for premium access.
    Returns True if user has subscription premium OR entitlement override.
    """
    if not user.is_authenticated:
        return False
        
    if has_premium_override(user):
        return True
        
    # Fallback to existing subscription check
    # 'profile' is the related_name on UserProfile
    if hasattr(user, 'profile'):
        return bool(user.profile.is_premium)
        
    return False
