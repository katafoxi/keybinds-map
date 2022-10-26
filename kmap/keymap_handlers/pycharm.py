import io
import pathlib
import xml.etree.ElementTree as ET
from typing import Dict

from kmap.keymap_handlers.xml_utils import indent


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
                                 'z': 'keyboard__cs'
                              },
                    'Back':   {
                                'button4': 'push',
                                'left': 'ac'
                              },
    """
    if type(keymap) is str:
        tree = ET.parse(pathlib.Path(keymap))
    else:
        tree = ET.parse(keymap)
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


# SOURCE https://ru.stackoverflow.com/questions/1064514/%d0%9a%d0%b0%d0%ba
# -%d1%81%d0%be%d0%b7%d0%b4%d0%b0%d1%82%d1%8c-xml-%d0%bd%d0%b0-python-%d0%b8
# %d1%81%d0%bf%d0%be%d0%bb%d1%8c%d0%b7%d1%83%d1%8f-xml-etree-elementtree
def get_keymap_xml_tree(keymap_name='test', **customized_actions):
    """Создает и возвращает keymap-файл формата XML для программы PyCharm"""

    root = ET.Element('keymap', version='1', name=keymap_name)
    if customized_actions:
        for action, combs in customized_actions.items():
            action = ET.Element('action', id=action)
            root.append(action)
            for combo in combs:
                if 'button' in combo.lower():
                    ET.SubElement(
                        action, 'mouse-shortcut', keystroke=combo
                    )
                else:
                    ET.SubElement(
                        action, 'keyboard-shortcut', first_keystroke=combo
                    )
    indent(root)

    etree = ET.ElementTree(root)
    # f = io.BytesIO()
    # etree.write(f, encoding="utf-8")
    # # print(f.getvalue().decode(encoding="utf-8"))
    # keymap = open(f'{keymap_name}.xml', 'wb')
    # etree.write(keymap, encoding="utf-8")
    return etree


if __name__ == '__main__':

    get_keymap_xml_tree()
