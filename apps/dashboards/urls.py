from django.urls import path
from django.contrib.auth.decorators import login_required
from .views import (
    DashboardsView,
    add_comment,
    TwitterDataAPIView,
    CommentSummaryAPIView,
    AnalyticsAPIView,
)


urlpatterns = [
    path(
        "analytics/",
        login_required(
            DashboardsView.as_view(template_name="dashboard_analytics.html")
        ),
        name="index",
    ),
    path(
        "dashboard/crm/",
        login_required(DashboardsView.as_view(template_name="dashboard_crm.html")),
        name="dashboard-crm",
    ),
    path("add_comment/", add_comment, name="add_comment"),
    path("api/twitter-data/", TwitterDataAPIView.as_view(), name="twitter-data"),
    path("api/analytics/", AnalyticsAPIView.as_view(), name="analytics"),
    path("api/comment-summary/", CommentSummaryAPIView.as_view(), name="comment-summary-api"),
]
