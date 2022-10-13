import xml.etree.ElementTree as ElementTree
import pathlib
from pprint import pprint


def pycharm_parser_settings_file(settings_file=r"D:/BFR.xml"):
    """

    @param settings_file: example (r'D:/BFR.xml')
    @return: dict { '$Redo': {'back_space': 'as', 'z': 'cs'},
                    'Back': {'button4': 'push', 'left': 'ac'},
    """
    if settings_file is str:
        keymap = pathlib.Path(settings_file)
        tree = ElementTree.parse(keymap)
    else:
        tree = ElementTree.parse(settings_file)
    ###############
    # example tree
    # <action id="EditorPreviousWord">B
    #     <keyboard-shortcut first-keystroke="ctrl LEFT"/>
    # </action>
    ################

    root = tree.getroot()
    commands = {}
    for action in root:
        shortcuts = {}
        for shortcut in action:
            # не учитывать комбинации вида <keyboard-shortcut first-keystroke="ctrl MULTIPLY" second-keystroke="2"/>
            if len(shortcut.attrib.keys()) == 1:
                for key in shortcut.attrib.keys():
                    modifiers_with_key = shortcut.attrib.get(
                        key
                    ).lower()  # "shift ctrl Z"
                    # print(action.attrib['id'], get_modifiers_code_with_key(shortcut.attrib.get(key)))
                    shortcuts.update(get_modifiers_abbr_with_button(modifiers_with_key))

        commands[action.attrib["id"]] = shortcuts

    return commands


def get_modifiers_abbr_with_button(modifiers_with_key):
    """

    @param modifiers_with_key: str "shift ctrl Z"
    @return: dict Ctrl+Z -> {"z":"c"}
    """
    modifiers_with_key = modifiers_with_key.split()
    k_key = modifiers_with_key.pop()
    modifiers = modifiers_with_key
    if len(modifiers) != 0:
        modifiers = map((lambda first_letter: first_letter[0]), sorted(modifiers))
        modifiers = "".join(modifiers)
    else:
        modifiers = "push"
    # (modifiers='cs', key='9', name='ToggleBookmark9')
    return {k_key: modifiers}


if __name__ == "__main__":
    # print(get_commands_with_modifiers())
    # pprint(parse_settings_file(r'D:/Windows.xml'))

    pprint(pycharm_parser_settings_file(r"D:Empty.xml"))
