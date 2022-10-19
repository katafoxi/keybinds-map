from django.test import TestCase
from kmap.parsers import parse_keymap


class ParserTest(TestCase):

    def test_parse_settings_file(self):
        with open(r'kmap/tests/test_pycharm_keymap_one.xml') as xml_file:
            test_file = xml_file
            parse = parse_keymap(test_file)
        self.assertEqual(parse, {'$Redo': {'z': 'cs', 'back_space': 'as'}})
