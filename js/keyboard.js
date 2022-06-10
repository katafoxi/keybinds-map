let ArrowRowSymbols = {
    rowF1: ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '', 'PrtSc', 'ScrLk', 'Pause'],
    row12: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Backspace', 'Ins', 'home', 'PageUp'],
    rowQW: ['', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PageD'],
    rowAS: ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '"', '', 'Enter', '', 'Up', ''],
    rowZX: ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '', '', '', 'Left', 'Down', 'Right']
}

drawButtonTable = function() {
    //create row 1
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
}

drawButtonTable();