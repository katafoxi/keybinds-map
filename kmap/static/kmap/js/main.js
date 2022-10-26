window.onload = changeActionDescrBlockWidth
onDragMaster();
window.onresize = changeActionDescrBlockWidth;
addFlipswitch();
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
            // console.log(target.parentElement.className)
            console.log(target.firstChild)
        })
}

// window.onbeforeunload = function() {
//     return "Есть несохранённые изменения. Всё равно уходим?";
// };


var dowloadKeymapButton = document.getElementById("button_download_keymap");
dowloadKeymapButton.addEventListener("click", getCustomizeUserKeymap);


function keymapToJSON() {
    // let keymap = new Map()
    let keymap = new Map()
    let actions = document.getElementsByClassName('actionList__item')

    for (let i = 0; i < actions.length; i++) {
        let action = actions[i];
        if (action.parentNode.getAttribute('class').includes('keyboard')) {
            let action_name = action.dataset.name;
            let pressButton = action.parentNode.dataset.button.toUpperCase();
            let mod_keys = unpackModKeys(action.parentNode.dataset.modkeys);

            if (action_name in keymap) {
                if (mod_keys) {
                    keymap[action_name].push([mod_keys, pressButton].join(' '));
                } else {
                    keymap[action_name].push(pressButton);
                }
            } else {
                if (mod_keys) {
                    keymap[action_name] = [[mod_keys, pressButton].join(' ')];
                } else {
                    keymap[action_name] = [pressButton];
                }
            }
        }
    }
    let json = JSON.stringify(keymap, null, 2);
    // console.log(json);
    return json;
}

async function request(url, data, csrftoken) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrftoken,
        },
        body: data,
    })
    // const result = await response.text()
    const resp = await response
    return resp
}

async function getCustomizeUserKeymap() {
    // const url = '{% url "check_name_s" %}'
    // const csrftoken = '{{ csrf_token }}'
    const data = keymapToJSON();
    const resp = await request(url, data, csrftoken)
    keymapName = resp.headers.get('Content-Disposition').split('filename="')[1].slice(0, -1);
    // let blob = new Blob(resp, {type: "text/xml"});
    let link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(await resp.blob()));
    link.setAttribute("download", name = keymapName);
    link.click();
}


function unpackModKeys(mod_keys) {
    switch (mod_keys) {
        case 'a':
            mod_keys = 'alt';
            break;
        case 'c':
            mod_keys = 'ctrl';
            break;
        case 's':
            mod_keys = 'shift';
            break;
        case 'ac':
            mod_keys = 'ctrl alt';
            break;
        case 'as':
            mod_keys = 'shift alt';
            break;
        case 'cs':
            mod_keys = 'shift ctrl';
            break;
        case 'acs':
            mod_keys = 'shift ctrl alt';
            break;
        case 'push':
            mod_keys = '';
            break
    }
    return mod_keys;
}


function changeActionDescrBlockWidth() {
    let collectActionDescr = document.getElementsByClassName('actionList__item');
    for (let i = 0; i < collectActionDescr.length; i++) {
        let elem = collectActionDescr[i];
        if (elem.parentNode.getAttribute('class').includes('keyboard')) {
            elem.style.width = '14px'
        }
        if (elem.parentNode.getAttribute('class').includes('keyboard')) {
            elem.style.width = (elem.parentNode.offsetWidth - 4) + 'px';
        }
    }
}

function addFlipswitch() {
    let where = document.getElementsByClassName('addSwitch');
    for (let i = 0; i < where.length; i++) {
        let flipswitch = '  <div class="flipswitch">\
                                <input type="checkbox" name="flipswitch" class="flipswitch-cb" id="fs' + i + '" checked>\
                                <label class="flipswitch-label" for="fs' + i + '">\
                                    <div class="flipswitch-inner"></div>\
                                    <div class="flipswitch-switch"></div>\
                                </label>\
                            </div>'
        where[i].innerHTML = flipswitch;
    }
}


function showOrHideModifiersRows() {
    let flipswitchKeys = document.getElementsByClassName('flipswitch-cb');
    for (let i = 0; i < flipswitchKeys.length; i++) {
        let elem = flipswitchKeys[i];

        elem.addEventListener("click", function () {
            let elementClassToChange = elem.parentNode.parentNode.dataset.modkeysClass;
            if (elem.checked) {
                console.log(elementClassToChange)
                showModifiersRows(elementClassToChange);
                elementClassToChange = elementClassToChange + '_mod';
                showModifiersRows(elementClassToChange);
            } else {
                console.log('hide')
                hideModifiersRows(elementClassToChange);
                elementClassToChange = elementClassToChange + '_mod';
                hideModifiersRows(elementClassToChange);
            }
        });
    }
}

function hideModifiersRows(elementClassToChange) {
    let elements = document.getElementsByClassName(elementClassToChange);
    for (let i = 1; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
}

function showModifiersRows(elementClassToChange) {
    let elements = document.getElementsByClassName(elementClassToChange);
    console.log(elements.length)
    for (let i = 1; i < elements.length; i++) {
        elements[i].style.display = 'block';
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
/* getElementById */
function $id(id) {
    return document.getElementById(id);
}

/* вывод сообщений */
function Output(msg) {
    var m = $id("messages");
    m.innerHTML = msg;
}

/* проверка поддержки API */
if (window.File && window.FileList && window.FileReader) {
    Init();
}

/* инициализация */
function Init() {
    var fileselect = $id("fileselect"),
        submitbutton = $id("submitButton");
    keymapfilebutton = $id('keymapfilebutton')

    /* выбор файла */
    if (fileselect) {
        fileselect.addEventListener("change", FileSelectHandler, false);
        submitbutton.style.display = "none";
    }

}

// выбор файла
function FileSelectHandler(e) {

    // проходимся по объекту FileList
    var files = e.target.files || e.dataTransfer.files;
    if (files.length > 1) {
        Output("<p style = 'color:red'>Нужен только один файл</p>")
    } else {
        // парсим все объекты типа File
        for (f of files) {
            if (f.name.endsWith("xml")) {
                if (f.name.length < 15) {
                    $id('fileselect').files[0] = f;
                    ParseFile(f);
                    submitbutton.style.display = "block";
                    keymapfilebutton.innerText = ("Отобразить keymap для " + f.name);
                } else {
                    Output("<p style = 'color:red'>Слишком длинное имя файла (max=15 символов)</p>")
                }

                // fileselect.style.display = 'none';
                // filedrag.style.display = 'none';
            } else {
                submitbutton.style.display = "none";
                Output("<p style = 'color:red'>Ожидается .xml-файл </p>")
            }
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