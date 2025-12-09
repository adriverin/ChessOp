from django.utils import timezone
import datetime

def get_opening_drill_badges(user, opening, stats, attempts_queryset, srs_qs):
    """
    Computes badges for a specific user and opening.
    """
    badges = []

    # 1. First Steps
    # Condition: 5 total successful drill attempts in this opening (lifetime)
    # Using reviews_today + reviews_last_7_days is partial; better check lifetime success count if possible.
    # stats includes reviews count but not total lifetime.
    # Let's use the attempts_queryset (filtered by opening) to count lifetime successes.
    
    lifetime_successes = attempts_queryset.filter(was_success=True).count()
    badges.append({
        "id": "first_steps",
        "name": "First Steps",
        "description": "Complete 5 successful drill attempts in this opening.",
        "earned": lifetime_successes >= 5
    })

    # 2. Line Collector
    # Condition: Master all lines in this opening.
    badges.append({
        "id": "line_collector",
        "name": "Line Collector",
        "description": "Master all lines in this opening.",
        "earned": stats["mastered_variations"] == stats["total_variations"] and stats["total_variations"] > 0
    })

    # 3. Grinder
    # Condition: Longest streak >= 10
    badges.append({
        "id": "grinder",
        "name": "Grinder",
        "description": "Achieve a flawless streak of 10 or more.",
        "earned": stats["longest_flawless_streak"] >= 10
    })

    # 4. Daily Warrior
    # Condition: Reviewed >= 10 lines today
    badges.append({
        "id": "daily_warrior",
        "name": "Daily Warrior",
        "description": "Review 10 or more lines today.",
        "earned": stats["reviews_today"] >= 10
    })
    
    # 5. Master Tactician (Example extra)
    # Condition: Mastery percentage >= 50%
    badges.append({
        "id": "master_tactician",
        "name": "Halfway There",
        "description": "Master at least 50% of the variations.",
        "earned": stats["mastery_percentage"] >= 0.50
    })

    return badges

