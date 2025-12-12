from datetime import datetime
from django.utils import timezone


def compute_is_premium(
    status: str | None,
    current_period_end: datetime | None,
    *,
    cancel_at_period_end: bool | None = False,
) -> bool:
    """Compute whether a user should have premium access.

    Premium access is granted when a subscription is active or trialing. If the
    subscription is set to cancel at period end, the user keeps premium access
    until the current period end is reached.
    """
    now = timezone.now()

    if status in {"active", "trialing"}:
        return True

    if cancel_at_period_end and current_period_end:
        return now < current_period_end

    return False


def compute_effective_status(
    status: str | None,
    current_period_end: datetime | None,
    *,
    cancel_at_period_end: bool | None = False,
) -> str | None:
    """Return a UI-friendly effective subscription status."""
    if cancel_at_period_end and current_period_end and timezone.now() < current_period_end:
        return "active_canceling"
    return status
