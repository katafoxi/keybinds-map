import xml.etree.ElementTree as ET
import pathlib
keymap = pathlib.Path('D:/BFR.xml')
tree = ET.parse(keymap)
root = tree.getroot()
print(len(root))
i= 1
for action in root:
    print(i,'|', action.attrib['id'], end='|')

    i+=1
    for shortcut in action:
        print(shortcut.tag,  end='|')
        if (shortcut.tag == 'mouse-shortcut'):
            print(shortcut.get('keystroke'), end='|')
        elif (shortcut.tag =='keyboard-shortcut'):
            print(shortcut.get('first-keystroke'), end='|')
        # for keystroke in shortcut.attrib:
        #     print(keystroke, shortcut.attrib[keystroke], end='|')

        # print(shortcut.attrib['first-keystroke'], end='|')

    print()

