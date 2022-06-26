const arrayKeyboardKeyValues = {
    rowF1: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Esc', 'PSc', 'SLk', 'Pse'],
    row12: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    rowQW: ['', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '/', 'Del', 'End', 'PD'],
    rowAS: ['', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '„ “', '', 'Enter', '', 'Up', ''],
    rowZX: ['', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '', '', '', 'Lft', 'Dwn', 'Rght']
}

const modifiers = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift'];

generateKeyboardGrid();
showFlipswiths();
showModifiersList();


function showFlipswiths() {
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
};


function showModifiersList() {
    let collectionFlipswitchKeys = document.getElementsByClassName('flipswitch-cb');
    for (let i = 0; i < collectionFlipswitchKeys.length; i++) {
        let elem = collectionFlipswitchKeys[i];

        elem.addEventListener("click", function() {
            let modifierFromClassCell = elem.closest('.Cell').getAttribute('class').split(' ')[1];
            if (elem.checked) {
                showModifiersRows(modifierFromClassCell);
                modifierFromClassCell = modifierFromClassCell.split('-')[0]
                showModifiersRows(modifierFromClassCell);
            } else {
                hideModifiersRows(modifierFromClassCell);
                modifierFromClassCell = modifierFromClassCell.split('-')[0]
                hideModifiersRows(modifierFromClassCell)
            }
        });
    }
}

function hideModifiersRows(modifier) {
    let collectionModRow = document.getElementsByClassName(modifier);
    for (let i = 1; i < collectionModRow.length; i++) {
        let elem = collectionModRow[i];
        elem.style.display = 'none';
    }
}

function showModifiersRows(modifier) {
    let collectionModRow = document.getElementsByClassName(modifier);
    for (let i = 1; i < collectionModRow.length; i++) {
        let elem = collectionModRow[i];
        elem.style.display = '';
    }
}

function getSubgridWithModifiers(keyboardKey) {
    let subtableHTML = '';
    if (keyboardKey == '') {
        subtableHTML = '';
    } else {
        subtableHTML = '<div  class="subtable">\
                            <div class="brdr Symbol">' + keyboardKey + '</div>\
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
                            <div class="brdr Simple-title droppable"></div>\
                        </div>';
    }
    return subtableHTML;
}

function generateKeyboardGrid() {
    var KeyboardGridHTML = '';

    for (rowButtons in arrayKeyboardKeyValues) {
        for (keyButton of arrayKeyboardKeyValues[rowButtons]) {
            KeyboardGridHTML += '<div class="char' + keyButton + '">' + getSubgridWithModifiers(keyButton) + '</div>';
        }
    };
    // console.log(KeyboardGridHTML);
    document.getElementById('keybordGrid').innerHTML = KeyboardGridHTML;
}


// dragula([document.querySelector('#left'), document.querySelector('#right')], {});

const boxNodes = document.querySelectorAll('.droppable'); // returns NodeList

const draggableBoxes = Array.prototype.slice.call(boxNodes);


dragula(draggableBoxes, )
    .on('drop', (el, targret) => {
        showHide();

    })

// function showHideDescriptionCommand(el, targret) {
//     // alert(el.childNodes[1].offsetWidth)
//     if (+targret.offsetWidth < 35) {
//         // alert(el.nodeName)
//         el.childNodes[3].style.display = 'none';
//     } else {
//         el.childNodes[3].style.display = '';
//     }
// }

function showHide() {
    let collectionCommandDescr = document.getElementsByClassName('command_description');
    // console.log(collectionCommandDescr)

    for (let i = 1; i < collectionCommandDescr.length; i++) {
        let elem = collectionCommandDescr[i];

        let elemWidth = elem.childNodes[1].offsetWidth + elem.childNodes[3].offsetWidth;
        // alert(elem.parentNode.offsetWidth)

        if (+elem.parentNode.offsetWidth < 50) {
            elem.childNodes[3].style.display = 'none';
        } else {
            elem.childNodes[3].style.display = '';
        }
    }
}

window.onresize = showHide;