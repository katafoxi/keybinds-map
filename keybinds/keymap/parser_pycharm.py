import xml.etree.ElementTree as ET
import pathlib
from pprint import pprint


def parse_settings_file(path_to_file=r'D:/BFR.xml'):
    """

    @param path_to_file: exapmle (r'D:/BFR.xml')
    @return: dict{'ExternalJavaDoc': {   '$Copy': ['c c', 'c insert'],
                                         '$Cut': ['c x', 's delete'],
                                         '$Delete': ['simple delete'],
    """
    keymap = pathlib.Path(path_to_file)
    tree = ET.parse(keymap)
    root = tree.getroot()
    commands_dict = {}
    for action in root:
        # print(action.attrib['id'])
        shortcut_dict = {}
        for shortcut in action:
            if shortcut.tag == 'mouse-shortcut':
                modifiers_with_key =shortcut.get('keystroke').lower()
                shortcut_dict.update(get_modifiers_code_with_key(modifiers_with_key))
            elif shortcut.tag == 'keyboard-shortcut':
                if not shortcut.get('second-keystroke'):
                    modifiers_with_key = shortcut.get('first-keystroke').lower()
                    shortcut_dict.update(get_modifiers_code_with_key(modifiers_with_key))
        commands_dict[action.attrib['id']] = shortcut_dict

    return commands_dict

def get_modifiers_code_with_key(modifiers_with_key):
            modifiers_with_key = modifiers_with_key.split()
            k_key = modifiers_with_key.pop()
            modifiers = modifiers_with_key
            if len(modifiers) != 0:
                modifiers = map((lambda first_letter: first_letter[0]), sorted(modifiers))
                modifiers = ''.join(modifiers)
            else:
                modifiers = 'push'  # (modifiers='cs', key='9', name='ToggleBookmark9')
            return  {k_key:modifiers}


if __name__ == '__main__':
    # print(get_commands_with_modifiers())
    pprint(parse_settings_file(r'D:/Windows.xml'))
