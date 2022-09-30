import shutil
import tempfile
from pprint import pprint

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from keymap.forms import *
from keymap.utils import get_image_file

# Создаем временную папку для медиа-файлов;
# на момент теста медиа папка будет переопределена

TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)


# Для сохранения media-файлов в тестах будет использоваться
# временная папка TEMP_MEDIA_ROOT, а потом мы ее удалим
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
        self.user = User.objects.create_user(username='ad')
        self.authorized_client = Client()
        self.authorized_client.force_login(user=self.user)

    @staticmethod
    def get_add_program_form(title='prog2'):
        # "Валидная форма создает запись в Program"
        form_data = {
            'title': title,
            'site': 'prog2.com',
            'slug': 'prog2',
            'settings_file_info': 'blabla',
        }
        file_data = {'icon': get_image_file(name='tempimg.png')}
        return AddProgramForm(form_data, file_data)

    def test_add_program_form_is_valid(self):
        self.form = self.get_add_program_form(title='prog2')
        # print("form valid: ", self.form.is_valid())
        self.assertTrue(self.form.is_valid())

    def test_add_program_form_clean_title(self):
        self.form = self.get_add_program_form(title='prog2' * 100)
        self.assertFalse(self.form.is_valid())
        self.assertRaisesMessage(ValidationError, ValidationError)


class AddSettingsFileFormTest(TestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.form = AddSettingsFileForm()

    @staticmethod
    def get_add_settings_file_form(name='setting_file', extend='xml', size=1):
        # "Валидная форма создает запись в setting_file"
        form_data = {
            'name': name,
        }
        simple_file = SimpleUploadedFile(name=f'temp_keymap.{extend}', content=b'content')
        simple_file.size = size
        file_data = {'file': simple_file, }
        return AddSettingsFileForm(form_data, file_data)

    def test_add_settings_file_form_is_valid(self):
        self.form = self.get_add_settings_file_form()
        # pprint(self.form.errors)
        self.assertTrue(self.form.is_valid(), f'Чего то не хватает {self.form.errors}')

    def test_add_settings_file_form_is_not_valid_extend(self):
        self.form = self.get_add_settings_file_form(extend='pdf')
        # pprint(self.form.errors)
        self.assertFalse(self.form.is_valid(), f'{self.form.errors}')

    def test_add_settings_file_form_big_size(self):
        self.form = self.get_add_settings_file_form(size=10484577)
        self.assertFalse(self.form.is_valid(), 'To Big file')
