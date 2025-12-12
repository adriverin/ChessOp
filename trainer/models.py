from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class OpeningCategory(models.Model):
    name = models.CharField(max_length=100)
    # e.g. '1.e4 Openings'

    class Meta:
        verbose_name_plural = "Opening Categories"

    def __str__(self):
        return self.name

class Opening(models.Model):
    category = models.ForeignKey(OpeningCategory, related_name='openings', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    tags = models.CharField(max_length=200, help_text="Comma-separated tags, e.g., 'White, Open Game'")
    
    def __str__(self):
        return self.name
    
    def get_tags_list(self):
        return [tag.strip() for tag in self.tags.split(',')]

class Variation(models.Model):
    opening = models.ForeignKey(Opening, related_name='variations', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    moves = models.JSONField(help_text="List of moves objects with 'san' and 'desc'")
    
    # Training Metadata
    difficulty = models.CharField(
        max_length=20, 
        default="intermediate",
        choices=[
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
            ("elite", "Elite")
        ]
    )
    training_goal = models.CharField(
        max_length=20,
        default="strategy",
        choices=[
            ("tactics", "Tactics"),
            ("strategy", "Strategy"),
            ("attack", "Attack"),
            ("defense", "Defense"),
            ("endgame", "Endgame")
        ]
    )
    themes = models.JSONField(default=list, help_text="List of strategic themes, e.g., ['IQP', 'pawn_storm']")
    
    def __str__(self):
        return f"{self.opening.name} - {self.name}"


class UserRepertoireOpening(models.Model):
    SIDE_WHITE = "white"
    SIDE_BLACK = "black"
    SIDE_CHOICES = (
        (SIDE_WHITE, "White"),
        (SIDE_BLACK, "Black"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    opening = models.ForeignKey(Opening, on_delete=models.CASCADE)
    side = models.CharField(max_length=5, choices=SIDE_CHOICES)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("user", "opening", "side")

    def __str__(self):
        return f"{self.user} - {self.opening} ({self.side})"


def infer_side_from_opening(opening: Opening) -> str:
    """
    Determine whether an opening is played by White or Black.
    Falls back to 'white' if ambiguous.
    """
    tags = opening.get_tags_list()
    if "Black" in tags:
        return UserRepertoireOpening.SIDE_BLACK
    return UserRepertoireOpening.SIDE_WHITE

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_premium = models.BooleanField(default=False)
    total_xp = models.IntegerField(default=0) # Renamed from xp to match request
    level = models.IntegerField(default=1)
    
    # One Move Drill Streaks
    one_move_current_streak = models.IntegerField(default=0)
    one_move_best_streak = models.IntegerField(default=0)
    
    # Billing / Stripe
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True)
    subscription_status = models.CharField(max_length=50, null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    plan_interval = models.CharField(max_length=10, null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    # Stamina System (Optional based on config)
    daily_moves_remaining = models.IntegerField(default=20)
    last_stamina_reset = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# --- Progress Models ---

class UserProgress(models.Model):
    """Standard Mode Progress: Tracks if a variation is completed"""
    profile = models.ForeignKey(UserProfile, related_name='progress', on_delete=models.CASCADE)
    variation = models.ForeignKey(Variation, related_name='completed_by', on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)
    times_completed = models.IntegerField(default=1)
    
    class Meta:
        unique_together = ('profile', 'variation')

    def __str__(self):
        return f"{self.profile.user.username} - {self.variation.name}"

class UserSRSProgress(models.Model):
    """Recall Mode SRS: Tracks mastery of a variation using Spaced Repetition"""
    profile = models.ForeignKey(UserProfile, related_name='srs_progress', on_delete=models.CASCADE)
    variation = models.ForeignKey(Variation, related_name='srs_data', on_delete=models.CASCADE)
    
    next_review_date = models.DateTimeField(default=timezone.now)
    interval = models.FloatField(default=1.0) # Days until next review
    streak = models.IntegerField(default=0)
    ease_factor = models.FloatField(default=2.5) # Standard multiplier for SRS (like SM-2)
    
    last_reviewed = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('profile', 'variation')

    def __str__(self):
        return f"SRS: {self.profile.user.username} - {self.variation.name} (Streak: {self.streak})"

class UserMistake(models.Model):
    """The Blunder Basket: Specific positions where user failed"""
    profile = models.ForeignKey(UserProfile, related_name='mistakes', on_delete=models.CASCADE)
    variation = models.ForeignKey(Variation, related_name='mistakes', on_delete=models.SET_NULL, null=True, blank=True)
    fen = models.CharField(max_length=100) # The board state
    wrong_move = models.CharField(max_length=10)
    correct_move = models.CharField(max_length=10)
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False) # If user fixes it later
    
    def __str__(self):
        return f"Mistake: {self.profile.user.username} in {self.variation.name if self.variation else 'Unknown'}"

# --- Opening Drill SRS (SM-2 style) ---

class UserDrillSRSProgress(models.Model):
    """Anki/SM-2 scheduling for Opening Drill mode (per user, per variation)."""
    profile = models.ForeignKey(UserProfile, related_name='drill_srs_progress', on_delete=models.CASCADE)
    variation = models.ForeignKey(Variation, related_name='drill_srs_data', on_delete=models.CASCADE)

    ease_factor = models.FloatField(default=2.5)
    interval_days = models.FloatField(default=0.0)
    due_date = models.DateTimeField(default=timezone.now)
    last_result = models.CharField(max_length=10, choices=[('success', 'Success'), ('failure', 'Failure')], blank=True, default='')
    streak = models.IntegerField(default=0)
    total_attempts = models.IntegerField(default=0)
    total_successes = models.IntegerField(default=0)

    class Meta:
        unique_together = ('profile', 'variation')

    def __str__(self):
        return f"Drill SRS: {self.profile.user.username} - {self.variation.name} (EF: {self.ease_factor:.2f}, interval: {self.interval_days:.2f})"

# --- Analytics ---

class MoveLog(models.Model):
    """Analytics: Records every move for Heatmaps"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='move_logs')
    variation = models.ForeignKey(Variation, on_delete=models.SET_NULL, null=True, blank=True)
    
    source_square = models.CharField(max_length=2)
    target_square = models.CharField(max_length=2)
    is_correct = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}: {self.source_square}-{self.target_square} ({'OK' if self.is_correct else 'X'})"

class UserDrillAttempt(models.Model):
    """Analytics: Records every drill attempt for streaks and badges"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='drill_attempts')
    variation = models.ForeignKey(Variation, on_delete=models.CASCADE)
    opening = models.ForeignKey(Opening, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    was_success = models.BooleanField()
    mode = models.CharField(max_length=32, default="opening_drill")

    def __str__(self):
        return f"{self.user.username} - {self.opening.name} - {'Success' if self.was_success else 'Fail'}"

# --- Quests ---

class DailyQuest(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    target_count = models.IntegerField(default=1) # e.g., 3 lines
    xp_reward = models.IntegerField(default=50)
    quest_type = models.CharField(max_length=50, choices=[
        ('complete_lines', 'Complete Lines'),
        ('fix_blunders', 'Fix Blunders'),
        ('perfect_streak', 'Perfect Streak')
    ])
    
    def __str__(self):
        return self.title

class UserQuestProgress(models.Model):
    profile = models.ForeignKey(UserProfile, related_name='quests', on_delete=models.CASCADE)
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    assigned_date = models.DateField(auto_now_add=True)
    
    class Meta:
        unique_together = ('profile', 'quest', 'assigned_date')
