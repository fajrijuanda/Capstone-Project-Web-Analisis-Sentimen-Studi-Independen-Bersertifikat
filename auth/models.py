from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.conf import settings
from django.dispatch import receiver
import os

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email = models.EmailField(max_length=100, unique=True)
    email_token = models.CharField(max_length=100, blank=True, null=True)
    forget_password_token = models.CharField(max_length=100, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Kolom tambahan
    role = models.CharField(max_length=50, choices=[('Admin', 'Admin'), ('User', 'User')], default='User')
    current_plan = models.CharField(max_length=50, default='Free')
    billing = models.CharField(max_length=100, default='N/A')
    status = models.CharField(max_length=20, choices=[('Active', 'Active'), ('Inactive', 'Inactive')], default='Active')

    # Avatar field
    avatar = models.ImageField(upload_to='avatars/', default='avatars/1.png', blank=True, null=True)

    def __str__(self):
        return self.user.username

    @receiver(post_save, sender=User)
    def create_profile(sender, instance, created, **kwargs):
        if created:
            Profile.objects.create(user=instance, email=instance.email)

    @receiver(post_save, sender=User)
    def save_profile(sender, instance, **kwargs):
        instance.profile.save()

    def delete_avatar_on_update(self):
        """Delete old avatar when updating with a new one."""
        if self.pk:
            old_avatar = Profile.objects.filter(pk=self.pk).first().avatar
            if old_avatar and old_avatar != self.avatar:
                old_avatar_path = os.path.join(settings.MEDIA_ROOT, str(old_avatar))
                if os.path.isfile(old_avatar_path):
                    os.remove(old_avatar_path)

    def save(self, *args, **kwargs):
        self.delete_avatar_on_update()
        super(Profile, self).save(*args, **kwargs)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
