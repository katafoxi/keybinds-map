let ArrowRowSymbols = {
    rowF1: ['mod', 'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '', 'PSc', 'SLk', 'Pse'],
    row12: ['d', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    rowQW: ['md', '', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PD'],
    rowAS: ['md', '', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '"', '', 'Ent', '', 'Up', ''],
    rowZX: ['md', '', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '', '', '', 'Lft', 'Dwn', 'Rght']
}

let modificators = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift'];

generateKeyboardTable = function() {
    var tableHtml = '';
    var charsHtml = '<tr>';

    for (rowButtons in ArrowRowSymbols) {
        for (button of ArrowRowSymbols[rowButtons]) {
            charsHtml += '<td class="char">' + button + '</td>';
        }
        charsHtml += '</tr>';
    };

    tableHtml += charsHtml;
    document.getElementById('keybordTable').innerHTML = tableHtml;
}();

generateModificatorsSubTable = function(flag = false) {
    let modificatorName = '';


    var ModificatorCellHTML = '';
    for (modif of modificators) {
        if (flag) modificatorName = modif;
        ModificatorCellHTML += '<tr><td class="' + modif + 'Color + Color" >' + '</td>';
        ModificatorCellHTML += '<td class= "' + modif + 'Comand + Comand">' + modificatorName + '</td></tr>';
    }
    modificatorName = '';
    return ModificatorCellHTML;
};

addCharCellInModificatorSubTable = function(charButton) {
    let CharClass = charButton.textContent

    let addCharCellsHTML = '<tr><td class="' + CharClass + '+ Color">' + CharClass + '</td> <td class= "Comand"></td></tr>';
    return addCharCellsHTML;
}

getFinalSubTable = function() {

    let charArray = document.getElementsByClassName('char');

    for (charButton of charArray) {

        let subTableHtml = '<table id="modificatorForChar"><tbody>';
        subTableHtml += addCharCellInModificatorSubTable(charButton);
        if (charButton.textContent == 'mod') {
            let flag = true;
            subTableHtml += generateModificatorsSubTable(flag);
        } else {
            flag = false;
            subTableHtml += generateModificatorsSubTable(flag);
        }


        subTableHtml += '</tbody></table>';
        charButton.innerHTML = subTableHtml;
        subTableHtml = '';
    }
}()