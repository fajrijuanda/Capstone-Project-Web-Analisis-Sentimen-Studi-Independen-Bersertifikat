from django.db import models
from apps.dashboards.models import CommentData
from django.contrib.postgres.fields import JSONField

class Result(models.Model):
    comment = models.OneToOneField(CommentData, on_delete=models.CASCADE, related_name='result')
    positive_percentage = models.FloatField(default=0.0)
    neutral_percentage = models.FloatField(default=0.0)
    negative_percentage = models.FloatField(default=0.0)
    keywords = models.JSONField(default=dict)  # Simpan kata kunci sebagai JSON {"positive": [], "neutral": [], "negative": []}
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for Comment ID: {self.comment.id} - Positive: {self.positive_percentage}%, Neutral: {self.neutral_percentage}%, Negative: {self.negative_percentage}%"
