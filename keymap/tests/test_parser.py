from django.test import TestCase
from keymap.parser_pycharm import pycharm_parse_settings_file


class ParserTest(TestCase):

    def test_parse_settings_file(self):
        with open(r'keymap/tests/test_pycharm_settings_file_one.xml') as xml_file:
            test_file = xml_file
            parse = pycharm_parse_settings_file(test_file)
        self.assertEqual(parse, {'$Redo': {'z': 'cs', 'back_space': 'as'}})


