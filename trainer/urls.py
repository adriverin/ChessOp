from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    
    # Auth
    path('api/auth/signup/', views.api_signup, name='api_signup'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/me/', views.api_me, name='api_me'),

    path('api/dashboard/', views.api_get_dashboard_data, name='api_get_dashboard_data'),
    path('api/openings/', views.api_get_openings, name='api_get_openings'),
    path('api/repertoire/', views.api_get_repertoire, name='api_get_repertoire'),
    path('api/repertoire/toggle/', views.api_toggle_repertoire, name='api_toggle_repertoire'),
    path('api/recall/session/', views.api_get_recall_session, name='api_get_recall_session'),
    path('api/submit-result/', views.api_submit_result, name='api_submit_result'),
    path('api/stats/themes/', views.api_get_theme_stats, name='api_get_theme_stats'),
    path('api/opening-drill/session/', views.api_get_opening_drill_session, name='api_get_opening_drill_session'),
    path('api/opening-drill/openings/', views.api_get_opening_drill_openings, name='api_get_opening_drill_openings'),
    path('api/opening-drill/progress/', views.api_get_opening_drill_progress, name='api_get_opening_drill_progress'),
    path('api/opening-drill/stats/', views.api_get_opening_drill_stats, name='api_get_opening_drill_stats'),
    
    # Billing
    path('api/billing/create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('api/billing/create-portal-session/', views.create_portal_session, name='create_portal_session'),
    path('api/billing/webhook/', views.stripe_webhook, name='stripe_webhook'),
]
