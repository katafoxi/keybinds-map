from django.test import TestCase
from keymap.views import *


class ViewLogicTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        Keyboard.buttons_front = {'rowZX': ['Z', ]}
        Keyboard.buttons_back = {'rowZX': ['z', ]}
        prog = Program.objects.create(
            title='PyCharm',
            slug='pycharm',
        )
        Command.objects.create(
            program=prog,
            name="Redo",
            short_name="Redo",
        )
        Command.objects.create(
            program=prog,
            name="Undo",
            short_name="undo",
        )

    def test_get_unassigned_commands_db(self):
        commands_with_modifiers = {"Redo": {"z": "c"}}
        slug = Program.objects.get(id=1).slug
        commands = get_unassigned_commands_db(commands_with_modifiers, slug)[0].name
        self.assertEqual(commands, "Undo")
