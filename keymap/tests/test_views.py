import shutil

from django import forms
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse, resolve

from conf import settings
from keymap.keyboard import Keyboard
from keymap.models import Program, Command, SettingsFile
from keymap.utils import get_image_file
from keymap.views import contact, AddProgram, ShowProgramCommands
import tempfile

TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PagesTest(TestCase):
    small_gif = (
        b"\x47\x49\x46\x38\x39\x61\x02\x00"
        b"\x01\x00\x80\x00\x00\x00\x00\x00"
        b"\xFF\xFF\xFF\x21\xF9\x04\x00\x00"
        b"\x00\x00\x00\x2C\x00\x00\x00\x00"
        b"\x02\x00\x01\x00\x00\x02\x02\x0C"
        b"\x0A\x00\x3B"
    )
    uploaded = SimpleUploadedFile(
        name="small.gif", content=small_gif, content_type="image/gif"
    )

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        prog = Program.objects.create(
            title="PyCharm", slug="pycharm", icon=PagesTest.uploaded
        )
        Command.objects.create(
            program=prog,
            name="Cut",
            short_name="Cut",
        )

    def setUp(self):
        # Создаем авторизованный клиент
        self.user = User.objects.create_user(username="admin")
        self.authorized_client = Client()
        self.authorized_client.force_login(self.user)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        # Метод shutil.rmtree удаляет директорию и всё её содержимое
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def test_contact_url_resolve_to_contact_view(self):
        """Тест: корневой url преобразуется в представление домашней страницы"""
        found = resolve("/contact/")
        self.assertEqual(found.func.__name__, contact.__name__)

    def test_pages_uses_correct_template(self):
        """URL-адрес использует соответствующий шаблон."""
        # Собираем в словарь пары "имя_html_шаблона: reverse(name)"
        templates_pages_names = {
            reverse("main"): "keymap/index.html",
            reverse("login"): "keymap/login.html",
            reverse("register"): "keymap/register.html",
            reverse("add_program"): "keymap/add_program.html",
            reverse("program", kwargs={"slug": "pycharm"}): "keymap/index.html",
            reverse("settings_file", args=["pycharm", "1"]): "keymap/index.html",
            reverse("settings_file_analise", args=["pycharm"]): "keymap/index.html",
        }
        for reverse_name, template in templates_pages_names.items():
            with self.subTest(reverse_name=reverse_name):
                response = self.authorized_client.get(reverse_name)
                self.assertTemplateUsed(response, template)

    # Проверка словаря контекста главной страницы
    def test_index_page_show_correct_context(self):
        """Шаблон index сформирован с правильным контекстом."""
        response = self.authorized_client.get(reverse("main"))
        self.assertEquals(response.context["title"], "Выбор программы для редактора")
        self.assertEquals(response.context["prog_selected"], 0)
        self.assertEquals(response.context["programs"][0].title, "PyCharm")
        self.assertEquals(
            response.context["menu"],
            [
                {"title": "Главная", "url_name": "main"},
                {"title": "Обратная связь", "url_name": "contact"},
            ],
        )

    def test_add_program_page_show_correct_context(self):
        """Шаблон add_program сформирован с правильным контекстом."""
        response = self.authorized_client.get(reverse("add_program"))
        form_fields = {
            "title": forms.fields.CharField,
            "slug": forms.fields.SlugField,
            "icon": forms.fields.ImageField,
            "settings_file_info": forms.fields.CharField,
            "site": forms.fields.URLField,
        }
        for value, expected in form_fields.items():
            with self.subTest(value=value):
                form_field = response.context.get("form").fields.get(value)
                self.assertIsInstance(form_field, expected)

    def test_add_program_page_correct_save_new_program_and_redirect(self):
        """Тест: сохранение новой программы в БД"""
        form_data = {
            "title": 'test',
            "site": "testprog.com",
            "slug": 'test',
            "settings_file_info": "blabla",
        }
        file_data = {"icon": get_image_file(name="tempimg.png")}
        count = Program.objects.count()
        response = self.authorized_client.post(
            path=reverse("add_program"),
            data=form_data,
            file_data=file_data,
            follow=True
        )
        self.assertEqual(Program.objects.count(), count + 1)
        self.assertRedirects(response, reverse("main"))

    def test_register_user_page_correct_save_new_user_and_redirect(self):
        count = User.objects.count()
        form_data = {
            "username": 'test',
            "email": 'testest@mail.com',
            "password1": '123456789@123',
            "password2": '123456789@123',
        }
        response = self.client.post(
            path=reverse("register"), data=form_data, follow=True, secure=True
        )
        self.assertRedirects(response, reverse('main'))
        self.assertEqual(User.objects.count(), count + 1)

    def test_login_page_return_correct_html(self):
        """Тест: страница контактов возвращает правильный html"""
        response = self.client.get("/login/")
        self.assertTemplateUsed(response, "keymap/login.html")

    def test_login_page_redirect_after_success(self):
        """Тест: возможность залогиниться"""
        self.client = Client()
        self.user = User.objects.create_user(
            username="ivan", email="ivan@gmail.com", password="top_secret"
        )
        self.user.save()
        response = self.client.post(
            path="/login/",
            data={"username": self.user.username, "password": "top_secret"},
            secure=True,
        )
        new_client = User.objects.last()
        self.assertEqual(new_client.username, "ivan")
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(
            response,
            expected_url=reverse("main"),
            fetch_redirect_response=False,
        )

    def test_logout_page_correct_redirect(self):
        response = self.client.get(
            path=reverse("logout"),
        )
        self.assertRedirects(response, reverse("main"))


class ShowProgramCommandsTest(TestCase):
    fixtures = ["fixture_small", "users"]

    def test_get_request(self):
        slug = Program.objects.first().slug
        settings_file_id = SettingsFile.objects.first().id
        response = self.client.get(
            path=reverse(
                "settings_file", kwargs={"slug": slug, "id": settings_file_id}
            ),
        )
        self.assertEquals(response.context.get("current_settings_file"), 1)
        self.assertEquals(len(response.context.get("commands_without_shortcuts")), 2)

    def test_post_request_to_analise_settings_file(self):
        with open(r'keymap/tests/test_pycharm_settings_file_one.xml', 'rb') as xml_file:
            test_file = xml_file.read()

            request_data = {
                'file': SimpleUploadedFile(
                    name='test.xml',
                    content=test_file,
                    content_type='text/xml'
                )
            }
        resp = self.client.post(
            path=reverse('settings_file_analise', kwargs={'slug': 'pycharm'}),
            data=request_data,
            follow=True
        )
        self.assertEquals(resp.status_code, 200)
        self.assertEqual(resp.context['analyzed_settings_file'], 'test')


