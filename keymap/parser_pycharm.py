import pathlib
import xml.etree.ElementTree as ElementTree
from pprint import pprint
from typing import Dict


def pycharm_parse_settings_file(settings_file=r"D:/BFR.xml") -> Dict[str, Dict[str, str]]:
    """
    Функция парсит keymap-файл(файл с настройками комбинаций) и возвращает словарь вида
    команда1: { комбинация1,
               комбинация2,...
               комбинацияN},

    @param settings_file: example (r'D:/BFR.xml')
    @return: dict { '$Redo': {
                                'back_space': 'as',
                                 'z': 'cs'
                              },
                    'Back':   {
                                'button4': 'push',
                                'left': 'ac'
                              },
    """
    if settings_file is str:
        tree = ElementTree.parse(pathlib.Path(settings_file))
    else:
        tree = ElementTree.parse(settings_file)
    ###############
    # example tree
    # <action id="EditorPreviousWord">
    #     <keyboard-shortcut first-keystroke="ctrl LEFT"/>
    # </action>
    ################

    root = tree.getroot()
    actions = {}
    for action in root:
        shortcuts = {}
        for shortcut in action:
            # не учитывать комбинации вида <keyboard-shortcut first-keystroke="ctrl MULTIPLY" second-keystroke="2"/>
            if len(shortcut.attrib.keys()) == 1:
                for key in shortcut.attrib.keys():
                    modifiers_with_key = shortcut.attrib.get(key).lower()  # "shift ctrl Z"
                    # print(action.attrib['id'], get_modifiers_code_with_key(shortcut.attrib.get(key)))
                    shortcuts.update(get_modifiers_abbr_with_button(modifiers_with_key))

        actions[action.attrib["id"]] = shortcuts

    return actions


def get_modifiers_abbr_with_button(modifiers_with_key):
    """

    @param modifiers_with_key: str "shift ctrl Z"
    @return: dict Ctrl+Z -> {"z":"c"}
    """
    *modifiers, k_key = modifiers_with_key.split()
    if len(modifiers) != 0:
        modifiers = [modifier[0] for modifier in sorted(modifiers)]  # [shift, ctrl] -> 'cs'
        modifiers = "".join(modifiers)
    else:
        modifiers = "push"
    # example (modifiers='cs', key='9', name='ToggleBookmark9')
    return {k_key: modifiers}


if __name__ == "__main__":
    # print(get_commands_with_modifiers())
    # pprint(parse_settings_file(r'D:/Windows.xml'))

    pprint(pycharm_parse_settings_file(r"D:Empty.xml"))
