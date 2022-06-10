var _chess_small_board_domain = document.domain;
var _chess_small_board_draw_requests = [];
var _chess_small_board_lang = 'ru';

(function() {
    var newscript = document.createElement('script');
    newscript.type = 'text/javascript';
    newscript.async = true;
    newscript.src = location.protocol + "//" + _chess_small_board_domain + "/js/smallboard_body.js?3";
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(newscript);
})();

drawSmallBoard = function() {
    _chess_small_board_draw_requests.push(arguments);
};