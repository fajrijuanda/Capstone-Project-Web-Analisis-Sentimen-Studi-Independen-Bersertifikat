from django.http import JsonResponse
from auth.models import Profile
from django.views.generic import TemplateView
from web_project import TemplateLayout
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.conf import settings  # Tambahkan untuk mendapatkan MEDIA_URL


class UsersView(PermissionRequiredMixin, TemplateView):
    permission_required = ("user.view_user", "user.delete_user", "user.change_user", "user.add_user")

    @method_decorator(login_required)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_context_data(self, **kwargs):
        context = TemplateLayout.init(self, super().get_context_data(**kwargs))
        # Hitung jumlah user
        total_users = Profile.objects.count()
        active_users = Profile.objects.filter(status="Active").count()
        non_active_users = Profile.objects.exclude(status="Active").count()
        pending_users = Profile.objects.filter(status="Pending").count()

        # Hitung persentase
        def calculate_percentage(part, whole):
            return round((part / whole) * 100, 2) if whole > 0 else 0

        active_percentage = calculate_percentage(active_users, total_users)
        non_active_percentage = calculate_percentage(non_active_users, total_users)
        pending_percentage = calculate_percentage(pending_users, total_users)

        # Tambahkan ke context
        context['user_stats'] = {
            'total_users': total_users,
            'active_users': active_users,
            'active_percentage': active_percentage,
            'non_active_users': non_active_users,
            'non_active_percentage': non_active_percentage,
            'pending_users': pending_users,
            'pending_percentage': pending_percentage
        }
        return context

    def get(self, request, *args, **kwargs):
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Ambil data profil
            profiles = Profile.objects.select_related('user').all().values(
                'id',
                'user__username',  # Nama pengguna
                'email',           # Email
                'role',            # Role pengguna
                'status',          # Status pengguna
                'avatar'           # Avatar
            )

            # Buat data JSON untuk DataTables
            data = [
                {
                    'id': profile['id'],
                    'full_name': profile['user__username'],
                    'email': profile['email'],
                    'role': profile['role'],
                    'status': 2 if profile['status'] == 'Active' else 3,  # Status ke numerik sesuai DataTables
                    'avatar': request.build_absolute_uri(settings.MEDIA_URL + profile['avatar']) if profile['avatar'] else request.build_absolute_uri(settings.MEDIA_URL + 'avatars/1.png'),
                    'action': ''  # Placeholder untuk aksi
                }
                for profile in profiles
            ]

            return JsonResponse({'data': data})
        else:
            # Render template jika bukan AJAX request
            return super().get(request, *args, **kwargs)
