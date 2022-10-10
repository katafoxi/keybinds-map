import shutil
import tempfile
from pprint import pprint

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from keymap.forms import *
from keymap.utils import get_image_file

from keymap.views import AddProgram

TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class AddProgramFormTest(TestCase):
    """
    Форма добавления программы
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = AddProgramForm()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        # Создаем авторизованный клиент
        self.user = User.objects.create_user(username='ad', password='123')
        self.authorized_client = Client()
        self.authorized_client.force_login(user=self.user)

    @staticmethod
    def get_add_program_form(title='prog2'):
        # "Валидная форма создает запись в Program"
        form_data = {
            'title': title,
            'site': f'{title}.com',
            'slug': title,
            'settings_file_info': 'blabla',
        }
        file_data = {'icon': get_image_file(name='tempimg.png')}
        return AddProgramForm(form_data, file_data)

    def test_add_program_form_is_valid(self):
        self.form = self.get_add_program_form(title='prog2')
        self.assertTrue(self.form.is_valid())

    def test_add_program_form_clean_title(self):
        self.form = self.get_add_program_form(title='prog2' * 100)
        self.assertFalse(self.form.is_valid())
        with self.assertRaisesMessage(
                expected_exception=KeyError,
                expected_message='title'):
            self.form.clean_title()

    def test_add_program_save(self):
        """ Тест: сохранение новой программы в БД"""
        count = Program.objects.count()
        self.form = self.get_add_program_form(title='prog3')
        self.assertTrue(self.form.is_valid())
        response = self.authorized_client.post(
            path=reverse('add_program'),
            data=self.form.fields,
            follow=True
        )
        response.resolver_match.func.view_class.form_valid(self=AddProgram, form=self.form)
        self.assertEqual(Program.objects.count(), count + 1)


class AddSettingsFileFormTest(TestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = AddSettingsFileForm()

    @staticmethod
    def get_add_settings_file_form(name='setting_file', extend='xml', size=1):
        """ Валидная форма создает запись в setting_file """
        form_data = {
            'name': name,
        }
        simple_file = SimpleUploadedFile(name=f'temp_keymap.{extend}', content=b'content')
        simple_file.size = size
        file_data = {'file': simple_file, }
        return AddSettingsFileForm(form_data, file_data)

    def test_add_settings_file_form_is_valid(self):
        self.form = self.get_add_settings_file_form()
        self.assertTrue(self.form.is_valid(), f'Чего то не хватает {self.form.errors}')

    def test_add_settings_file_form_is_not_valid_extend(self):
        self.form = self.get_add_settings_file_form(extend='pdf')
        self.assertFalse(self.form.is_valid(), f'{self.form.errors}')

    def test_add_settings_file_form_big_size(self):
        self.form = self.get_add_settings_file_form(size=10484577)
        self.assertFalse(self.form.is_valid(), 'To Big file')
