drawSmallBoard = function() {
    var destObj = document.getElementById(destId);


    //create row 1
    var tableHtml = '';
    var chars = 'abcdefgh';

    var charsHtml = '<tr><td></td>';
    for (var i = xStart; i != xFinish; i += xD) {
        charsHtml += '<td class="char">' + chars.charAt(i) + '</td>';
    }
    charsHtml += '</tr>';
    tableHtml += charsHtml;
    destObj.innerHTML = tableHtml;
}

drawSmallBoard();

/*

    for (var y = yStart; y != yFinish; y += yD) {
        tableHtml += '<tr>';
        tableHtml += '<td class="num">' + (y + 1) + '</td>';

        for (var x = xStart; x != xFinish; x += xD) {
            var classes = '';
            classes += "f";

            var colorClass = colors[1 - (x + y) % 2];
            var code = boardStr.charAt(8 * y + x);
            var figure = getImgName(code, getNameByCode(code), colorsNames[(x + y) % 2]);
            classes += " " + colorClass;
            var src = imgpath + figure;
            tableHtml += '<td class="' + classes + '">';
            if (figure != '') {

                tableHtml += '<img src="' + src + '" />';
            }
            var cell = chars.charAt(x) + (y + 1);
            if (hlCells[cell]) { tableHtml += '<div class="cellHL"></div>' };
            tableHtml += '</td>';
        }
        tableHtml += '<td class="num">' + (y + 1) + '</td>';
        tableHtml += '</tr>';
    }

    tableHtml += charsHtml;

    var link_text = (_chess_small_board_lang && _chess_small_board_lang == 'en') ? 'Analyze position' : 'Анализ позиции';
    if (!config.hide_analyze_link) {
        tableHtml += '<tr><td colspan="10" style="padding: 2px 0px 0px 5px"><a target="_blank" href="' + location.protocol + '//' + _chess_small_board_domain + '/tools/editor.html?board=' + shortStr + '">' + link_text + ' &gt;&gt;</a></td></tr>';
    }

    var sizeCls = '';
    if (config.size) {
        if (config.size == 'm') sizeCls = 'size_medium';
        else if (config.size == 'b') sizeCls = 'size_big';
    }

    var tableId = "tid" + Math.random().toString().replace(".", "");
    tableHtml = '<table id="' + tableId + '" class="hide smallboard ' + sizeCls + '">' + tableHtml + '</table>';
    if (destId == undefined) {
        var destId = "board" + boardStr + "_" + Math.round(Math.random() * 1000);
        document.write('<div id="' + destId + '"></div>');
        destObj = document.getElementById(destId);
    } else {
        var destObj = document.getElementById(destId);
        if (destObj.getElementsByClassName) {
            var elems = destObj.getElementsByClassName('smallboard');
            for (var i = 0; i < elems.length; i++) {
                if (elems[i] && elems[i].parentElement) {
                    elems[i].parentElement.removeChild(elems[i]);
                }
            }
        }
    }
    destObj.innerHTML = tableHtml;
    $("#" + tableId).removeClass('hide');

};

drawSmallBoard();
*/