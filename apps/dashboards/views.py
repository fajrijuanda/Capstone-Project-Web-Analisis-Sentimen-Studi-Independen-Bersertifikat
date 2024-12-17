from django.views.generic import TemplateView
from web_project import TemplateLayout
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required  # Hanya untuk pengguna login
from .models import TwitterData, CommentData
from .processing import fetch_twitter_data, analyze_and_save_sentiment
from django.core.paginator import Paginator
from apps.comment.models import Result
from apps.dashboards.services import get_twitter_data, get_comments_with_results
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.dashboards.services import get_twitter_data, get_comments_with_results
from apps.dashboards.serializers import TwitterDataSerializer, CommentDataSerializer
from django.db.models import Sum, Count
from rest_framework.permissions import IsAuthenticated
from collections import defaultdict
from django.db.models import Q
from django.contrib.auth.models import User
import logging

logger = logging.getLogger(__name__)

"""
This file is a view controller for multiple pages as a module.
Here you can override the page view layout.
Refer to dashboards/urls.py file for more pages.
"""


class DashboardsView(TemplateView):
    # Predefined function
    def get_context_data(self, **kwargs):
        # A function to init the global layout. It is defined in web_project/__init__.py file
        context = TemplateLayout.init(self, super().get_context_data(**kwargs))
        context["is_front"] = False
        context["data"] = {
            "slides": [],  # Isi data default
        }
        return context


@login_required
def analytics_view(request):
    """
    View to prepare data for the analytics page for the logged-in user.
    """
    user = request.user  # Mendapatkan user yang sedang login

    # Group manual comments by topic
    manual_comments = (
        Result.objects.filter(
            comment__source="manual", comment__user=user
        )  # Filter berdasarkan user
        .select_related("comment")
        .values(
            "comment__topic",
            "positive_percentage",
            "neutral_percentage",
            "negative_percentage",
            "comment__comment",
        )
    )

    # Group Twitter data by topic (separated from manual comments)
    twitter_comments = (
        Result.objects.filter(
            comment__source="twitter", comment__user=user
        )  # Filter berdasarkan user
        .select_related("comment")
        .values(
            "comment__topic",
            "positive_percentage",
            "neutral_percentage",
            "negative_percentage",
            "comment__comment",
        )
    )

    # Process manual comments
    grouped_manual_comments = defaultdict(list)
    for comment in manual_comments:
        grouped_manual_comments[comment["comment__topic"]].append(comment)

    # Process Twitter comments
    grouped_twitter_comments = defaultdict(list)
    for comment in twitter_comments:
        grouped_twitter_comments[comment["comment__topic"]].append(comment)

    # Prepare slides data
    slides = []

    # Add manual comment slides
    for topic, comments in grouped_manual_comments.items():
        slide = {
            "title": f"Manual Comments - {topic}",
            "subtitle": f"{len(comments)} comments analyzed",
            "comments": comments[:9],  # Limit to top 9 comments (3 per sentiment)
        }
        slides.append(slide)

        # Add Twitter comment slides
        for topic, comments in grouped_twitter_comments.items():
            # Separate by sentiment without limiting the number of comments
            positive_comments = [
                c
                for c in comments
                if c["positive_percentage"] > c["neutral_percentage"]
                and c["positive_percentage"] > c["negative_percentage"]
            ]

            neutral_comments = [
                c
                for c in comments
                if c["neutral_percentage"] > c["positive_percentage"]
                and c["neutral_percentage"] > c["negative_percentage"]
            ]

            negative_comments = [
                c
                for c in comments
                if c["negative_percentage"] > c["positive_percentage"]
                and c["negative_percentage"] > c["neutral_percentage"]
            ]

            # Combine all comments
            slide = {
                "title": f"Twitter Data - {topic}",
                "subtitle": f"{len(comments)} comments analyzed",
                "comments": positive_comments + neutral_comments + negative_comments,
            }
            slides.append(slide)

    total_comments = CommentData.objects.count()

    # Data Traffic: Manual dan Twitter
    total_manual_comments = CommentData.objects.filter(
        twitter_data__isnull=True
    ).count()  # Komentar manual (tanpa TwitterData)
    total_twitter_comments = CommentData.objects.filter(
        twitter_data__isnull=False
    ).count()  # Komentar dari TwitterData

    # Topik Terpopuler
    popular_topics = (
        CommentData.objects.values("topic")
        .annotate(total=Count("id"))  # Hitung total komentar per topik
        .order_by("-total")[:3]  # Ambil 3 topik terpopuler
    )

    context = {
        "total_comments": total_comments,
        "total_manual_comments": total_manual_comments,
        "total_twitter_comments": total_twitter_comments,
        "popular_topics": popular_topics,
        "data": {"slides": slides},
    }
    return render(request, "dashboard_analytics.html", context)


@login_required
def add_comment(request):
    logger.info("Request method: %s", request.method)

    if request.method == "POST":
        try:
            input_type = request.POST.get("customRadioIcon")
            logger.info(f"Input type: {input_type}")

            if input_type == "comment":
                # Handle manual comment
                topic = request.POST.get("comment_topic")
                comment = request.POST.get("comment")

                if not all([topic, comment]):
                    return JsonResponse(
                        {
                            "status": "error",
                            "message": "Topic and comment are required",
                        },
                        status=400,
                    )

                # Save comment and process it
                comment_data = CommentData.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    topic=topic,
                    comment=comment,
                )

                # Analyze the manual comment
                result = analyze_and_save_sentiment(comment_data, is_twitter=False)

                return JsonResponse(result)

            elif input_type == "twitter":
                # Handle Twitter token input
                token = request.POST.get("token")
                topic = request.POST.get("topic")
                date_from = request.POST.get("date_from")
                date_until = request.POST.get("date_until")

                if not all([token, topic, date_from, date_until]):
                    return JsonResponse(
                        {
                            "status": "error",
                            "message": "All Twitter fields are required",
                        },
                        status=400,
                    )
                # Tentukan default limit = 100 untuk fetch_twitter_data
                limit = 200
                # Save TwitterData and process it
                twitter_data = TwitterData.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    token=token,
                    topic=topic,
                    date_from=date_from,
                    date_until=date_until,
                )

                # Analyze Twitter data
                result = analyze_and_save_sentiment(
                    twitter_data, is_twitter=True, auth_token=token
                )

                return JsonResponse(result)

            else:
                return JsonResponse(
                    {"status": "error", "message": "Invalid input type"}, status=400
                )

        except Exception as e:
            logger.error(f"Error in add_comment: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse(
        {"status": "error", "message": "Invalid request method"}, status=405
    )


class TwitterDataAPIView(APIView):
    def get(self, request):
        data = get_twitter_data()
        serializer = TwitterDataSerializer(data, many=True)
        return Response(serializer.data)


class CommentSummaryAPIView(APIView):
    """
    API endpoint to get total comments, manual comments, Twitter comments,
    and popular topics from CommentData model.
    """

    def get(self, request):
        # Data Total Komentar
        total_comments = CommentData.objects.count()

        # Data Traffic: Manual dan Twitter
        total_manual_comments = CommentData.objects.filter(
            twitter_data__isnull=True
        ).count()
        total_twitter_comments = CommentData.objects.filter(
            twitter_data__isnull=False
        ).count()

        # Topik Terpopuler
        popular_topics = (
            CommentData.objects.values("topic")
            .annotate(total=Count("id"))
            .order_by("-total")[:2]
        )

        # Hitung total pengguna
        total_users = User.objects.count()

        # Prepare response data
        data = {
            "total_users": total_users,
            "total_comments": total_comments,
            "total_manual_comments": total_manual_comments,
            "total_twitter_comments": total_twitter_comments,
            "popular_topics": popular_topics,
        }

        return Response({"status": "success", "data": data})


class AnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Filter komentar berdasarkan user yang sedang login
        comments = Result.objects.filter(comment__user=user).select_related("comment", "comment__twitter_data")
        total_comments = comments.count()

        slides = []
        topics = comments.values_list("comment__topic", flat=True).distinct()

        for topic in topics:
            topic_comments = comments.filter(comment__topic=topic)

            # Inisialisasi sentimen dominan
            positive_count = 0
            neutral_count = 0
            negative_count = 0

            # Inisialisasi total persentase
            total_positive_percentage = 0
            total_neutral_percentage = 0
            total_negative_percentage = 0

            slide_comments = []
            for result in topic_comments:
                positive = result.positive_percentage or 0
                neutral = result.neutral_percentage or 0
                negative = result.negative_percentage or 0

                # Tambahkan nilai persentase
                total_positive_percentage += positive
                total_neutral_percentage += neutral
                total_negative_percentage += negative

                # Tentukan sentimen dominan
                if positive > neutral and positive > negative:
                    positive_count += 1
                elif neutral > positive and neutral > negative:
                    neutral_count += 1
                elif negative > positive and negative > neutral:
                    negative_count += 1

                slide_comments.append({
                    "id": result.comment.id,
                    "text": result.comment.comment,
                    "positive": positive,
                    "neutral": neutral,
                    "negative": negative,
                    "keywords": result.keywords or "",
                    "created_at": result.comment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "startDate": (
                        result.comment.twitter_data.date_from.strftime("%Y-%m-%d")
                        if result.comment.twitter_data else None
                    ),
                    "endDate": (
                        result.comment.twitter_data.date_until.strftime("%Y-%m-%d")
                        if result.comment.twitter_data else None
                    ),
                })

            # Hitung rata-rata persentase jika ada komentar
            total_topic_comments = topic_comments.count()
            average_positive = (total_positive_percentage / total_topic_comments) if total_topic_comments else 0
            average_neutral = (total_neutral_percentage / total_topic_comments) if total_topic_comments else 0
            average_negative = (total_negative_percentage / total_topic_comments) if total_topic_comments else 0

            slides.append({
                "title": topic or "No Topic",
                "subtitle": "Overall Result",
                "comments": slide_comments,
                "sentiment_counts": {
                    "positive": positive_count,
                    "neutral": neutral_count,
                    "negative": negative_count,
                },
                "sentiment_percentage": {
                    "positive": average_positive,
                    "neutral": average_neutral,
                    "negative": average_negative,
                }
            })

        return Response({
            "status": "success",
            "total_comments": total_comments,
            "slides": slides,
        })
