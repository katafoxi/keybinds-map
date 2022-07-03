import xml.etree.ElementTree as ET
import pathlib
from pprint import pprint

def parse_settings_file(path_to_file = r'D:/BFR.xml'):
    keymap = pathlib.Path(path_to_file)
    tree = ET.parse(keymap)
    root = tree.getroot()
    commands_dict = {}
    for action in root:
        mouse_shortcut_list = []
        keyboard_shortcut_list = []
        for shortcut in action:
            if (shortcut.tag == 'mouse-shortcut'):
                mouse_shortcut_list.append(shortcut.get('keystroke'))
            elif (shortcut.tag == 'keyboard-shortcut'):
                keyboard_shortcut_list.append(shortcut.get('first-keystroke'))

        # example 'ExternalJavaDoc': {'keyboard-shortcut': ['ctrl alt x'], 'mouse-shortcut': []},
        commands_dict[action.attrib['id']]= {'keyboard-shortcut':keyboard_shortcut_list,
                                             'mouse-shortcut': mouse_shortcut_list}



    return commands_dict


if __name__ == '__main__':
    pprint(parse_settings_file())