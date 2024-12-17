from rest_framework import serializers
from apps.dashboards.models import TwitterData, CommentData
from apps.comment.models import Result
class TwitterDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TwitterData
        fields = ['id', 'topic', 'date_from', 'date_until']

class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = ['positive_percentage', 'negative_percentage', 'neutral_percentage']

class CommentDataSerializer(serializers.ModelSerializer):
    result = ResultSerializer()

    class Meta:
        model = CommentData
        fields = ['id', 'topic', 'comment', 'result']
