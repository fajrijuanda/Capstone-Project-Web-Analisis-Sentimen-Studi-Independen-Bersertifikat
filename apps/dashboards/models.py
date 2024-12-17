from django.db import models
from django.contrib.auth.models import User  # Mengimpor model User bawaan Django

class TwitterData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    token = models.CharField(max_length=255, help_text="Twitter API Token")
    topic = models.CharField(max_length=255, help_text="Topic for Twitter data")
    date_from = models.DateField(help_text="Start date for data collection")
    date_until = models.DateField(help_text="End date for data collection")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Twitter Topic: {self.topic} (From {self.date_from} to {self.date_until})"


class CommentData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="User who input the comment")
    topic = models.CharField(max_length=255, help_text="Topic of the comment")
    comment = models.TextField(help_text="The content of the comment")
    created_at = models.DateTimeField(default=None, null=True, blank=True, help_text="Created date of the comment")
    twitter_data = models.ForeignKey(
        TwitterData, on_delete=models.CASCADE, null=True, blank=True, help_text="Related Twitter Data"
    )

    def __str__(self):
        return f"Comment by {self.user.username} on Topic: {self.topic}"
