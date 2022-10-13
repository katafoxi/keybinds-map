window.onload = changeCommandDescriptionWidth
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

        elem.addEventListener("click", function() {
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

    document.getElementById("id_title").onkeyup = function() {
        if (slug == '') {
            document.getElementById("id_slug").value = URLify(document.getElementById("id_title").value, 50);
        }
    }
}


/* getElementById */
function $id(id) {
    return document.getElementById(id);
}

/* вывод сообщений */
function Output(msg) {
    var m = $id("messages");
    m.innerHTML = msg + m.innerHTML;
}

/* проверка поддержки API */
if (window.File && window.FileList && window.FileReader) {
    Init();
}
/* инициализация */
function Init() {
    var fileselect = $id("fileselect"),
        filedrag = $id("filedrag"),
        submitbutton = $id("submitbutton");

    /* выбор файла */
    fileselect.addEventListener("change", FileSelectHandler, false);

    /* проверка поддержки XHR2 */
    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
        /* сброс файла */
        filedrag.addEventListener("dragover", FileDragHover, false);
        filedrag.addEventListener("dragleave", FileDragHover, false);
        filedrag.addEventListener("drop", FileSelectHandler, false);
        filedrag.style.display = "block";

        /* удаление кнопки сабмитта*/
//        submitbutton.style.display = "none";
    }
}

// Файл над нужной областью
function FileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    alert(e.type);
    e.target.className = (e.type == "dragover" ? "hover" : "");
}

// выбор файла
function FileSelectHandler(e) {
    FileDragHover(e);

    // проходимся по объекту FileList
    var files = e.target.files || e.dataTransfer.files;

    // парсим все объекты типа File
    for (var i = 0, f; f = files[i]; i++) {
        if (f.name.endsWith("xml")) {
//            $id('fileselect').innerHTML = f;
            $id("messages").innerHTML = '';
//            submitbutton.style.display = "block";
//            fileselect.style.display = 'none';
//            filedrag.style.display = 'none';
        } else {
            Output("<p style = 'color:red'>Should be an xml file</p>")
        }
    }
}



function ParseFile(file) {
    Output(
        "<p>File information: <strong>" + file.name +
        "</strong> type: <strong>" + file.type +
        "</strong> size: <strong>" + file.size +
        "</strong> bytes</p>"
    );

}