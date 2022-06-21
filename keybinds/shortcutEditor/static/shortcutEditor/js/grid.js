let arrayKeyboardKeyValues = {
    rowF1: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Esc', 'PSc', 'SLk', 'Pse'],
    row12: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    rowQW: ['', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PD'],
    rowAS: ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '„ “', '', 'Enter', '', 'Up', ''],
    rowZX: ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '', '', '', 'Lft', 'Dwn', 'Rght']
}

let modifiers = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift'];


showFlipswiths = function() {
    let collectionShemeSwitchCells = document.getElementsByClassName('schemeSwitchCell');
    for (let i = 0; i < collectionShemeSwitchCells.length; i++) {
        let elem = collectionShemeSwitchCells[i];

        let flipswitchKey = '<div class="flipswitch">\
                                <input type="checkbox" name="flipswitch" class="flipswitch-cb" id="fs' + i + '" checked>\
                                <label class="flipswitch-label" for="fs' + i + '">\
                                    <div class="flipswitch-inner"></div>\
                                    <div class="flipswitch-switch"></div>\
                                </label>\
                            </div>'
        elem.innerHTML = flipswitchKey;
    }
}();




getModifiersList = function() {
    let collectionFlipswitchKeys = document.getElementsByClassName('flipswitch-cb');
    for (let i = 0; i < collectionFlipswitchKeys.length; i++) {
        let elem = collectionFlipswitchKeys[i];

        elem.addEventListener("click", function() {
            let modifierFromClassCell = elem.closest('.Cell').getAttribute('class').split(' ')[1];
            if (elem.checked) {
                showModifiersRows(modifierFromClassCell);
                modifierFromClassCell += '-title';
                showModifiersRows(modifierFromClassCell);
            } else {
                hideModifiersRows(modifierFromClassCell);
                modifierFromClassCell += '-title';
                hideModifiersRows(modifierFromClassCell)
            }
        });
    }
}();

hideModifiersRows = function(modifier) {
    let collectionModRow = document.getElementsByClassName(modifier);
    for (let i = 1; i < collectionModRow.length; i++) {
        let elem = collectionModRow[i];
        elem.style.display = 'none';
    }
}

showModifiersRows = function(modifier) {
    let collectionModRow = document.getElementsByClassName(modifier);
    for (let i = 1; i < collectionModRow.length; i++) {
        let elem = collectionModRow[i];
        elem.style.display = '';
    }
}

getSubgridWithModifiers = function(keyboardKey) {
    let subtableHTML = '';
    if (keyboardKey == '') {
        subtableHTML = '';
    } else {
        subtableHTML = '<div  class="subtable">\
                            <div class="Symbol">' + keyboardKey + '</div>\
                            <div class="Alt droppable  abbr" title = "alt">a</div>\
                            <div class="Ctrl droppable abbr">c</div>\
                            <div class="Shift droppable abbr">s</div>\
                            <div class="CtrlAlt droppable abbr">ca</div>\
                            <div class="CtrlShift droppable abbr">cs</div>\
                            <div class="AltShift droppable abbr">as</div>\
                            <div class="CtrlAltShift droppable abbr">cas</div>\
                            <div class="Simple droppable"></div>\
                            <div class="Alt-title"></div>\
                            <div class="Ctrl-title"></div>\
                            <div class="Shift-title"></div>\
                            <div class="CtrlAlt-title"></div>\
                            <div class="CtrlShift-title"></div>\
                            <div class="AltShift-title"></div>\
                            <div class="CtrlAltShift-title"></div>\
                            <div class="Simple-title"></div>\
                        </div>';
    }
    return subtableHTML;
}

generateKeyboardGrid = function() {
    var KeyboardGridHTML = '';

    for (rowButtons in arrayKeyboardKeyValues) {
        for (keyButton of arrayKeyboardKeyValues[rowButtons]) {
            KeyboardGridHTML += '<div class="char' + keyButton + '">' + getSubgridWithModifiers(keyButton) + '</div>';
        }
    };
    // console.log(KeyboardGridHTML);
    document.getElementById('keybordGrid').innerHTML = KeyboardGridHTML;
}();

let currentDroppable = null;
let lastCurentDroppable = null;
let saveTextContent = '';

ball.onmousedown = function(event) {
    ball.style.cursor= 'grabbing'


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
        ball.style.cursor= 'grab'
        if (currentDroppable) {

            if (lastCurentDroppable) {
                if (lastCurentDroppable != currentDroppable) {
                    lastCurentDroppable.textContent = saveTextContent;
                }
            }

            saveTextContent = currentDroppable.textContent;
            lastCurentDroppable = currentDroppable;
            currentDroppable.textContent = '';
            ball.style.position = 'static';
            currentDroppable.appendChild(ball);
            currentDroppable.style.background = '';

            ball.style.border = '';
        } else {
            lastCurentDroppable.textContent = saveTextContent;
            ball.style.border = '2px solid rgb(255, 0, 0)';
        }
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