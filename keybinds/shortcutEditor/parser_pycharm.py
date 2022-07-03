import xml.etree.ElementTree as ET
import pathlib
from pprint import pprint

def parse_settings_file(path_to_file = r'D:/BFR.xml'):
    keymap = pathlib.Path(path_to_file)
    tree = ET.parse(keymap)
    root = tree.getroot()
    commands_dict = {}
    for action in root:
        print(action.attrib['id'])
        mouse_shortcut_list = []
        keyboard_shortcut_list = []
        for shortcut in action:
            if (shortcut.tag == 'mouse-shortcut'):
                mouse_shortcut_list.append(shortcut.get('keystroke').lower())
            elif (shortcut.tag == 'keyboard-shortcut'):
                keyboard_shortcut_list.append(shortcut.get('first-keystroke').lower())

        # example 'ExternalJavaDoc': {'keyboard-shortcut': ['ctrl alt x'], 'mouse-shortcut': []},
        commands_dict[action.attrib['id']]= {'keyboard-shortcut':keyboard_shortcut_list,
                                             'mouse-shortcut': mouse_shortcut_list}



    return commands_dict


if __name__ == '__main__':
   parse_settings_file(r'D:/Windows.xml')