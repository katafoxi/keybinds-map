var first_fen = 'RNBQKP';
var second_fen = 'rnbqkp';
var colors = ["cellLight", "cellDark"];
//var pieces_folder = location.protocol + "//" + _chess_small_board_domain + "/i/f/pieces/";
var pieces_folder = "/i/f/pieces/";
var ua = navigator.userAgent.toLowerCase();
var isIE = (ua.indexOf("msie") != -1 && ua.indexOf("opera") == -1 && ua.indexOf("webtv") == -1);


drawSmallBoard = function(boardStr, destId, cellsHL, config) {
    loadCss("/css/smallboard.css?418");
    var shortStr = boardStr;
    boardStr = shortBoardToLong(boardStr);
    var hlCells = {};
    var config = config || {},
        imgpath;

    if (typeof cs_user != 'undefined' && cs_user.figures_type) {
        imgpath = pieces_folder + cs_user.figures_type + "/";
    } else {
        imgpath = pieces_folder + "original/";
    }
    var yStart = 7,
        yD = -1,
        yFinish = -1,
        xStart = 0,
        xD = 1,
        xFinish = 8;

    if (config.reverse) {
        yStart = 0;
        yD = 1;
        yFinish = 8;
        xStart = 7;
        xD = -1;
        xFinish = -1;
    }

    if (cellsHL) {
        for (var i = 0; i < cellsHL.length; i++) hlCells[cellsHL[i]] = true;
    }
    if (boardStr.length == 64) {
        var colorsNames = ["white", "black"];
        var tableHtml = '';
        var chars = 'abcdefgh';

        var charsHtml = '<tr><td></td>';
        for (var i = xStart; i != xFinish; i += xD) {
            charsHtml += '<td class="char">' + chars.charAt(i) + '</td>';
        }
        charsHtml += '</tr>';

        tableHtml += charsHtml;

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
                    //if (isIE)
                    //    tableHtml += '<span style="margin: auto;display:block;width:20px;height:20px;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + src + '\');"></span>';
                    //else
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
    }
};

getNameByCode = function(code) {
    switch (code) {
        case "R":
        case "r":
            return "lad";
            break;
        case "N":
        case "n":
            return "kon";
            break;
        case "B":
        case "b":
            return "off";
            break;
        case "K":
        case "k":
            return "kor";
            break;
        case "Q":
        case "q":
            return "fer";
            break;
        case "P":
        case "p":
            return "pes";
            break;
        default:
            return "0";
    }
};
getImgName = function(code, name, color) {
    if (code == '0') return "";
    var f_color;
    if (first_fen.indexOf(code) != -1) f_color = 'w';
    else f_color = 'b';
    img = name + "_" + f_color + ".png";
    return img;
};
shortBoardToLong = function(shortStr) {
    var longStr = '';
    for (var i = 0; i < shortStr.length; i++) {
        var curChar = shortStr.charAt(i);
        var num = parseInt(curChar);
        if (num >= 0) {
            nextNum = parseInt(shortStr.charAt(i + 1));
            if (nextNum >= 0) {
                num = parseInt(shortStr.substr(i, 2));
                i += 1;
            }
            for (var j = 0; j < num; j++)
                longStr += '0';
        } else {
            longStr += curChar;
        }
    }
    return longStr;
};
var _loadedCss = {};
loadCss = function(path) {
    if (!_loadedCss[path]) {
        var link = document.createElement('link');
        var h = document.getElementsByTagName('head')[0];
        link.href = path;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        h.appendChild(link);
        _loadedCss[path] = true;
    }
};

if (_chess_small_board_draw_requests && _chess_small_board_draw_requests.length) {
    for (var i = 0; i < _chess_small_board_draw_requests.length; i++) {
        drawSmallBoard.apply(document, _chess_small_board_draw_requests[i]);
    }
}