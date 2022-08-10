import xml.etree.ElementTree as ET
import pathlib
from pprint import pprint


def parse_settings_file(settings_file=r'D:/BFR.xml'):
    """

    @param settings_file: exapmle (r'D:/BFR.xml')
    @return: dict { '$Redo': {'back_space': 'as', 'z': 'cs'},
                    'Back': {'button4': 'push', 'left': 'ac'},
    """
    if settings_file is str:
        keymap = pathlib.Path(settings_file)
        tree = ET.parse(keymap)
    else:
        tree = ET.parse(settings_file)

    root = tree.getroot()
    commands_dict = {}
    for action in root:
        shortcut_dict = {}
        for shortcut in action:
            if len(shortcut.attrib.keys()) == 1:
                for key in shortcut.attrib.keys():
                    modifiers_with_key = shortcut.attrib.get(key).lower()
                    # print(action.attrib['id'], get_modifiers_code_with_key(shortcut.attrib.get(key)))
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
    # pprint(parse_settings_file(r'D:/Windows.xml'))

    pprint(parse_settings_file(r'C:\OpenServer\domains\keybinds.ru\keybinds\media\pycharm_setting_files\1\Empty.xml'))