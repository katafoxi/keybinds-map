import pathlib
import xml.etree.ElementTree as ElementTree
from pprint import pprint
from typing import Dict


def parse_keymap(keymap) -> Dict[str, Dict[str, str]]:
    """
    Функция парсит keymap-файл(файл с настройками комбинаций)
    и возвращает словарь вида:
    {команда1: { клавиша1: код_модификатор,
                 клавиша2: код_модификатор,...
                 клавиша3: код_модификатор},...}

    @param keymap: example (r'D:/BFR.xml')
    @return: dict { '$Redo': {
                                'back_space': 'as',
                                 'z': 'cs'
                              },
                    'Back':   {
                                'button4': 'push',
                                'left': 'ac'
                              },
    """
    if keymap is str:
        tree = ElementTree.parse(pathlib.Path(keymap))
    else:
        tree = ElementTree.parse(keymap)
    ###############
    # example tree
    # <action id="EditorPreviousWord">
    #     <keyboard-shortcut first-keystroke="shift ctrl Z"/>
    # </action>
    ################

    root = tree.getroot()
    actions = {}
    for action in root:
        action_name = action.attrib['id']
        shortcuts = {}
        for combo in action:
            # не учитывать комбинации вида
            # <keyboard-shortcut first-keystroke="ctrl MULTIPLY"
            # second-keystroke="2"/>
            if len(combo.attrib.keys()) == 1:
                for subkey in combo.attrib.keys():
                    # "shift ctrl Z"
                    mod_keys_with_key = combo.attrib.get(subkey).lower()
                    *mod_keys, k_key = mod_keys_with_key.split()
                    if len(mod_keys) != 0:
                        mod_abbr = "".join(
                            [mod_key[0] for mod_key in sorted(mod_keys)])
                        # [shift, ctrl] => 'cs'
                    else:
                        mod_abbr = "push"
                    shortcuts.update({k_key: mod_abbr})
        actions[action_name] = shortcuts
    return actions


if __name__ == "__main__":
    # print(get_commands_with_modifiers())
    # pprint(parse_settings_file(r'D:/Windows.xml'))

    pprint(parse_keymap(r"D:Empty.xml"))
