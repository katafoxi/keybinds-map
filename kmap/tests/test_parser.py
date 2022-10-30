from django.test import TestCase
from kmap.keymap_handlers.pycharm import parse_keymap
from kmap.models import Action, Prog


class ParserTest(TestCase):

    def test_parse_settings_file(self):
        prog = Prog.objects.create(
            pk=1,
            name='testprog',
            slug='testprog',
        )
        Action.objects.create(
            pk=1,
            prog=prog,
            name="$Redo",
            short_name="$Redo",
        )
        all_acts = list(Action.objects.filter(prog='testprog'))
        with open(r'kmap/tests/test_pycharm_keymap_one.xml') as xml_file:
            test_file = xml_file
            parse = parse_keymap(keymap=test_file, all_acts_db=all_acts)
        self.assertEqual(parse, {'$Redo': {'z': 'cs', 'back_space': 'as'}})
