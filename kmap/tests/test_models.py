from django.test import TestCase
from kmap.models import *


class ProgModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Prog.objects.create(
            pk=1,
            name='Testprog',
            slug='testprog',
        )

    def test_name_label(self):
        prog = Prog.objects.get(id=1)
        field_label = prog._meta.get_field('name').verbose_name
        self.assertEquals(field_label, 'Название программы')
        field_help_text = prog._meta.get_field('name').help_text
        self.assertEquals(field_help_text, 'Введите название программы')

    def test_name_max_length(self):
        prog = Prog.objects.get(id=1)
        max_length = prog._meta.get_field('name').max_length
        self.assertEquals(max_length, 100)

    def test_slug_label(self):
        prog = Prog.objects.get(id=1)
        field_label = prog._meta.get_field('slug').verbose_name
        self.assertEquals(field_label, 'URL')

    def test_slug_max_length(self):
        prog = Prog.objects.get(id=1)
        max_length = prog._meta.get_field('slug').max_length
        self.assertEquals(max_length, 100)

    def test_get_absolute_url(self):
        prog = Prog.objects.get(id=1)
        self.assertEquals(prog.get_absolute_url(), '/prog/testprog/2')

    def test_str(self):
        prog = Prog.objects.get(pk=1)
        self.assertEquals(prog.__str__(), "Testprog")


class ActionModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        prog = Prog.objects.create(
            pk=1,
            name='testprog2',
            slug='testprog2',
        )
        prog.save()
        action = Action.objects.create(
            pk=1,
            prog=prog,
            name="Cut",
            short_name="Cut",
        )
        action.save()

    def test_prog_field(self):
        action = Action.objects.get(id=1)
        self.assertEquals(action.prog.slug, "testprog2")

    def test_name_max_length(self):
        action = Action.objects.get(id=1)
        max_length = action._meta.get_field('name').max_length
        self.assertEquals(max_length, 250)

    def test_short_name_max_length(self):
        action = Action.objects.get(id=1)
        max_length = action._meta.get_field('short_name').max_length
        self.assertEquals(max_length, 100)

    # def test_get_absolute_url(self):
    #     command = Action.objects.get(id=1)
    #     self.assertEquals(command.get_absolute_url(), '/prog/pycharm/2')

    def test_get_icons_dir_path(self):
        act = Action.objects.get(id=1)
        path = act._meta.get_field("icon").upload_to(act, filename='Cut.png')
        self.assertEquals(path, 'testprog2_icons/Cut.png')

    def test_str(self):
        prog = Action.objects.get(pk=1)
        self.assertEquals(prog.__str__(), "Cut")


class SettingsFileTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        prog = Prog.objects.create(
            pk=1,
            name='testprog',
            slug='testprog',
        )
        prog.save()
        owner = User.objects.create_user(
            pk=1,
            username='testuser',
            email='testuser@gmail.com'
        )
        Keymap.objects.create(
            pk=1,
            prog=prog,
            name='testkeymap',
            rating=5,
            owner=owner,
        )

    def test_keymap_prog_field(self):
        keymap = Keymap.objects.get(id=1)
        prog_field = keymap.prog.slug
        self.assertEquals(prog_field, "testprog")

    def test_keymap_name_max_length(self):
        keymap = Keymap.objects.get(id=1)
        max_length = keymap._meta.get_field('name').max_length
        self.assertEquals(max_length, 15)

    def test_keymap_name_label(self):
        keymap = Keymap.objects.get(id=1)
        label = keymap._meta.get_field('name').verbose_name
        self.assertEquals(label, 'Название keymap-файла')

    def test_keymap_path(self):
        file = Keymap.objects.get(id=1)
        path = file._meta.get_field("file").upload_to(
            file,
            filename='testkeymap.xml')
        self.assertEquals(path, 'testprog_keymaps/1/testkeymap.xml')

    def test_rating(self):
        file = Keymap.objects.get(id=1)
        rating = file.rating
        self.assertEquals(rating, 5)

    def test_file_owner(self):
        file = Keymap.objects.get(id=1)
        owner = file.owner.username
        self.assertEquals(owner, 'testuser')

    def test_get_absolute_url(self):
        file = Keymap.objects.get(id=1)
        self.assertEquals(file.get_absolute_url(), '/prog/testprog/1')
