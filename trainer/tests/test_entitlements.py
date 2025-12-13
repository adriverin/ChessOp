from django.test import TestCase
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from trainer.entitlements import has_premium_override, user_has_premium_access
from trainer.models import UserProfile

class EntitlementTests(TestCase):
    def setUp(self):
        # Create standard user
        self.user = User.objects.create_user(username='testuser', password='password')
        # UserProfile is created via signal, but let's ensure it exists
        if not hasattr(self.user, 'profile'):
            UserProfile.objects.create(user=self.user)

    def test_standard_user_no_premium(self):
        self.assertFalse(self.user.profile.is_premium)
        self.assertFalse(has_premium_override(self.user))
        self.assertFalse(user_has_premium_access(self.user))

    def test_standard_user_with_subscription(self):
        self.user.profile.is_premium = True
        self.user.profile.save()
        
        self.assertFalse(has_premium_override(self.user))
        self.assertTrue(user_has_premium_access(self.user))

    def test_staff_user(self):
        self.user.is_staff = True
        self.user.save()
        
        self.assertTrue(has_premium_override(self.user))
        self.assertTrue(user_has_premium_access(self.user))

    def test_superuser(self):
        self.user.is_superuser = True
        self.user.save()
        
        self.assertTrue(has_premium_override(self.user))
        self.assertTrue(user_has_premium_access(self.user))

    def test_group_override(self):
        group = Group.objects.create(name='premium_override')
        self.user.groups.add(group)
        
        self.assertTrue(has_premium_override(self.user))
        self.assertTrue(user_has_premium_access(self.user))

    def test_permission_override(self):
        content_type = ContentType.objects.get_for_model(UserProfile)
        perm = Permission.objects.get(codename='premium_override', content_type=content_type)
        self.user.user_permissions.add(perm)
        # Reload user to update cache
        self.user = User.objects.get(pk=self.user.pk)

        self.assertTrue(has_premium_override(self.user))
        self.assertTrue(user_has_premium_access(self.user))
