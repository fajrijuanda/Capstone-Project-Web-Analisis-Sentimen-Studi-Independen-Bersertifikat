from apps.dashboards.models import TwitterData, CommentData

def get_twitter_data():
    return TwitterData.objects.all()

def get_comments_with_results():
    return CommentData.objects.prefetch_related('result').all()
