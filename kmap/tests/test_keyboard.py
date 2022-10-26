from django.test import TestCase
from kmap.views import *
from kmap.keyboard import Keyboard
import copy


class KeyboardTest(TestCase):
    buttons_front_save = copy.deepcopy(Keyboard.buttons_front)
    buttons_back_save = copy.deepcopy(Keyboard.buttons_back.copy())

    @classmethod
    def setUpTestData(cls):
        Keyboard.buttons_front = ['Z', ]
        Keyboard.buttons_back = ['z', ]
        prog = Prog.objects.create(
            pk=1,
            name='testprog',
            slug='testprog',
        )
        Action.objects.create(
            pk=1,
            prog=prog,
            name="Redo",
            short_name="Redo",
        )

    @classmethod
    def tearDownClass(cls):
        Keyboard.buttons_front = cls.buttons_front_save
        Keyboard.buttons_back = cls.buttons_back_save
        super().tearDownClass()

    def test_get_empty_buttons(self):
        button = Keyboard.get_empty_buttons()
        result = {'z': {'front_name': 'Z'}}
        self.assertEqual(button, result)

    def test_get_filled_buttons(self):
        acts_with_combs = {'Redo': {'z': 'cs'}, }  # 'cs'- Ctrl+Shift
        filled_buttons = Keyboard.get_filled_buttons(
            acts_with_combs=acts_with_combs,
            slug='testprog'
        )
        self.assertEqual(
            filled_buttons,
            {'z': {'front_name': 'Z',
                'cs': '<div class="actionList__item"\n'
                      '     style="width: 15px;"\n'
                      '     title=""\n'
                      '     data-name="Redo">\n'
                      '  <div  class="actionList__repr">\n'
                      '    \n'
                      '    Redo\n'
                      '  </div>\n'
                      '</div>'}}

        )
