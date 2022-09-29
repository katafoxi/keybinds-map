import shutil
import tempfile

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from keymap.forms import *
from keymap.utils import get_image_file

# Создаем временную папку для медиа-файлов;
# на момент теста медиа папка будет переопределена

TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)

small_gif = (
    b'\x47\x49\x46\x38\x39\x61\x02\x00'
    b'\x01\x00\x80\x00\x00\x00\x00\x00'
    b'\xFF\xFF\xFF\x21\xF9\x04\x00\x00'
    b'\x00\x00\x00\x2C\x00\x00\x00\x00'
    b'\x02\x00\x01\x00\x00\x02\x02\x0C'
    b'\x0A\x00\x3B'
)
# small_gif = open(r'D:\_\keybinds_map\keybinds\keymap\tests\UGNX.png', mode='rb').read()

uploaded = SimpleUploadedFile(
    name='small.gif',
    content=small_gif,
)


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

# class AddSettingsFileFormTest(TestCase):

