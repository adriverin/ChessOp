from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('api/dashboard/', views.api_get_dashboard_data, name='api_get_dashboard_data'),
    path('api/openings/', views.api_get_openings, name='api_get_openings'),
    path('api/recall/session/', views.api_get_recall_session, name='api_get_recall_session'),
    path('api/submit-result/', views.api_submit_result, name='api_submit_result'),
]
