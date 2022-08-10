from django.test import TestCase
from keymap.views import *
from keymap.keyboard import Keyboard


class KeyboardTest(TestCase):
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

    def test_get_clean_buttons(self):
        buttons = Keyboard.get_clean_buttons()
        result = {'z': {'front_name': 'Z'}}
        self.assertEqual(buttons, result)

    def test_get_buttons_with_commands(self):
        command_with_modifiers = {'Redo': {'z': 'cs'}, }  # 'cs'- Ctrl+Shift
        buttons_with_commands = Keyboard.get_buttons_with_commands(
            commands_with_modifiers=command_with_modifiers,
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
