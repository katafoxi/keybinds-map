from django.test import TestCase
from keymap.views import *
from keymap.keyboard import Keyboard
import copy


class KeyboardTest(TestCase):
    buttons_front_save = copy.deepcopy(Keyboard.buttons_front)
    buttons_back_save = copy.deepcopy(Keyboard.buttons_back.copy())

    @classmethod
    def setUpTestData(cls):
        Keyboard.buttons_front = {'rowZX': ['Z', ]}
        Keyboard.buttons_back = {'rowZX': ['z', ]}
        prog = Program.objects.create(
            title='PyCharm',
            slug='pycharm',
        )
        command = Command.objects.create(
            program=prog,
            name="Redo",
            short_name="Redo",
        )

    @classmethod
    def tearDownClass(cls):
        Keyboard.buttons_front = cls.buttons_front_save
        Keyboard.buttons_back = cls.buttons_back_save
        super().tearDownClass()

    def test_get_clean_buttons(self):
        button = Keyboard.get_clean_buttons()
        result = {'z': {'front_name': 'Z'}}
        self.assertEqual(button, result)

    def test_get_buttons_with_commands(self):
        command_with_shortcuts = {'Redo': {'z': 'cs'}, }  # 'cs'- Ctrl+Shift
        buttons_with_commands = Keyboard.get_buttons_with_commands(
            commands_with_shortcuts=command_with_shortcuts,
            slug='pycharm'
        )
        self.assertEqual(
            buttons_with_commands,
            {'z': {'front_name': 'Z',
                   'cs': '\n  '
                         '<div class="command_description" style="width: 15px;">\n'
                         '    <div class="descr">\n      '
                         '\n      Redo\n    '
                         '</div>\n  </div>\n'}}
        )
