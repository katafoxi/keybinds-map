window.onload = changeCommandDescriptionWidth
onDragMaster();
window.onresize = changeCommandDescriptionWidth;
showFlipswiths();
showOrHideModifiersRows();


// dragula([document.querySelector('#left'), document.querySelector('#right')], {});
function onDragMaster() {
    const boxNodes = document.querySelectorAll('.droppable'); // returns NodeList
    const draggableBoxes = Array.prototype.slice.call(boxNodes);
    dragula(draggableBoxes,)
        .on('drag', (el) => {
            el.style.width = '14px';
        })
        .on('drop', (el, target) => {
            el.style.width = (target.offsetWidth - 5) + 'px';
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
        if (elem.parentNode.getAttribute('class').split(' ')[1] == 'brdr') {
            elem.style.width = '14px'
        }
        if (elem.parentNode.getAttribute('class').split(' ')[1] == 'brdr') {
            elem.style.width = (elem.parentNode.offsetWidth - 4) + 'px';
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

        elem.addEventListener("click", function () {
            let modifierFromClassCell = elem.closest('.Cell').getAttribute('class').split(' ')[0];
            if (elem.checked) {
                showModifiersRows(modifierFromClassCell);
                modifierFromClassCell = modifierFromClassCell + '_mod'
                showModifiersRows(modifierFromClassCell);
            } else {
                hideModifiersRows(modifierFromClassCell);
                modifierFromClassCell = modifierFromClassCell + '_mod'
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

if (document.getElementById("id_slug")) {
    var slug = document.getElementById("id_slug").value;

    document.getElementById("id_title").onkeyup = function () {
        if (slug == '') {
            document.getElementById("id_slug").value = URLify(document.getElementById("id_title").value, 50);
        }
    }
}

// https://prog-time.ru/gotovoe-forma-s-otpravkoj-fajla-drag-drop-pole-dlya-peredachi-fajla-s-pomoshhyu-peretaskivaniya-ego-v-oblast/
