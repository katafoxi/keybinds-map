import pathlib
import xml.etree.ElementTree as ElementTree
from pprint import pprint
from typing import Dict


def pycharm_parse_settings_file(settings_file=r"D:/BFR.xml") -> Dict[str, Dict[str, str]]:
    """
    Функция парсит keymap-файл(файл с настройками комбинаций) и возвращает словарь вида
    {команда1: { клавиша1: код_модификатор,
                 клавиша2: код_модификатор,...
                 клавиша3: код_модификатор},...}

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
    #     <keyboard-shortcut first-keystroke="shift ctrl Z"/>
    # </action>
    ################

    root = tree.getroot()
    actions = {}
    for action in root:
        command_name = action.attrib['id']
        shortcuts = {}
        for shortcut in action:
            # не учитывать комбинации вида <keyboard-shortcut first-keystroke="ctrl MULTIPLY" second-keystroke="2"/>
            if len(shortcut.attrib.keys()) == 1:
                for subkey in shortcut.attrib.keys():
                    modifiers_with_key = shortcut.attrib.get(subkey).lower()  # "shift ctrl Z"
                    *modifiers, k_key = modifiers_with_key.split()  # [shift, ctrl] Z
                    if len(modifiers) != 0:
                        mod_abbr: str = "".join(
                            [modifier[0] for modifier in sorted(modifiers)])  # [shift, ctrl] -> 'cs'
                    else:
                        mod_abbr = "push"
                    shortcuts.update({k_key: mod_abbr})
        actions[command_name] = shortcuts

    return actions


if __name__ == "__main__":
    # print(get_commands_with_modifiers())
    # pprint(parse_settings_file(r'D:/Windows.xml'))

    pprint(pycharm_parse_settings_file(r"D:Empty.xml"))
