from datetime import datetime

def compute_is_premium(status: str | None, current_period_end: datetime | None) -> bool:
    """
    Determines if a user should have premium access based on subscription status.
    """
    return status in {"active", "trialing"}
