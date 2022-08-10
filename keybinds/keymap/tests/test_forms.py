import tempfile
import shutil
from io import BytesIO

from PIL import Image
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files import File
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.core.files.images import ImageFile

from keymap.models import *
from keymap.forms import *
"""
# Создаем временную папку для медиа-файлов;
# на момент теста медиа папка будет переопределена
TEMP_MEDIA_ROOT = tempfile.mkdtemp(dir=settings.BASE_DIR)


# Для сохранения media-файлов в тестах будет использоваться
# временная папка TEMP_MEDIA_ROOT, а потом мы ее удалим
@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class AddProgramFormTest(TestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        prog = Program.objects.create(
            title='Vi',
            slug='vi',

        )
        # user = User.objects.create(
        #     username='anonymous',
        #     email='anonymous@gmail.com'
        # )
        # settings_file = SettingsFile.objects.create(
        #     program=prog,
        #     name='empty',
        #     rating=5,
        #     owner=user,
        # )
        cls.form = AddProgramForm()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.guest_client = Client(SERVER_NAME='localhost')

    @staticmethod
    def get_image_file(name, ext='png', size=(50, 50), color=(256, 0, 0)):
        file_obj = BytesIO()
        image = Image.new("RGBA", size=size, color=color)
        image.save(file_obj, ext)
        file_obj.seek(0)
        return File(file_obj, name=name)

    def test_add_program(self):
        # "Валидная форма создает запись в Program"
        program_count = Program.objects.count()
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
        form_data = {
            'title': 'test',
            'slug': 'test',
            'icon': uploaded,
            'site': 'test.com'
        }
        
        response = self.guest_client.post(
            path=reverse('add_program'),
            data=form_data,
            follow=True
        )
        self.assertRedirects(response, reverse('main'))
        self.assertEqual(Program.objects.count(), program_count + 1)
        self.assertTrue(
            Program.objects.filter(
                slug='test',
            ).exists()
        )
"""