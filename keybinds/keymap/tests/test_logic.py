from django.test import TestCase
from keymap.views import *

# class ViewLogicTest(TestCase):
#     @classmethod
#     def setUpTestData(cls):
#         Keyboard.buttons_front = {'rowZX': ['Z', ]}
#         Keyboard.buttons_back = {'rowZX': ['z', ]}
#         prog = Program.objects.create(
#             title='PyCharm',
#             slug='pycharm',
#         )
#         command = Command.objects.create(
#             program=prog,
#             name="Redo",
#             short_name="Redo",
#         )