let ArrowRowSymbols = {
    rowF1: ['mod', 'Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '', 'PSc', 'SLk', 'Pse'],
    row12: ['mod', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    rowQW: ['mod', '', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PD'],
    rowAS: ['mod', '', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '"', '', 'Ent', '', 'Up', ''],
    rowZX: ['mod', '', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '', '', '', 'Lft', 'Dwn', 'Rght']
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
    let ModificatorCellHTML = '';

    for (modif of modificators) {
        if (flag) modificatorName = modif;
        ModificatorCellHTML += '<tr><td class="' + modif + 'Color + Color" >' + '</td>';
        ModificatorCellHTML += '<td class= "' + modif + 'Comand + Comand droppable">' + modificatorName + '</td></tr>';
    }
    modificatorName = '';
    return ModificatorCellHTML;
};

addCharCellInModificatorSubTable = function(charButton) {
    let CharClass = charButton.textContent

    let addCharCellsHTML = '<tr><td class="' + CharClass + '+ Color">' + CharClass + '</td> <td class= "Comand droppable"></td></tr>';
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


let currentDroppable = null;

ball.onmousedown = function(event) {

    let shiftX = event.clientX - ball.getBoundingClientRect().left;
    let shiftY = event.clientY - ball.getBoundingClientRect().top;

    ball.style.position = 'absolute';
    ball.style.zIndex = 1000;
    document.body.append(ball);

    moveAt(event.pageX, event.pageY);

    function moveAt(pageX, pageY) {
        ball.style.left = pageX - shiftX + 'px';
        ball.style.top = pageY - shiftY + 'px';
    }

    function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);

        ball.hidden = true;
        let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
        ball.hidden = false;

        if (!elemBelow) return;

        let droppableBelow = elemBelow.closest('.droppable');
        if (currentDroppable != droppableBelow) {
            if (currentDroppable) { // null если мы были не над droppable до этого события
                // (например, над пустым пространством)
                leaveDroppable(currentDroppable);
            }
            currentDroppable = droppableBelow;
            if (currentDroppable) { // null если мы не над droppable сейчас, во время этого события
                // (например, только что покинули droppable)
                enterDroppable(currentDroppable);
            }
        }
    }

    document.addEventListener('mousemove', onMouseMove);

    ball.onmouseup = function() {
        document.removeEventListener('mousemove', onMouseMove);
        ball.onmouseup = null;

        ball.style.position = 'static';
        ball.style.width = '17px'
        currentDroppable.appendChild(ball);
        currentDroppable.style.background = '';

    };

};

function enterDroppable(elem) {
    elem.style.background = 'pink';
}

function leaveDroppable(elem) {
    elem.style.background = '';
}

ball.ondragstart = function() {
    return false;
};