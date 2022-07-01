onDragMaster();
window.onresize = changeCommandDescriptionWidth;
showFlipswiths();
showOrHideModifiersRows();



// dragula([document.querySelector('#left'), document.querySelector('#right')], {});
function onDragMaster() {
    const boxNodes = document.querySelectorAll('.droppable'); // returns NodeList

    const draggableBoxes = Array.prototype.slice.call(boxNodes);


    dragula(draggableBoxes, )
        .on('drag', (el) => {
            el.style.width = '14px';
        })
        .on('drop', (el, targret) => {
            el.style.width = (targret.offsetWidth - 5) + 'px';
        })
}

// window.onbeforeunload = function() {
//     return "Есть несохранённые изменения. Всё равно уходим?";
// };


function changeCommandDescriptionWidth() {
    let collectionCommandDescr = document.getElementsByClassName('command_description');
    // console.log(collectionCommandDescr)


    for (let i = 1; i < collectionCommandDescr.length; i++) {
        let elem = collectionCommandDescr[i];

        if (elem.parentNode.getAttribute('class').split(' ')[0] == 'brdr') {
            elem.style.width = '14px'
        }
        if (elem.parentNode.getAttribute('class').split(' ')[0] == 'brdr') {
            elem.style.width = (elem.parentNode.offsetWidth - 5) + 'px';
        }
    }
}

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
}


function showOrHideModifiersRows() {
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