import xml.etree.ElementTree as ET
import pathlib
from pprint import pprint

def parse_settings_file(path_to_file = r'D:/BFR.xml'):
    """

    @param path_to_file: exapmle r'D:/BFR.xml'
    @return: dict{'ExternalJavaDoc': {'keyboard-shortcut': ['ctrl alt x'], 'mouse-shortcut': []},...}
    """
    keymap = pathlib.Path(path_to_file)
    tree = ET.parse(keymap)
    root = tree.getroot()
    commands_dict = {}
    for action in root:
        # print(action.attrib['id'])
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

def  get_commands_with_modifiers():
    commands_dict=parse_settings_file()
    for command_name, command_type_shortcuts in commands_dict.items():
        # print(command_name, command_type_shortcuts)
        for shortcut_list in command_type_shortcuts.values():
            if len(shortcut_list) != 0:
                for shortcut in shortcut_list:
                    modifiers_key = shortcut.split()
                    key = modifiers_key.pop()
                    if len(modifiers_key) != 0:
                        modifiers = map((lambda mod: mod[0]), sorted(modifiers_key))
                        modifiers = ''.join(modifiers)
                    else:
                        modifiers = 'simple'
                    return (command_name,key, modifiers)



if __name__ == '__main__':
    # print(get_commands_with_modifiers())
    pprint(parse_settings_file(r'D:/Windows.xml'))