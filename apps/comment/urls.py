from django.urls import path
from .views import CommentView
from django.contrib.auth.decorators import login_required
from .views import top_topics_data

urlpatterns = [
    path(
        "comment",
        login_required(CommentView.as_view(template_name="app_comment.html")),
        name="comment",
    ),
    path("top-topics/", top_topics_data, name="top_topics_data"),
]
