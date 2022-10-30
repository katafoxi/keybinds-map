import os.path
import shutil
import tempfile

from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import resolve, reverse

from conf.settings import BASE_DIR
from kmap.models import Action, Keymap, Prog
from kmap.utils import get_image_file
from kmap.views import contact

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
        prog = Prog.objects.create(
            pk=1, name="Testprog", slug="testprog", icon=PagesTest.uploaded
        )
        Action.objects.create(pk=1, prog=prog, name="Cut", short_name="Cut", )

    def setUp(self):
        # Создаем авторизованный клиент
        self.user = User.objects.create_user(username="admin")
        self.authorized_client = Client()
        self.authorized_client.force_login(self.user)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_contact_url_resolve_to_contact_view(self):
        """Тест: корневой url преобразуется в представление домашней страницы"""
        found = resolve("/contact/")
        self.assertEqual(found.func.__name__, contact.__name__)

    def test_pages_uses_correct_template(self):
        """URL-адрес использует соответствующий шаблон."""
        # Собираем в словарь пары "имя_html_шаблона: reverse(name)"
        templates_pages_names = {
            reverse("main"): "kmap/main.html",
            reverse("login"): "kmap/login.html",
            reverse("register"): "kmap/register.html",
            reverse("add_prog"): "kmap/add_prog.html",
            reverse("prog", kwargs={"slug": "testprog"}): "kmap/main.html",
            reverse("keymap", args=["testprog", "1"]): "kmap/main.html",
            reverse("keymap_analise", args=["testprog"]): "kmap/main.html",
        }
        for reverse_name, template in templates_pages_names.items():
            with self.subTest(reverse_name=reverse_name):
                response = self.authorized_client.get(reverse_name)
                self.assertTemplateUsed(response, template)

    def test_register_user_page_correct_save_new_user_and_redirect(self):
        count = User.objects.count()
        form_data = {
            "username": 'testuser',
            "email": 'testuser@mail.com',
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
        self.assertTemplateUsed(response, "kmap/login.html")

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


class AddProgTest(TestCase):

    def test_add_prog_page_show_correct_context(self):
        """Шаблон add_prog сформирован с правильным контекстом."""
        response = self.client.get(reverse("add_prog"))
        form_fields = {
            "name": forms.fields.CharField,
            "slug": forms.fields.SlugField,
            "icon": forms.fields.ImageField,
            "keymap_info": forms.fields.CharField,
            "site": forms.fields.URLField,
        }
        for value, expected in form_fields.items():
            with self.subTest(value=value):
                form_field = response.context.get("form").fields.get(value)
                self.assertIsInstance(form_field, expected)

    def test_add_prog_page_correct_save_new_prog_and_redirect(self):
        """Тест: сохранение новой программы в БД"""
        form_data = {
            "name": 'testprog',
            "site": "testprog.com",
            "slug": 'testprog',
            "keymap_info": "blabla",
        }
        file_data = {"icon": get_image_file(name="tempimg.png")}
        count = Prog.objects.count()
        response = self.client.post(
            path=reverse("add_prog"),
            data=form_data,
            file_data=file_data,
            follow=True
        )
        self.assertEqual(Prog.objects.count(), count + 1)
        self.assertRedirects(response, reverse("main"))


@override_settings(MEDIA_ROOT=os.path.join(BASE_DIR, 'testshow'))
class ShowProgActionsTest(TestCase):
    # fixtures = ["fixture_small", "users"]

    @classmethod
    def setUpTestData(cls):
        prog = Prog.objects.create(
            pk=1,
            name='testprog',
            slug='testprog',
            is_bounded=True
        )
        Action.objects.create(
            pk=1,
            prog=prog,
            name='act_wo_combs',
            short_name='acts_wo_combs'
        )
        owner = User.objects.create_user(
            pk=1,
            username='testuser',
            email='testuser@gmail.com'
        )
        keymap = Keymap.objects.create(
            pk=1,
            prog=prog,
            name='testkeymap',
            rating=5,
            owner=owner,
            file=ShowProgActionsTest.get_keymap_simple_uploaded_file()
        )

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(os.path.join(BASE_DIR, 'testshow'), ignore_errors=True)
        super().tearDownClass()

    @staticmethod
    def get_keymap_simple_uploaded_file(name='test'):
        with open(r'kmap/tests/test_pycharm_keymap_one.xml', 'rb') as xml_file:
            test_file = xml_file.read()
            test_keymap = SimpleUploadedFile(
                name=f'{name}.xml',
                content=test_file,
                content_type='text/xml'
            )
            return test_keymap

    # TODO мутное дело с папкой MEDIA_ROOT
    # https://djangoblog.ru/testing-and-media-files/
    # def test_get_request(self):
    #     slug = Prog.objects.first().slug
    #     keymap_id = Keymap.objects.first().id
    #     response = self.client.get(
    #         path=reverse("keymap", kwargs={"slug": slug, "id": keymap_id}),
    #     )
    #     self.assertEquals(response.context.get("current_keymap"), 1)
    #     self.assertEquals(len(response.context.get("acts_wo_combs")), 1)

    def test_post_request_to_analise_keymap(self):
        keymap = ShowProgActionsTest.get_keymap_simple_uploaded_file('test')
        resp = self.client.post(
            path=reverse('keymap_analise', kwargs={'slug': 'testprog'}),
            data={'file': keymap},
            follow=True
        )

        self.assertEquals(resp.status_code, 200)
        self.assertEqual(resp.context['analyzed_keymap'], 'test')

    # Проверка словаря контекста главной страницы
    def test_main_page_show_correct_context_without_current_prog(self):
        """Шаблон main.html сформирован с правильным контекстом."""
        response = self.client.get(reverse("main"))

        self.assertEquals(
            response.context["title"], "Выбор программы для редактора")
        self.assertEquals(response.context["prog_selected"], 0)
        self.assertEquals(response.context["progs"][0].name, "testprog")
        self.assertEquals(
            response.context["menu"],
            [
                {"title": "Главная", "url_name": "main"},
                {"title": "Обратная связь", "url_name": "contact"},
            ],
        )

    def test_main_page_correct_context_with_current_program(self):
        prog=Prog.objects.create(
            pk=2,
            name='prog_wo_keymap',
            slug='prog_wo_keymap',
        )
        slug = Prog.objects.filter(name="prog_wo_keymap")[0].slug

        resp = self.client.get(
            reverse("keymap", kwargs={"slug": slug, "id": 1}))

        self.assertEqual(
            resp.context.get("error_message"),
            'Поддержка программы prog_wo_keymap пока отсутствует.')
        self.assertEqual(resp.context.get("prog_selected"), prog)
