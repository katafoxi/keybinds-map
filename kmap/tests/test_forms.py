import shutil
import tempfile

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from kmap.forms import *
from kmap.utils import get_image_file

TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class AddProgramFormTest(TestCase):
    """
    Форма добавления программы
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = AddProgForm()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        # Создаем авторизованный клиент
        self.user = User.objects.create_user(username="ad", password="123")
        self.authorized_client = Client()
        self.authorized_client.force_login(user=self.user)

    def test_add_prog_form_is_valid(self):
        form_data = {
            "name": 'test',
            "site": "testprog.com",
            "slug": 'test',
            "keymap_info": "blabla",
        }
        file_data = {"icon": get_image_file(name="tempimg.png")}
        self.form = AddProgForm(form_data, file_data)
        self.assertTrue(self.form.is_valid())

    def test_add_prog_form_clean_title(self):
        form_data = {
            "name": 'test' * 100,
            "site": "testprog.com",
            "slug": 'test',
            "keymap_info": "blabla",
        }
        file_data = {"icon": get_image_file(name="tempimg.png")}
        self.form = AddProgForm(form_data, file_data)
        self.assertFalse(self.form.is_valid())
        with self.assertRaisesMessage(expected_exception=KeyError,
                                      expected_message="name"):
            self.form.clean_title()


class AddKeymapFormTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = AddKeymapForm()

    @staticmethod
    def get_add_keymap_form(name="testkeymap", extend="xml", size=1):
        """Валидная форма создает запись в keymap"""
        form_data = {
            "name": name,
        }
        simple_file = SimpleUploadedFile(
            name=f"temp_keymap.{extend}", content=b"content"
        )
        simple_file.size = size
        file_data = {
            "file": simple_file,
        }
        return AddKeymapForm(form_data, file_data)

    def test_add_keymap_form_is_valid(self):
        self.form = self.get_add_keymap_form()
        self.assertTrue(self.form.is_valid(),
                        f"Чего то не хватает {self.form.errors}")

    def test_add_keymap_form_is_not_valid_extend(self):
        self.form = self.get_add_keymap_form(extend="pdf")
        self.assertFalse(self.form.is_valid(), f"{self.form.errors}")

    def test_add_keymap_form_big_size(self):
        self.form = self.get_add_keymap_form(size=10484577)
        self.assertFalse(self.form.is_valid(), "To Big file")


class RegisterFormTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = RegisterForm()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()

    def test_register_user_form_is_valid(self):
        form_data = {
            "username": 'test',
            "email": 'testest@mail.com',
            "password1": '123456789@123',
            "password2": '123456789@123',
        }
        self.form = RegisterForm(form_data)
        self.assertTrue(self.form.is_valid())
