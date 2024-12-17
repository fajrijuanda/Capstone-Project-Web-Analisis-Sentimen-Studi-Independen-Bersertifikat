from django.http import JsonResponse
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.conf import settings
from web_project import TemplateLayout
from apps.dashboards.models import CommentData
from apps.comment.models import Result  # Tambahkan import untuk model Result
from django.http import JsonResponse
from django.db.models import Count


class CommentView(LoginRequiredMixin, TemplateView):
    permission_required = "comment.view_comment"

    @method_decorator(login_required)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_context_data(self, **kwargs):
        # Inisialisasi global layout dengan TemplateLayout
        context = TemplateLayout.init(self, super().get_context_data(**kwargs))
        return context

    def get(self, request, *args, **kwargs):
        # Cek apakah permintaan merupakan AJAX request
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            # Ambil data komentar dari model CommentData dan join dengan Result
            comments = (
                CommentData.objects.select_related("user", "user__profile", "twitter_data")
                .prefetch_related("result")
                .all()
            )

            # Format data untuk DataTables atau tampilan JSON
            data = []
            for comment in comments:
                # Ambil hasil sentimen dari model Result
                result = getattr(comment, "result", None)
                sentiment = None
                if result:
                    # Tentukan sentimen berdasarkan nilai terbesar
                    if (
                        result.positive_percentage > result.neutral_percentage
                        and result.positive_percentage > result.negative_percentage
                    ):
                        sentiment = "Positive"
                    elif (
                        result.neutral_percentage > result.positive_percentage
                        and result.neutral_percentage > result.negative_percentage
                    ):
                        sentiment = "Neutral"
                    elif (
                        result.negative_percentage > result.positive_percentage
                        and result.negative_percentage > result.neutral_percentage
                    ):
                        sentiment = "Negative"
                    else:
                        sentiment = "Mixed/Equal"

                # Tambahkan data komentar
                data.append(
                    {
                        "id": comment.id,
                        "username": comment.user.username,
                        "email": comment.user.email,  # Tambahkan email user
                        "avatar": (
                            comment.user.profile.avatar.url
                            if comment.user.profile.avatar
                            else None
                        ),  # Ambil avatar dari Profile
                        "topic": comment.topic,
                        "topic": comment.topic,
                        "comment": comment.comment,
                        "date": comment.created_at.strftime("%Y-%m-%d %H:%M:%S") if comment.created_at else "N/A",
                        "twitter_data": {
                            "id": (
                                comment.twitter_data.id
                                if comment.twitter_data
                                else "N/A"
                            ),
                            "date_from": (
                                comment.twitter_data.date_from.strftime("%Y-%m-%d")
                                if comment.twitter_data
                                and comment.twitter_data.date_from
                                else "N/A"
                            ),
                            "date_until": (
                                comment.twitter_data.date_until.strftime("%Y-%m-%d")
                                if comment.twitter_data
                                and comment.twitter_data.date_until
                                else "N/A"
                            ),
                        },
                        "sentiment": sentiment,  # Tambahkan hasil sentimen
                    }
                )

            return JsonResponse({"data": data})
        else:
            # Jika bukan AJAX request, render template
            return super().get(request, *args, **kwargs)
        

def top_topics_data(request):
    # Ambil topik dengan jumlah komentar terbanyak
    top_topics = (
        CommentData.objects
        .values('topic')
        .annotate(total=Count('id'))
        .order_by('-total')[:5]  # Ambil 5 topik terbanyak
    )
    labels = [topic['topic'] for topic in top_topics]
    data = [topic['total'] for topic in top_topics]
    return JsonResponse({'labels': labels, 'data': data})    
