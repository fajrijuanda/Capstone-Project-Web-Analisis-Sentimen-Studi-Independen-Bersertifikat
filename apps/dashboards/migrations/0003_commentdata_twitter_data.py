# Generated by Django 5.1.2 on 2024-12-15 11:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboards', '0002_twitterdata_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='commentdata',
            name='twitter_data',
            field=models.ForeignKey(blank=True, help_text='Related Twitter Data', null=True, on_delete=django.db.models.deletion.CASCADE, to='dashboards.twitterdata'),
        ),
    ]
