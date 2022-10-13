from django.test import TestCase
from keymap.models import *


class ProgramModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Program.objects.create(
            title='PyCharm',
            slug='pycharm',
        )

    def test_title_label(self):
        prog = Program.objects.get(id=1)
        field_label = prog._meta.get_field('title').verbose_name
        self.assertEquals(field_label, 'Название программы')

    def test_title_max_length(self):
        prog = Program.objects.get(id=1)
        max_length = prog._meta.get_field('title').max_length
        self.assertEquals(max_length, 100)

    def test_slug_label(self):
        prog = Program.objects.get(id=1)
        field_label = prog._meta.get_field('slug').verbose_name
        self.assertEquals(field_label, 'URL')

    def test_slug_max_length(self):
        prog = Program.objects.get(id=1)
        max_length = prog._meta.get_field('slug').max_length
        self.assertEquals(max_length, 100)

    def test_get_absolute_url(self):
        prog = Program.objects.get(id=1)
        self.assertEquals(prog.get_absolute_url(), '/program/pycharm/2')

    def test_str(self):
        prog = Program.objects.get(pk=1)
        self.assertEquals(prog.__str__(), "PyCharm")


class CommandModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        prog = Program.objects.create(
            title='PyCharm',
            slug='pycharm',
        )
        prog.save()
        command = Command.objects.create(
            program=prog,
            name="Cut",
            short_name="Cut",
        )
        command.save()

    def test_program_field(self):
        command = Command.objects.get(id=1)
        program_field = command.program.slug
        self.assertEquals(program_field, "pycharm")

    def test_name_max_length(self):
        command = Command.objects.get(id=1)
        max_length = command._meta.get_field('name').max_length
        self.assertEquals(max_length, 250)

    def test_short_name_max_length(self):
        command = Command.objects.get(id=1)
        max_length = command._meta.get_field('short_name').max_length
        self.assertEquals(max_length, 100)

    # def test_get_absolute_url(self):
    #     command = Command.objects.get(id=1)
    #     self.assertEquals(command.get_absolute_url(), '/program/pycharm/2')

    def test_command_icons_directory_path(self):
        command = Command.objects.get(id=1)
        path = command._meta.get_field("icon").upload_to(command, filename='Cut.png')
        self.assertEquals(path, 'pycharm_command_icons/Cut.png')

    def test_str(self):
        prog = Command.objects.get(pk=1)
        self.assertEquals(prog.__str__(), "Cut")


class SettingsFileTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        prog = Program.objects.create(
            title='PyCharm',
            slug='pycharm',
        )
        prog.save()
        user = User.objects.create(
            username='anonymous',
            email='anonymous@gmail.com'
        )
        SettingsFile.objects.create(
            program=prog,
            name='empty',
            rating=5,
            owner=user,
        )

    def test_settings_file_program_field(self):
        set_file = SettingsFile.objects.get(id=1)
        program_field = set_file.program.slug
        self.assertEquals(program_field, "pycharm")

    def test_settings_file_name_max_length(self):
        setting_file = SettingsFile.objects.get(id=1)
        max_length = setting_file._meta.get_field('name').max_length
        self.assertEquals(max_length, 100)

    def test_settings_file_name_label(self):
        setting_file = SettingsFile.objects.get(id=1)
        label = setting_file._meta.get_field('name').verbose_name
        self.assertEquals(label, 'Название роли')

    def test_settings_file_path(self):
        file = SettingsFile.objects.get(id=1)
        path = file._meta.get_field("file").upload_to(file, filename='empty.xml')
        self.assertEquals(path, 'pycharm_setting_files/1/empty.xml')

    def test_rating(self):
        file = SettingsFile.objects.get(id=1)
        rating = file.rating
        self.assertEquals(rating, 5)

    def test_file_owner(self):
        file = SettingsFile.objects.get(id=1)
        owner = file.owner.username
        self.assertEquals(owner, 'anonymous')

    def test_get_absolute_url(self):
        file = SettingsFile.objects.get(id=1)
        self.assertEquals(file.get_absolute_url(), '/program/pycharm/1')
