from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse

from keymap.models import Program, Command, SettingsFile


class PagesTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x02\x00'
            b'\x01\x00\x80\x00\x00\x00\x00\x00'
            b'\xFF\xFF\xFF\x21\xF9\x04\x00\x00'
            b'\x00\x00\x00\x2C\x00\x00\x00\x00'
            b'\x02\x00\x01\x00\x00\x02\x02\x0C'
            b'\x0A\x00\x3B'
        )
        uploaded = SimpleUploadedFile(
            name='small.gif',
            content=small_gif,
            content_type='image/gif'
        )
        prog = Program.objects.create(
            title='PyCharm',
            slug='pycharm',
            icon=uploaded
        )
        command = Command.objects.create(
            program=prog,
            name="Cut",
            short_name="Cut",
        )

    def setUp(self):
        # Создаем авторизованный клиент
        self.user = User.objects.create_user(username='admin')
        self.authorized_client = Client()
        self.authorized_client.force_login(self.user)

    def test_pages_uses_correct_template(self):
        """URL-адрес использует соответствующий шаблон."""
        # Собираем в словарь пары "имя_html_шаблона: reverse(name)"
        templates_pages_names = {
            reverse('main'): 'keymap/index.html',
            reverse('login'): 'keymap/login.html',
            reverse('register'): 'keymap/register.html',
            reverse('add_program'): 'keymap/add_program.html',
            reverse('program', kwargs={'slug': 'pycharm'}): 'keymap/index.html',
            reverse('settings_file', args=['pycharm', '1']): 'keymap/index.html',
        }
        for reverse_name, template in templates_pages_names.items():
            with self.subTest(reverse_name=reverse_name):
                response = self.authorized_client.get(reverse_name)
                self.assertTemplateUsed(response, template)
