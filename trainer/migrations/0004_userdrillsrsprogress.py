from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('trainer', '0003_variation_difficulty_variation_themes_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserDrillSRSProgress',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ease_factor', models.FloatField(default=2.5)),
                ('interval_days', models.FloatField(default=0.0)),
                ('due_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_result', models.CharField(blank=True, choices=[('success', 'Success'), ('failure', 'Failure')], default='', max_length=10)),
                ('streak', models.IntegerField(default=0)),
                ('total_attempts', models.IntegerField(default=0)),
                ('total_successes', models.IntegerField(default=0)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='drill_srs_progress', to='trainer.userprofile')),
                ('variation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='drill_srs_data', to='trainer.variation')),
            ],
            options={
                'unique_together': {('profile', 'variation')},
            },
        ),
    ]

