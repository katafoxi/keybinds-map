keyboard_keys = {
    'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Esc', 'PSc', 'SLk', 'Pse'],
    'row12': ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    'rowQW': ['', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PD'],
    'rowAS': ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '„ “', '', 'Enter', '', 'Up', ''],
    'rowZX': ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'mouse-lft', 'mouse-mid', 'mouse-rght', 'Lft', 'Dwn', 'Rght']
}
modifiers = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift']



def generate_keyboard_grid():
    keyboard_grid_hmtl = ''
    for row in keyboard_keys:
        for key in keyboard_keys[row]:
            keyboard_grid_hmtl += '<div class="char' + key + '">' + get_subgrid_with_modifiers(key) + '</div>'
    return keyboard_grid_hmtl
    # document.getElementById('keybordGrid').innerHTML = KeyboardGridHTML


def get_subgrid_with_modifiers(key):
        subtable_html = ''
        if (key == ''):
            subtable_html = ''
        else:
            subtable_html = '<div  class="subtable">\
                                <div class="brdr Symbol">' + key + '</div>\
                                <div class="brdr Alt abbr" title = "alt">a</div>\
                                <div class="brdr Ctrl abbr">c</div>\
                                <div class="brdr Shift abbr">s</div>\
                                <div class="brdr CtrlAlt abbr">ca</div>\
                                <div class="brdr AltShift abbr">as</div>\
                                <div class="brdr CtrlShift abbr">cs</div>\
                                <div class="brdr CtrlAltShift abbr">cas</div>\
                                <div class="brdr Simple "></div>\
                                <div class="brdr Alt-title droppable"></div>\
                                <div class="brdr Ctrl-title droppable"></div>\
                                <div class="brdr Shift-title droppable"></div>\
                                <div class="brdr CtrlAlt-title droppable"></div>\
                                <div class="brdr AltShift-title droppable"></div>\
                                <div class="brdr CtrlShift-title droppable"></div>\
                                <div class="brdr CtrlAltShift-title droppable"></div>\
                                <div class="brdr Simple-title ' + key + ' droppable"></div>\
                            </div>'

        return subtable_html

