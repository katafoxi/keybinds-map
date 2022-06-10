var dragMaster=(function(){var dragObject;var mouseDownAt;var currentDropTarget;function mouseDown(e){e=fixEvent(e);if(e.which!=1)return;mouseDownAt={x:e.pageX,y:e.pageY,element:this};addDocumentEventHandlers();return!1}
function mouseMove(e){e=fixEvent(e);if(mouseDownAt){if(Math.abs(mouseDownAt.x-e.pageX)<5&&Math.abs(mouseDownAt.y-e.pageY)<5){return!1}
var elem=mouseDownAt.element;dragObject=elem.dragObject;if(dragObject.canDrag()){var mouseOffset=getMouseOffset(elem,mouseDownAt.x,mouseDownAt.y);mouseDownAt=null;dragObject.onDragStart(mouseOffset);dragObject.$el.trigger("drag:start",[e,mouseOffset])}else return!0}
dragObject.onDragMove(e.pageX,e.pageY);var newTarget=getCurrentTarget(e);if(currentDropTarget!=newTarget){if(currentDropTarget){currentDropTarget.onLeave(dragObject)}
if(newTarget){newTarget.onEnter(dragObject)}
currentDropTarget=newTarget}
dragObject.$el.trigger("drag:move",[e,{x:e.pageX,y:e.pageY},newTarget]);return!1}
function mouseUp(e){e=fixEvent(e);if(!dragObject){mouseDownAt=null}else{if(dragObject.canDrag()){if(currentDropTarget){currentDropTarget.accept(dragObject);dragObject.onDragSuccess(currentDropTarget)}else{dragObject.onDragFail()}
dragObject.$el.trigger("drag:stop",[e,{x:e.pageX,y:e.pageY},currentDropTarget])}
dragObject=null}
removeDocumentEventHandlers()}
function getMouseOffset(target,x,y){var docPos=$(target).position();return{x:x-docPos.left,y:y-docPos.top}}
function getCurrentTarget(e){var x,y;if(navigator.userAgent.match('MSIE')||navigator.userAgent.match('Gecko')||navigator.userAgent.match('Opera')){x=e.clientX;y=e.clientY}else{x=e.pageX;y=e.pageY}
dragObject.hide();var elem=document.elementFromPoint(x,y);dragObject.show();while(elem){if(elem.dropTarget&&elem.dropTarget.canAccept(dragObject)){return elem.dropTarget}
elem=elem.parentNode}
return null}
function addDocumentEventHandlers(){document.onmousemove=mouseMove;document.onmouseup=mouseUp;document.ondragstart=document.body.onselectstart=function(){return!1}}
function removeDocumentEventHandlers(){document.onmousemove=document.onmouseup=document.ondragstart=document.body.onselectstart=null}
return{makeDraggable:function(element){element.onmousedown=mouseDown}}}());function DragObject(element){element.dragObject=this;dragMaster.makeDraggable(element);var rememberPosition;var mouseOffset;this.canDrag=function(){return!0};this.element=element;this.$el=$(element);this.onDragStart=function(offset){if(this.canDrag()){var s=element.style;rememberPosition={top:s.top,left:s.left,position:s.position,zIndex:s.zIndex};s.position='absolute';s.zIndex=1000;mouseOffset=offset}};this.hide=function(){element.style.display='none'};this.show=function(){element.style.display=''};this.onDragMove=function(x,y){if(this.canDrag()){element.style.top=y-mouseOffset.y+'px';element.style.left=x-mouseOffset.x+'px'}};this.onDragSuccess=function(dropTarget){};this.onDragFail=function(){var s=element.style;if(rememberPosition){s.top=rememberPosition.top;s.left=rememberPosition.left;s.position=rememberPosition.position;s.zIndex=rememberPosition.zIndex}};this.toString=function(){return element.id}};function DropTarget(element){this.element=element;this.$el=$(element);element.dropTarget=this;this.canAccept=function(dragObject){return!0};this.accept=function(dragObject){this.onLeave(dragObject)};this.onLeave=function(dragObject){this.$el.trigger("drop:leave",[this,dragObject.element])};this.onEnter=function(dragObject){this.$el.trigger("drop:enter",[this,dragObject.element])}};function fixEvent(e){e=e||window.event;if(e.pageX==null&&e.clientX!=null){var html=document.documentElement;var body=document.body;e.pageX=e.clientX+(html&&html.scrollLeft||body&&body.scrollLeft||0)-(html.clientLeft||0);e.pageY=e.clientY+(html&&html.scrollTop||body&&body.scrollTop||0)-(html.clientTop||0)}
if(!e.which&&e.button){e.which=e.button&1?1:(e.button&2?3:(e.button&4?2:0))}
return e}
function getOffset(elem){if(elem.getBoundingClientRect){return getOffsetRect(elem)}else{return getOffsetSum(elem)}}
function getOffsetRect(elem){var box=null;try{box=elem.getBoundingClientRect()}catch(e){box={top:elem.offsetTop,left:elem.offsetLeft}}
var body=document.body;var docElem=document.documentElement;var scrollTop=window.pageYOffset||docElem.scrollTop||body.scrollTop;var scrollLeft=window.pageXOffset||docElem.scrollLeft||body.scrollLeft;var clientTop=docElem.clientTop||body.clientTop||0;var clientLeft=docElem.clientLeft||body.clientLeft||0;var top=box.top+scrollTop-clientTop;var left=box.left+scrollLeft-clientLeft;return{top:Math.round(top),left:Math.round(left)}}
function getOffsetSum(elem){var top=0,left=0;while(elem){top=top+parseInt(elem.offsetTop);left=left+parseInt(elem.offsetLeft);elem=elem.offsetParent}
return{top:top,left:left}};addHandler(document,"mousemove",mouseMove);addHandler(document,"mouseup",mouseUp);var dragObject=null;var mouseOffset=null;var mousePos={};function mouseCoords(e){mouseX=mouseY=0;ev=e||window.event;if(ev.pageX||ev.pageY){mouseX=ev.pageX;mouseY=ev.pageY;return{x:mouseX,y:mouseY}}
var de=document.documentElement;var b=document.body;if(de){mouseX=ev.clientX+de.scrollLeft-de.clientLeft;mouseY=ev.clientY+de.scrollTop-de.clientTop}else if(b){mouseX=ev.clientX+b.scrollLeft;mouseY=ev.clientY+b.scrollTop}
return{x:mouseX,y:mouseY}}
function makeClickable(object){addHandler(object,"mousedown",function(){dragObject=this})}
function getMouseOffset(target,ev){ev=ev||window.event;var docPos=getPosition(target);var mousePos=mouseCoords(ev);return{x:mousePos.x-docPos.x,y:mousePos.y-docPos.y}}
function getPosition(e){var left=0;var top=0;while(e.offsetParent){left+=e.offsetLeft;top+=e.offsetTop;e=e.offsetParent}
left+=e.offsetLeft;top+=e.offsetTop;return{x:left,y:top}}
function mouseMove(ev){ev=ev||window.event;mousePos=mouseCoords(ev);if(dragObject){dragObject.style.position='absolute';dragObject.style.top=(mousePos.y-mouseOffset.y)+'px';dragObject.style.left=(mousePos.x-mouseOffset.x)+'px';return!1}}
function mouseUp(){dragObject=null}
function makeDraggable(itemId,dragStartEvent,dragProcessEvent,dragStopEvent){var item=document.getElementById(itemId);if(!item)return;item.onmousedown=function(ev){dragObject=this;mouseOffset=getMouseOffset(this,ev);return!1};if(dragStartEvent!=null)
addHandler(item,"mousedown",dragStartEvent);if(dragProcessEvent!=null)
addHandler(item,"mousemove",function(){if(dragObject)dragProcessEvent()});if(dragStopEvent!=null)
addHandler(item,"mouseup",dragStopEvent)}
function removeDraggable(itemId){var item=document.getElementById(itemId);if(!item)return;item.onmousemove=null;item.onmouseup=null}
function addHandler(object,event,handler){if(typeof object.addEventListener!='undefined')
object.addEventListener(event,handler,!1);else if(typeof object.attachEvent!='undefined')
object.attachEvent('on'+event,handler)}
function removeHandler(object,event,handler){if(typeof object.removeEventListener!='undefined')
object.removeEventListener(event,handler,!1);else if(typeof object.detachEvent!='undefined')
object.detachEvent('on'+event,handler)};var Chess=function(fen,variant){var BLACK='b';var WHITE='w';var EMPTY=-1;var PAWN='p';var KNIGHT='n';var BISHOP='b';var ROOK='r';var QUEEN='q';var KING='k';var SYMBOLS='pnbrqkPNBRQK';var DEFAULT_POSITION='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';var POSSIBLE_RESULTS=['1-0','0-1','1/2-1/2','*'];var GAME_STANDARD=0;var GAME_960=1;var PAWN_OFFSETS={b:[16,32,17,15],w:[-16,-32,-17,-15]};var PIECE_OFFSETS={n:[-18,-33,-31,-14,18,33,31,14],b:[-17,-15,17,15],r:[-16,1,16,-1],q:[-17,-16,-15,1,17,16,15,-1],k:[-17,-16,-15,1,17,16,15,-1]};var ATTACKS=[20,0,0,0,0,0,0,24,0,0,0,0,0,0,20,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,24,24,24,24,24,24,56,0,56,24,24,24,24,24,24,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,20,0,0,0,0,0,0,24,0,0,0,0,0,0,20];var RAYS=[17,0,0,0,0,0,0,16,0,0,0,0,0,0,15,0,0,17,0,0,0,0,0,16,0,0,0,0,0,15,0,0,0,0,17,0,0,0,0,16,0,0,0,0,15,0,0,0,0,0,0,17,0,0,0,16,0,0,0,15,0,0,0,0,0,0,0,0,17,0,0,16,0,0,15,0,0,0,0,0,0,0,0,0,0,17,0,16,0,15,0,0,0,0,0,0,0,0,0,0,0,0,17,16,15,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,-15,-16,-17,0,0,0,0,0,0,0,0,0,0,0,0,-15,0,-16,0,-17,0,0,0,0,0,0,0,0,0,0,-15,0,0,-16,0,0,-17,0,0,0,0,0,0,0,0,-15,0,0,0,-16,0,0,0,-17,0,0,0,0,0,0,-15,0,0,0,0,-16,0,0,0,0,-17,0,0,0,0,-15,0,0,0,0,0,-16,0,0,0,0,0,-17,0,0,-15,0,0,0,0,0,0,-16,0,0,0,0,0,0,-17];var SHIFTS={p:0,n:1,b:2,r:3,q:4,k:5};var FLAGS={NORMAL:'n',CAPTURE:'c',BIG_PAWN:'b',EP_CAPTURE:'e',PROMOTION:'p',KSIDE_CASTLE:'k',QSIDE_CASTLE:'q'};var BITS={NORMAL:1,CAPTURE:2,BIG_PAWN:4,EP_CAPTURE:8,PROMOTION:16,KSIDE_CASTLE:32,QSIDE_CASTLE:64};var RANK_1=7;var RANK_2=6;var RANK_3=5;var RANK_4=4;var RANK_5=3;var RANK_6=2;var RANK_7=1;var RANK_8=0;var SQUARES={a8:0,b8:1,c8:2,d8:3,e8:4,f8:5,g8:6,h8:7,a7:16,b7:17,c7:18,d7:19,e7:20,f7:21,g7:22,h7:23,a6:32,b6:33,c6:34,d6:35,e6:36,f6:37,g6:38,h6:39,a5:48,b5:49,c5:50,d5:51,e5:52,f5:53,g5:54,h5:55,a4:64,b4:65,c4:66,d4:67,e4:68,f4:69,g4:70,h4:71,a3:80,b3:81,c3:82,d3:83,e3:84,f3:85,g3:86,h3:87,a2:96,b2:97,c2:98,d2:99,e2:100,f2:101,g2:102,h2:103,a1:112,b1:113,c1:114,d1:115,e1:116,f1:117,g1:118,h1:119};var ROOKS={w:[{square:SQUARES.a1,flag:BITS.QSIDE_CASTLE},{square:SQUARES.h1,flag:BITS.KSIDE_CASTLE}],b:[{square:SQUARES.a8,flag:BITS.QSIDE_CASTLE},{square:SQUARES.h8,flag:BITS.KSIDE_CASTLE}]};var board=new Array(128);var kings={w:EMPTY,b:EMPTY};var turn=WHITE;var castling={w:0,b:0};var ep_square=EMPTY;var half_moves=0;var move_number=1;var history=[];var header={};var game_type=GAME_STANDARD;if(variant=='960')game_type=GAME_960;if(typeof fen=='undefined'||!fen){load(DEFAULT_POSITION)}else{load(fen)}
function clear(){board=new Array(128);kings={w:EMPTY,b:EMPTY};turn=WHITE;castling={w:0,b:0};ep_square=EMPTY;half_moves=0;move_number=1;history=[];header={};ROOKS={w:[{square:SQUARES.a1,flag:BITS.QSIDE_CASTLE},{square:SQUARES.h1,flag:BITS.KSIDE_CASTLE}],b:[{square:SQUARES.a8,flag:BITS.QSIDE_CASTLE},{square:SQUARES.h8,flag:BITS.KSIDE_CASTLE}]};update_setup(generate_fen())}
function reset(){load(DEFAULT_POSITION)}
function load(fen){var tokens=fen.split(/\s+/);var position=tokens[0];var square=0;var valid=SYMBOLS+'12345678/';if(!validate_fen(fen).valid){return!1}
clear();if(tokens[2].indexOf('K')>-1){castling.w|=BITS.KSIDE_CASTLE}
if(tokens[2].indexOf('Q')>-1){castling.w|=BITS.QSIDE_CASTLE}
if(tokens[2].indexOf('k')>-1){castling.b|=BITS.KSIDE_CASTLE}
if(tokens[2].indexOf('q')>-1){castling.b|=BITS.QSIDE_CASTLE}
for(var i=0;i<position.length;i++){var piece=position.charAt(i);if(piece=='/'){square+=8}else if(is_digit(piece)){square+=parseInt(piece,10)}else{var color=(piece<'a')?WHITE:BLACK;put({type:piece.toLowerCase(),color:color},algebraic(square));if(board[square].type==ROOK&&game_type==GAME_960){if(castling[color]&BITS.QSIDE_CASTLE&&kings[color]==EMPTY){ROOKS[color][0]={square:square,flag:BITS.QSIDE_CASTLE}}
if(castling[color]&BITS.KSIDE_CASTLE&&kings[color]!=EMPTY){ROOKS[color][1]={square:square,flag:BITS.KSIDE_CASTLE}}}
square++}}
turn=tokens[1];ep_square=(tokens[3]=='-')?EMPTY:SQUARES[tokens[3]];half_moves=parseInt(tokens[4],10);move_number=parseInt(tokens[5],10);update_setup(generate_fen());return!0}
function validate_fen(fen){var errors={0:'No errors.',1:'FEN string must contain six space-delimited fields.',2:'6th field (move number) must be a positive integer.',3:'5th field (half move counter) must be a non-negative integer.',4:'4th field (en-passant square) is invalid.',5:'3rd field (castling availability) is invalid.',6:'2nd field (side to move) is invalid.',7:'1st field (piece positions) does not contain 8 \'/\'-delimited rows.',8:'1st field (piece positions) is invalid [consecutive numbers].',9:'1st field (piece positions) is invalid [invalid piece].',10:'1st field (piece positions) is invalid [row too large].'};var tokens=fen.split(/\s+/);if(tokens.length!=6){return{valid:!1,error_number:1,error:errors[1]}}
if(isNaN(tokens[5])||(parseInt(tokens[5],10)<=0)){return{valid:!1,error_number:2,error:errors[2]}}
if(isNaN(tokens[4])||(parseInt(tokens[4],10)<0)){return{valid:!1,error_number:3,error:errors[3]}}
if(!/^(-|[abcdefgh][36])$/.test(tokens[3])){return{valid:!1,error_number:4,error:errors[4]}}
if(!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])){return{valid:!1,error_number:5,error:errors[5]}}
if(!/^(w|b)$/.test(tokens[1])){return{valid:!1,error_number:6,error:errors[6]}}
var rows=tokens[0].split("/");if(rows.length!=8){return{valid:!1,error_number:7,error:errors[7]}}
for(var i=0;i<rows.length;i++){var sum_fields=0;var previous_was_number=!1;for(var k=0;k<rows[i].length;k++){if(!isNaN(rows[i].charAt(k))){if(previous_was_number){return{valid:!1,error_number:8,error:errors[8]}}
sum_fields+=parseInt(rows[i].charAt(k));previous_was_number=!0}else{if(!/^[prnbqkPRNBQK]$/.test(rows[i].charAt(k))){return{valid:!1,error_number:9,error:errors[9]}}
sum_fields+=1;previous_was_number=!1}}
if(sum_fields!=8){return{valid:!1,error_number:10,error:errors[10]}}}
return{valid:!0,error_number:0,error:errors[0]}}
function generate_fen(){var empty=0;var fen='';for(var i=SQUARES.a8;i<=SQUARES.h1;i++){if(board[i]==null){empty++}else{if(empty>0){fen+=empty;empty=0}
var color=board[i].color;var piece=board[i].type;fen+=(color==WHITE)?piece.toUpperCase():piece.toLowerCase()}
if((i+1)&0x88){if(empty>0){fen+=empty}
if(i!=SQUARES.h1){fen+='/'}
empty=0;i+=8}}
var cflags='';if(castling[WHITE]&BITS.KSIDE_CASTLE){cflags+='K'}
if(castling[WHITE]&BITS.QSIDE_CASTLE){cflags+='Q'}
if(castling[BLACK]&BITS.KSIDE_CASTLE){cflags+='k'}
if(castling[BLACK]&BITS.QSIDE_CASTLE){cflags+='q'}
cflags=cflags||'-';var epflags=(ep_square==EMPTY)?'-':algebraic(ep_square);return[fen,turn,cflags,epflags,half_moves,move_number].join(' ')}
function set_header(args){for(var i=0;i<args.length;i+=2){if(typeof args[i]=="string"&&typeof args[i+1]=="string"){header[args[i]]=args[i+1]}}
return header}
function update_setup(fen){if(history.length>0)return;if(fen!=DEFAULT_POSITION){header.SetUp=fen;header.FEN='1'}else{delete header.SetUp;delete header.FEN}}
function get(square){var piece=board[SQUARES[square]];return(piece)?{type:piece.type,color:piece.color}:null}
function put(piece,square){if(!('type' in piece&&'color' in piece)){return!1}
if(SYMBOLS.indexOf(piece.type.toLowerCase())==-1){return!1}
if(!(square in SQUARES)){return!1}
var sq=SQUARES[square];board[sq]={type:piece.type,color:piece.color};if(piece.type==KING){kings[piece.color]=sq}
update_setup(generate_fen());return!0}
function remove(square){var piece=get(square);board[SQUARES[square]]=null;if(piece&&piece.type==KING){kings[piece.color]=EMPTY}
update_setup(generate_fen());return piece}
function build_move(board,from,to,flags,promotion){var move={color:turn,from:from,to:to,flags:flags,piece:board[from].type};if(promotion){move.flags|=BITS.PROMOTION;move.promotion=promotion}
if(board[to]&&board[to].color!=board[from].color){move.captured=board[to].type}else if(flags&BITS.EP_CAPTURE){move.captured=PAWN}
return move}
function generate_moves(options){function add_move(board,moves,from,to,flags){if(board[from].type==PAWN&&(rank(to)==RANK_8||rank(to)==RANK_1)){var pieces=[QUEEN,ROOK,BISHOP,KNIGHT];for(var i=0,len=pieces.length;i<len;i++){moves.push(build_move(board,from,to,flags,pieces[i]))}}else{moves.push(build_move(board,from,to,flags))}}
var moves=[];var us=turn;var them=swap_color(us);var second_rank={b:RANK_7,w:RANK_2};var first_sq=SQUARES.a8;var last_sq=SQUARES.h1;var single_square=!1;var legal=(typeof options!='undefined'&&'legal' in options)?options.legal:!0;if(typeof options!='undefined'&&'square' in options){if(options.square in SQUARES){first_sq=last_sq=SQUARES[options.square];single_square=!0}else{return[]}}
for(var i=first_sq;i<=last_sq;i++){if(i&0x88){i+=7;continue}
var piece=board[i];if(piece==null||piece.color!=us){continue}
if(piece.type==PAWN){var square=i+PAWN_OFFSETS[us][0];if(board[square]==null){add_move(board,moves,i,square,BITS.NORMAL);var square=i+PAWN_OFFSETS[us][1];if(second_rank[us]==rank(i)&&board[square]==null){add_move(board,moves,i,square,BITS.BIG_PAWN)}}
for(j=2;j<4;j++){var square=i+PAWN_OFFSETS[us][j];if(square&0x88)continue;if(board[square]!=null&&board[square].color==them){add_move(board,moves,i,square,BITS.CAPTURE)}else if(square==ep_square){add_move(board,moves,i,ep_square,BITS.EP_CAPTURE)}}}else{for(var j=0,len=PIECE_OFFSETS[piece.type].length;j<len;j++){var offset=PIECE_OFFSETS[piece.type][j];var square=i;while(!0){square+=offset;if(square&0x88)break;if(board[square]==null){add_move(board,moves,i,square,BITS.NORMAL)}else{if(board[square].color==us)break;add_move(board,moves,i,square,BITS.CAPTURE);break}
if(piece.type=='n'||piece.type=='k')break}}}}
if((!single_square)||last_sq==kings[us]){if(castling[us]&BITS.KSIDE_CASTLE){if(game_type==GAME_STANDARD){var castling_from=kings[us];var castling_to=castling_from+2;if(board[castling_from+1]==null&&board[castling_to]==null&&!attacked(them,kings[us])&&!attacked(them,castling_from+1)&&!attacked(them,castling_to)){add_move(board,moves,kings[us],castling_to,BITS.KSIDE_CASTLE)}}else{var king_from=kings[us];var king_to=us=='w'?SQUARES.g1:SQUARES.g8;var rook_from=ROOKS[us][1].square;var rook_to=us=='w'?SQUARES.f1:SQUARES.f8;var rook_unimpeded=!0;if(rook_from==rook_to){}else{var delta=(rook_from-rook_to>0)?-1:1;for(var i=rook_from+delta;i!=rook_to+delta;i+=delta){if(board[i]&&i!=kings[us]){rook_unimpeded=!1;break}}}
var king_unimpeded=!0;var checked=!1;if(king_from==king_to){checked=attacked(them,king_to)}else{var delta=(king_from-king_to>0)?-1:1;for(var i=king_from+delta;i!=king_to+delta;i+=delta){if(board[i]&&i!=ROOKS[us][1].square){king_unimpeded=!1;break}
if(attacked(them,i)){checked=!0;break}}}
if(rook_unimpeded&&king_unimpeded&&!checked){add_move(board,moves,kings[us],king_to,BITS.KSIDE_CASTLE)}}}
if(castling[us]&BITS.QSIDE_CASTLE){var castling_from=kings[us];var castling_to=castling_from-2;if(game_type==GAME_STANDARD){if(board[castling_from-1]==null&&board[castling_from-2]==null&&board[castling_from-3]==null&&!attacked(them,kings[us])&&!attacked(them,castling_from-1)&&!attacked(them,castling_to)){add_move(board,moves,kings[us],castling_to,BITS.QSIDE_CASTLE)}}else{var king_from=kings[us];var king_to=(us=='w')?SQUARES.c1:SQUARES.c8;var rook_from=ROOKS[us][0].square;var rook_to=(us=='w')?SQUARES.d1:SQUARES.d8;var rook_unimpeded=!0;if(rook_from!=rook_to){var delta=(rook_from-rook_to>0)?-1:1;for(var i=rook_from+delta;i!=rook_to+delta;i+=delta){if(board[i]&&i!=kings[us]){rook_unimpeded=!1;break}}}
var king_unimpeded=!0;var checked=!1;if(king_from==king_to){checked=attacked(them,king_to)}else{var delta=(king_from-king_to>0)?-1:1;for(var i=king_from+delta;i!=king_to+delta;i+=delta){if(board[i]&&i!=ROOKS[us][0].square){king_unimpeded=!1;break}
if(attacked(them,i)){checked=!0;break}}}
if(rook_unimpeded&&king_unimpeded&&!checked){add_move(board,moves,kings[us],king_to,BITS.QSIDE_CASTLE)}}}}
if(!legal){return moves}
var legal_moves=[];for(var i=0,len=moves.length;i<len;i++){make_move(moves[i]);if(!king_attacked(us)){legal_moves.push(moves[i])}
undo_move()}
return legal_moves}
function move_to_san(move){var output='';if(move.flags&BITS.KSIDE_CASTLE){output='O-O'}else if(move.flags&BITS.QSIDE_CASTLE){output='O-O-O'}else{var disambiguator=get_disambiguator(move);if(move.piece!=PAWN){output+=move.piece.toUpperCase()+disambiguator}
if(move.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)){if(move.piece==PAWN){output+=algebraic(move.from)[0]}
output+='x'}
output+=algebraic(move.to);if(move.flags&BITS.PROMOTION){output+='='+move.promotion.toUpperCase()}}
make_move(move);if(in_check()){if(in_checkmate()){output+='#'}else{output+='+'}}
undo_move();return output}
function attacked(color,square){for(var i=SQUARES.a8;i<=SQUARES.h1;i++){if(i&0x88){i+=7;continue}
if(board[i]==null||board[i].color!=color)continue;var piece=board[i];var difference=i-square;var index=difference+119;if(ATTACKS[index]&(1<<SHIFTS[piece.type])){if(piece.type==PAWN){if(difference>0){if(piece.color==WHITE)return!0}else{if(piece.color==BLACK)return!0}
continue}
if(piece.type=='n'||piece.type=='k')return!0;var offset=RAYS[index];var j=i+offset;var blocked=!1;while(j!=square){if(board[j]!=null){blocked=!0;break}
j+=offset}
if(!blocked)return!0}}
return!1}
function king_attacked(color){return attacked(swap_color(color),kings[color])}
function in_check(){return king_attacked(turn)}
function in_checkmate(){return in_check()&&generate_moves().length==0}
function in_stalemate(){return!in_check()&&generate_moves().length==0}
function insufficient_material(){var pieces={};var bishops=[];var num_pieces=0;var sq_color=0;for(var i=SQUARES.a8;i<=SQUARES.h1;i++){sq_color=(sq_color+1)%2;if(i&0x88){i+=7;continue}
var piece=board[i];if(piece){pieces[piece.type]=(piece.type in pieces)?pieces[piece.type]+1:1;if(piece.type==BISHOP){bishops.push(sq_color)}
num_pieces++}}
if(num_pieces==2){return!0}else if(num_pieces==3&&(pieces[BISHOP]==1||pieces[KNIGHT]==1)){return!0}else if(num_pieces==pieces[BISHOP]+2){var sum=0;var len=bishops.length;for(var i=0;i<len;i++){sum+=bishops[i]}
if(sum==0||sum==len){return!0}}
return!1}
function in_threefold_repetition(){var moves=[];var positions={};var repetition=!1;while(!0){var move=undo_move();if(!move)break;moves.push(move)}
while(!0){var fen=generate_fen().split(' ').slice(0,4).join(' ');positions[fen]=(fen in positions)?positions[fen]+1:1;if(positions[fen]>=3){repetition=!0}
if(!moves.length){break}
make_move(moves.pop())}
return repetition}
function push(move){history.push({move:move,kings:{b:kings.b,w:kings.w},turn:turn,castling:{b:castling.b,w:castling.w},ep_square:ep_square,half_moves:half_moves,move_number:move_number})}
function make_move(move){var us=turn;var them=swap_color(us);push(move);if(move.to!=move.from){board[move.to]=board[move.from];board[move.from]=null}
if(move.flags&BITS.EP_CAPTURE){if(turn==BLACK){board[move.to-16]=null}else{board[move.to+16]=null}}
if(move.flags&BITS.PROMOTION){board[move.to]={type:move.promotion,color:us}}
if(board[move.to].type==KING){kings[board[move.to].color]=move.to;if(move.flags&BITS.KSIDE_CASTLE){var rook_to=(us=='w')?SQUARES.f1:SQUARES.f8;var rook_from=ROOKS[us][1].square;board[rook_to]={type:ROOK,color:us};if(rook_to!=rook_from&&board[rook_from].type==ROOK){board[rook_from]=null}}else if(move.flags&BITS.QSIDE_CASTLE){var rook_to=(us=='w')?SQUARES.d1:SQUARES.d8;var rook_from=ROOKS[us][0].square;board[rook_to]={type:ROOK,color:us};if(rook_to!=rook_from&&board[rook_from].type==ROOK){board[rook_from]=null}}
castling[us]=''}
if(castling[us]){for(var i=0,len=ROOKS[us].length;i<len;i++){if(move.from==ROOKS[us][i].square&&castling[us]&ROOKS[us][i].flag){castling[us]^=ROOKS[us][i].flag;break}}}
if(castling[them]){for(var i=0,len=ROOKS[them].length;i<len;i++){if(move.to==ROOKS[them][i].square&&castling[them]&ROOKS[them][i].flag){castling[them]^=ROOKS[them][i].flag;break}}}
if(move.flags&BITS.BIG_PAWN){if(turn=='b'){ep_square=move.to-16}else{ep_square=move.to+16}}else{ep_square=EMPTY}
if(move.piece==PAWN){half_moves=0}else if(move.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)){half_moves=0}else{half_moves++}
if(turn==BLACK){move_number++}
turn=swap_color(turn)}
function undo_move(){var old=history.pop();if(old==null){return null}
var move=old.move;kings=old.kings;turn=old.turn;castling=old.castling;ep_square=old.ep_square;half_moves=old.half_moves;move_number=old.move_number;var us=turn;var them=swap_color(turn);if(move.to!=move.from){board[move.from]=board[move.to];board[move.from].type=move.piece
board[move.to]=null}
if(move.flags&BITS.CAPTURE){board[move.to]={type:move.captured,color:them}}else if(move.flags&BITS.EP_CAPTURE){var index;if(us==BLACK){index=move.to-16}else{index=move.to+16}
board[index]={type:PAWN,color:them}}
if(move.flags&(BITS.KSIDE_CASTLE|BITS.QSIDE_CASTLE)){var rook_to,rook_from;if(move.flags&BITS.KSIDE_CASTLE){rook_to=ROOKS[us][1].square;rook_from=(us=='w')?SQUARES.f1:SQUARES.f8}else if(move.flags&BITS.QSIDE_CASTLE){rook_to=ROOKS[us][0].square;rook_from=(us=='w')?SQUARES.d1:SQUARES.d8}
board[rook_to]={type:ROOK,color:us};if(rook_to!=rook_from&&board[rook_from].type==ROOK){board[rook_from]=null}}
return move}
function get_disambiguator(move){var moves=generate_moves();var from=move.from;var to=move.to;var piece=move.piece;var ambiguities=0;var same_rank=0;var same_file=0;for(var i=0,len=moves.length;i<len;i++){var ambig_from=moves[i].from;var ambig_to=moves[i].to;var ambig_piece=moves[i].piece;if(piece==ambig_piece&&from!=ambig_from&&to==ambig_to){ambiguities++;if(rank(from)==rank(ambig_from)){same_rank++}
if(file(from)==file(ambig_from)){same_file++}}}
if(ambiguities>0){if(same_rank>0&&same_file>0){return algebraic(from)}else if(same_file>0){return algebraic(from).charAt(1)}else{return algebraic(from).charAt(0)}}
return''}
function ascii(){var s='   +------------------------+\n';for(var i=SQUARES.a8;i<=SQUARES.h1;i++){if(file(i)==0){s+=' '+'87654321'[rank(i)]+' |'}
if(board[i]==null){s+=' . '}else{var piece=board[i].type;var color=board[i].color;var symbol=(color==WHITE)?piece.toUpperCase():piece.toLowerCase();s+=' '+symbol+' '}
if((i+1)&0x88){s+='|\n';i+=8}}
s+='   +------------------------+\n';s+='     a  b  c  d  e  f  g  h\n';return s}
function rank(i){return i>>4}
function file(i){return i&15}
function algebraic(i){var f=file(i),r=rank(i);return'abcdefgh'.substring(f,f+1)+'87654321'.substring(r,r+1)}
function swap_color(c){return c==WHITE?BLACK:WHITE}
function is_digit(c){return'0123456789'.indexOf(c)!=-1}
function make_pretty(ugly_move,options){options=options||{};options.nosan=options.nosan||!1;var move=clone(ugly_move);if(!options.nosan)move.san=move_to_san(move);move.to=algebraic(move.to);move.from=algebraic(move.from);var flags='';for(var flag in BITS){if(BITS[flag]&move.flags){flags+=FLAGS[flag]}}
move.flags=flags;return move}
function clone(obj){var dupe=(obj instanceof Array)?[]:{};for(var property in obj){if(typeof property=='object'){dupe[property]=clone(obj[property])}else{dupe[property]=obj[property]}}
return dupe}
function trim(str){return str.replace(/^\s+|\s+$/g,'')}
function perft(depth){var moves=generate_moves({legal:!1})
var nodes=0;var color=turn;for(var i=0,len=moves.length;i<len;i++){make_move(moves[i]);if(!king_attacked(color)){if(depth-1>0){var child_nodes=perft(depth-1);nodes+=child_nodes}else{nodes++}}
undo_move()}
return nodes}
return{WHITE:WHITE,BLACK:BLACK,PAWN:PAWN,KNIGHT:KNIGHT,BISHOP:BISHOP,ROOK:ROOK,QUEEN:QUEEN,KING:KING,SQUARES:(function(){var keys=[];for(var i=SQUARES.a8;i<=SQUARES.h1;i++){if(i&0x88){i+=7;continue}
keys.push(algebraic(i))}
return keys})(),FLAGS:FLAGS,castling:function(){return castling},load:function(fen){return load(fen)},reset:function(){return reset()},moves:function(options){var ugly_moves=generate_moves(options);var moves=[];for(var i=0,len=ugly_moves.length;i<len;i++){if(typeof options!='undefined'&&'verbose' in options&&options.verbose){moves.push(make_pretty(ugly_moves[i],options))}else{moves.push(move_to_san(ugly_moves[i]))}}
return moves},in_check:function(){return in_check()},in_checkmate:function(){return in_checkmate()},in_stalemate:function(){return in_stalemate()},in_draw:function(){return half_moves>=100||in_stalemate()||insufficient_material()||in_threefold_repetition()},insufficient_material:function(){return insufficient_material()},in_threefold_repetition:function(){return in_threefold_repetition()},game_over:function(){return half_moves>=100||in_checkmate()||in_stalemate()||insufficient_material()||in_threefold_repetition()},validate_fen:function(fen){return validate_fen(fen)},fen:function(){return generate_fen()},pgn:function(options){var newline=(typeof options=="object"&&typeof options.newline_char=="string")?options.newline_char:"\n";var max_width=(typeof options=="object"&&typeof options.max_width=="number")?options.max_width:0;var result=[];var header_exists=!1;for(var i in header){result.push("["+i+" \""+header[i]+"\"]"+newline);header_exists=!0}
if(header_exists&&history.length){result.push(newline)}
var reversed_history=[];while(history.length>0){reversed_history.push(undo_move())}
var moves=[];var move_string="";var pgn_move_number=1;while(reversed_history.length>0){var move=reversed_history.pop();if(pgn_move_number==1&&move.color=='b'){move_string='1. ...';pgn_move_number++}else if(move.color=='w'){if(move_string.length){moves.push(move_string)}
move_string=pgn_move_number+'.';pgn_move_number++}
move_string=move_string+" "+move_to_san(move);make_move(move)}
if(move_string.length){moves.push(move_string)}
if(typeof header.Result!='undefined'){moves.push(header.Result)}
if(max_width==0){return result.join("")+moves.join(" ")}
var current_width=0;for(var i=0;i<moves.length;i++){if(current_width+moves[i].length>max_width&&i!=0){if(result[result.length-1]==" "){result.pop()}
result.push(newline);current_width=0}else if(i!=0){result.push(" ");current_width++}
result.push(moves[i]);current_width+=moves[i].length}
return result.join("")},load_pgn:function(pgn,options){function mask(str){return str.replace(/\n/g,'\\n')}
function move_from_san(move){var to,from,flags=BITS.NORMAL,promotion;var parse=move.match(/^([NBKRQ])?([abcdefgh12345678][12345678]?)?(x)?([abcdefgh][12345678])(=[NBRQ])?/);if(move.slice(0,5)=='O-O-O'){from=kings[turn];to=(turn=='w')?SQUARES.c1:SQUARES.c8;flags=BITS.QSIDE_CASTLE}else if(move.slice(0,3)=='O-O'){from=kings[turn];to=(turn=='w')?SQUARES.g1:SQUARES.g8;flags=BITS.KSIDE_CASTLE}else if(parse&&parse[1]){var piece=parse[1].toLowerCase();if(parse[3]){flags=BITS.CAPTURE}
to=SQUARES[parse[4]];for(var j=0,len=PIECE_OFFSETS[piece].length;j<len;j++){var offset=PIECE_OFFSETS[piece][j];var square=to;while(!0){square+=offset;if(square&0x88)break;var b=board[square];if(b){if(b.color==turn&&b.type==piece&&(!parse[2]||algebraic(square).indexOf(parse[2])>=0)){from=square}
break}
if(piece=='n'||piece=='k')break}}}else if(parse){if(parse[3]){to=SQUARES[parse[4]];for(j=2;j<4;j++){var square=to-PAWN_OFFSETS[turn][j];if(square&0x88)continue;if(board[square]!=null&&board[square].color==turn&&algebraic(square)[0]==parse[2]){from=square}}
if(board[to]){flags=BITS.CAPTURE}else{flags=BITS.EP_CAPTURE}}else{to=SQUARES[move.slice(0,2)]
var c=to-PAWN_OFFSETS[turn][0],b=board[c];if(b&&b.type==PAWN&&b.color==turn){from=c}else{c=to-PAWN_OFFSETS[turn][1];b=board[c];if(b&&b.type==PAWN&&b.color==turn){from=c;flags=BITS.BIG_PAWN}}}
if(parse[5]){promotion=parse[5][1].toLowerCase()}}
if(from>=0&&to>=0&&flags){return build_move(board,from,to,flags,promotion)}else if(move.length>0){}}
function get_move_obj(move){return move_from_san(trim(move))}
function has_keys(object){var has_keys=!1;for(var key in object){has_keys=!0}
return has_keys}
function parse_pgn_header(header,options){var newline_char=(typeof options=='object'&&typeof options.newline_char=='string')?options.newline_char:'\n';var header_obj={};var headers=header.split(newline_char);var key='';var value='';for(var i=0;i<headers.length;i++){key=headers[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/,'$1');value=headers[i].replace(/^\[[A-Za-z]+\s"(.*)"\]$/,'$1');if(trim(key).length>0){header_obj[key]=value}}
return header_obj}
var newline_char=(typeof options=='object'&&typeof options.newline_char=='string')?options.newline_char:'\n';var regex=new RegExp('^(\\[(.|'+mask(newline_char)+')*\\])'+'('+mask(newline_char)+')*'+'1\.('+mask(newline_char)+'|.)*$','g');var header_string=pgn.replace(regex,'$1');if(header_string[0]!='['){header_string=''}
reset();var headers=parse_pgn_header(header_string,options);for(var key in headers){set_header([key,headers[key]]);if(key.toLowerCase()=='variant'&&headers[key].toLowerCase()=='chess960'){game_type=GAME_960}}
if('FEN' in headers){load(headers.FEN)}
var ms=pgn.replace(header_string,'').replace(new RegExp(mask(newline_char),'g'),' ');ms=ms.replace(/(\{[^}]+\})+?/g,'');ms=ms.replace(/\d+\./g,'');var moves=trim(ms).split(new RegExp(/\s+/));moves=moves.join(",").replace(/,,+/g,',').split(",");var move='';for(var half_move=0;half_move<moves.length-1;half_move++){move=get_move_obj(moves[half_move]);if(move==null){return!1}else{make_move(move)}}
move=moves[moves.length-1];if(POSSIBLE_RESULTS.indexOf(move)>-1){if(has_keys(header)&&typeof header.Result=='undefined'){set_header(['Result',move])}}else{move=get_move_obj(move);if(move==null){return!1}else{make_move(move)}}
return!0},header:function(){return set_header(arguments)},ascii:function(){return ascii()},turn:function(){return turn},set_turn:function(newTurn){turn=newTurn;ep_square=EMPTY},move:function(move,notLegal){var move_obj=null;var moves=generate_moves({legal:!notLegal});if(typeof move=='string'){for(var i=0,len=moves.length;i<len;i++){if(move==move_to_san(moves[i])){move_obj=moves[i];break}}}else if(typeof move=='object'){for(var i=0,len=moves.length;i<len;i++){if(move.from==algebraic(moves[i].from)&&move.to==algebraic(moves[i].to)&&(!('promotion' in moves[i])||move.promotion==moves[i].promotion)){move_obj=moves[i];break}}}
if(!move_obj){return null}
var pretty_move=make_pretty(move_obj);make_move(move_obj);return pretty_move},make_move:function(move_obj){make_move(move_obj);return move_obj},undo:function(){var move=undo_move();return(move)?make_pretty(move):null},clear:function(){return clear()},put:function(piece,square){return put(piece,square)},get:function(square){return get(square)},remove:function(square){return remove(square)},perft:function(depth){return perft(depth)},square_color:function(square){if(square in SQUARES){var sq_0x88=SQUARES[square];return((rank(sq_0x88)+file(sq_0x88))%2==0)?'light':'dark'}
return null},history:function(options){var reversed_history=[];var move_history=[];var verbose=(typeof options!='undefined'&&'verbose' in options&&options.verbose);while(history.length>0){reversed_history.push(undo_move())}
while(reversed_history.length>0){var move=reversed_history.pop();if(verbose){move_history.push(make_pretty(move))}else{move_history.push(move_to_san(move))}
make_move(move)}
return move_history},raw_history:function(){return history},algebraic:function(i){return algebraic(i)}}}
if(typeof exports!='undefined')exports.Chess=Chess;var first_fen='RNBQKP';var second_fen='rnbqkp';var IMG_WIDTH=35;var IMG_HEIGHT=35;var events_block=!1;droppableFlag=!1;function GameBoard(mode){this.mode=mode;this.cells=[];this.lastCell=null;this.selectedCell=null;this.currentView=1;this.boardPlaceId="gameBoardPlace";this.cellSize=0;this.boardPlace={top:0,left:0,width:0,height:0}
this.korMoved={1:!1,2:!1};this.longLadMoved={1:!1,2:!1};this.shortLadMoved={1:!1,2:!1};this.dragSelector="."+figuresClass;this.dragContainerSelector=null;this.init=function(){if($.browser.msie)this.cellSize=43;else this.cellSize=41;var boardPosition=getPosition(ge(this.boardPlaceId));this.boardPlace.top=boardPosition.top;this.boardPlace.left=boardPosition.left};this.getFiguresType=function(el){var gb=el,$gb=$(gb),figures_type;if($gb.hasClass('layout-details')){var data=$gb.data('loadedCss');if(data){figures_type=data.figures}}else{var data=$gb.closest(".layout-details").data('loadedCss');if(data){figures_type=data.figures}}
return figures_type};this.draw=function(pview){ge('gameBoardPlace').innerHTML='';if(!pview||pview==null){pview=this.currentView}else{this.currentView=pview}
var s='';var figures_type=this.getFiguresType(ge('gameBoardPlace'));var i,is,ie,di,j,je,js,de,dj,c,ce,dc;if(pview==1){is=8;ie=1;di=-1;js=1;je=8;dj=1;c=1;ce=8;dc=1}else{is=1;ie=8;di=1;js=8;je=1;dj=-1;c=8;ce=1;dc=-1}
var chars='';var bot_chars='';var charstr=" ABCDEFGH";while(c!=(ce+dc)){chars+='<td class="charnum top_chars">'+charstr.charAt(c)+'</td>';bot_chars+='<td class="charnum bot_chars">'+charstr.charAt(c)+'</td>';c+=dc}
var colors=Array(white_col,black_col);var cols=Array("white","black");var cols_classes=['board-col-white','board-col-black'];var rus_cols=Array("Белый","Чёрный");var rows='';i=is;var cellIds=[];while(i!=(ie+di)){var cells='';j=js;while(j!=(je+dj)){var num=10*i+j;var col_ind=1-(i+j)%2;var color=boardColors[1-(i+j)%2];var id=i+""+j;var figure=this.cells[num].getImgName(cols[(i+j)%2]).replace(".png","");figure=figure||'empty';var img_html='';if(figure!='empty'){img_html='<img style="width:100%;height:100%;" src="/i/f/pieces/'+figures_type+'/'+figure+'.png" />'}
var cellId="c"+id;var touchClass=" draggable";cellIds.push(cellId);cells+='<td id="drop_'+cellId+'" class="cell_td '+cols_classes[col_ind]+'">'+'<div class="fig'+touchClass+'" id="'+cellId+'" >'+'<div style="position:absolute;z-index:100;" class=" '+figure+'" >'+img_html+'</div>'+'</div>'+'</td>';j+=dj}
rows+='<tr>\n';rows+='<td class="charnum left_num">'+i+'</td>\n';rows+=cells;rows+='\n<td class="charnum right_num">'+i+'</td>\n';rows+='</tr>\n';i+=di}
var result;result='<table class="board_tbl" cellpadding="0" cellspacing="0">\n';result+='<tr>\n';result+='<td></td>\n';result+=chars;result+='<td></td>\n';result+='\n</tr>\n';result+=rows;result+='<tr>\n';result+='<td></td>\n';result+=bot_chars;result+='<td></td>\n';result+='\n</tr>\n';result+='\n</table>\n';ge(this.boardPlaceId).innerHTML=result;if(this.mode==EDITOR_MODE)this.drawFiguresBlock();this.boardPlace.width=$("#"+this.boardPlaceId).width();this.boardPlace.height=$("#"+this.boardPlaceId).height();this.attachEvents();for(var i=0;i<cellIds.length;i++){var cid=cellIds[i];this.makeDraggable(cid)}
$(".cell_td").each(function(){var drop=new DropTarget(this);drop.canAccept=function(dragObject){if(dragObject.element.id.replace("drop_")!=this.element.id)return!0;return!1};drop.$el.bind("drop:enter",function(j_ev,dropTarget,dragEl){var cid=dropTarget.element.id.replace("drop_","");over_event(cid,!0)});drop.$el.bind("drop:leave",function(j_ev,dropTarget,dragEl){var cid=dropTarget.element.id.replace("drop_","");out_event(cid,!0)})});initTouch($("#gameBoardPlace"));if(game.onMoveDone)
game.onMoveDone()}
this.toInt=function(cellId){return parseInt(cellId.substring(1))}
this.click_event=function(cid){if(this.selectedCell){if(this.selectedCell==cid){this.selectedCell=null;this.draw(this.currentView)}else{if(this.selectedCell.indexOf("new_fig_")==0){var code=this.selectedCell.replace("new_fig_","");game.board.cells[this.toInt(cid)]=new GameBoardCell(code)}else{var from=this.toInt(this.selectedCell);var to=this.toInt(cid);var gameMove=new GameMove(from,to);var valid=gameMove.check();if(valid){this.simpleMove(from,to);if(game.chess){if(game.useMoveCheck){game.board.fromFen(game.chess.fen())}else{var gm=new GameMove(from,to);var nfrom=gm.boardCellNumNormalize(from);var nto=gm.boardCellNumNormalize(to);game.chess.remove(nfrom);game.chess.put({type:game.board.cells[to].getPieceType(),color:game.board.cells[to].getColor()},nto)}}}else{game.status.setError("Неверный ход",10)}}
this.selectedCell=null;this.draw(this.currentView)}}else{this.selectedCell=cid}
$("#"+cid).removeClass('board-my-cell-over').removeClass('board-enemy-cell-over')}
this.over_event=function(){if(events_block)return;var $this=$(this);if($this.find(".empty").length==0){$(this).addClass("board-enemy-cell-over")}}
this.out_event=function(){if(events_block)return;$(this).removeClass('board-my-cell-over').removeClass('board-enemy-cell-over')}
this.makeDraggable=function(cid){var self=this;var drag=new DragObject(document.getElementById(cid));drag.canDrag=function(){return!events_block};drag.$el.bind("drag:start",(function(cid){return function(){dragInProgress=!0;self.click_event(cid)}})(cid));drag.$el.bind("drag:stop",(function(cid){return function(j_ev,e,pos,target){dragInProgress=!1;if(target){var new_cid=target.element.id.replace("drop_","");self.click_event(new_cid)}else{self.deleteSelectedFigure()}}})(cid))}
this.deleteSelectedFigure=function(){game.board.cells[this.toInt(this.selectedCell)]=new GameBoardCell("0");this.selectedCell=null;this.draw(this.currentView)}
this.drawFiguresBlock=function(){var figures_type=this.getFiguresType(ge('gameBoardPlace'));var fhtml='';var figures=first+second;var cells=[];for(var i=0;i<figures.length;i++){if(i%first.length==0&&i!=0)fhtml+="<div class='clear'></div>";var code=figures.charAt(i);var fcell=new GameBoardCell(code);var figure=fcell.getImgName().replace(".png","");var img_html='';if(figure!='empty'){img_html='<img style="width:100%;height:100%;" src="/i/f/pieces/'+figures_type+'/'+figure+'.png" />'}
var cellId="new_fig_"+code;fhtml+='<div class="fig draggable pull-left" id="'+cellId+'" >'+'<div style="position:absolute;z-index:100;" class=" '+figure+'">'+img_html+'</div>'+'</div>';cells.push(cellId)}
ge("figuresPlace").innerHTML=fhtml+'<div class="clear"></div>';for(var i=0;i<cells.length;i++){this.makeDraggable(cells[i])}}
this.attachEvents=function(){this.dragSelector="."+figuresClass;this.dragContainerSelector=null;$(".fig").hover(this.over_event,this.out_event);this.makeHoverable()}
this.position=null;this.getPosition=function(){if(!this.position){this.position=$("#"+this.boardPlaceId).position()}
return this.position}
this.getCellNum=function(posTop,posLeft){var p=this.getPosition();posTop-=p.top;posLeft-=p.left;if(posTop>=0&&posLeft>=0&&posTop<this.boardPlace.height&&posLeft<this.boardPlace.width){var y=9-(Math.floor(posTop/elemSize)+1);var x=Math.floor(posLeft/elemSize)+1;if(this.currentView==2){y=9-y;x=9-x}
if(x>0&&y>0)
return parseInt(y.toString()+x.toString());else return!1}
return!1}
this.figureDragStart=function(ev,ui){var curElemNum=parseInt(dragObject.id.substr(1));if(!(curElemNum>10)){$(dragObject).parent().removeClass("boardCellHover")}
moveStart=!0;move=new GameMove(curElemNum)}
this.figureDrag=function(ev,ui){var curCell=game.board.getCellNum(mousePos.y,mousePos.x);game.board.deHighLightCell(game.board.lastCell);game.board.lastCell=curCell;game.board.highLightCellOver(game.board.lastCell)}
this.figureDragStop=function(ev,ui){var destNum=game.board.getCellNum(mousePos.y,mousePos.x);if(destNum>10&&destNum<89){game.board.deHighLightCell(destNum);if(move.validFrom&&(move.from!=destNum)){move.to=destNum;game.processMove(move)}else{if(!move.validFrom&&dragObject){game.board.cells[destNum]=new GameBoardCell(dragObject.id.substr(1,1));game.board.drawFiguresBlock()}
game.board.reDrawCell(destNum)}}else{if(move.validFrom){game.board.cells[move.from]=new GameBoardCell("0");game.board.reDrawCell(move.from)}
game.board.drawFiguresBlock()}
game.board.attachEvents();if(game.onMoveDone)
game.onMoveDone();moveStart=!1}
this.simpleMove=function(from,to){board.cells[to]=board.cells[from];board.cells[from]=new GameBoardCell("0")}
this.reDrawCell=function(num){this.cells[num].reDraw(num)}
this.deHighLightCell=function(num){removeClass("d"+num,"boardCellHL");removeClass("d"+num,enemyFigureHL);removeClass("d"+num,"boardCellHover")}
this.highLightCellOver=function(num){if(moveStart){if(this.mode==EDITOR_MODE){if(ge("d"+num))
addClass('d'+num,"boardCellHL")}else{if(ge("c"+num)&&ge("c"+num).className.indexOf(enemyFiguresClass)>-1){addClass('d'+num,enemyFigureHL);addClass('d'+num,"boardCellHL")}else if(!ge("c"+num)||ge("c"+num).className.indexOf(myFiguresClass)==-1){addClass('d'+num,"boardCellHL")}}}else{if(ge("d"+num))
addClass('d'+num,"boardCellHover")}}
this.makeHoverable=function(){var cls=myFiguresClass;if(this.mode==EDITOR_MODE)
cls=figuresClass;$("."+cls).hover(function(){if(!moveStart&&!eventsBlock)
$(this).parent().addClass("boardCellHover")},function(){if(!moveStart&&!eventsBlock)
$(this).parent().removeClass("boardCellHover")})}
this.flip=function(){this.draw(3-this.currentView)}
this.loadFromString=function(strBoard){for(var i=0;i<strBoard.length;i++){var smb=strBoard.substr(i,1);var num=(Math.floor(i/8)+1)*10+i%8+1;this.cells[num]=new GameBoardCell(smb)}}
this.loadFromShortString=function(strBoard){this.loadFromString(this.shortBoardToLong(strBoard))}
this.toString=function(){var s='';for(var y=1;y<9;y++){for(var x=1;x<9;x++){var num=10*y+x;s+=this.cells[num].code}}
return s}
this.toShortString=function(){var longStr=this.toString();var figures=second+first;var figures_fen=second_fen+first_fen;var shortStr='';var c=0;for(var i=0;i<longStr.length;i++){if(longStr.charAt(i)=='0'){c++}else{if(c>0)shortStr+=c.toString();shortStr+=longStr.charAt(i);c=0}}
if(c>0)shortStr+=c.toString();return shortStr}
this.shortBoardToLong=function(shortStr){shortStr=shortStr+'';var longStr='';for(var i=0;i<shortStr.length;i++){var curChar=shortStr.charAt(i);var num=parseInt(curChar);if(num>=0){var nextNum=parseInt(shortStr.charAt(i+1));if(nextNum>=0){num=parseInt(shortStr.substr(i,2));i+=1}
for(var j=0;j<num;j++)
longStr+='0'}else{longStr+=curChar}}
return longStr}
this.toFen=function(){if(game.chess){return game.chess.fen()}else{var longStr=this.toString();var fen="",c=0,s="",slashes=0;for(var i=0;i<longStr.length;i++){if(i%8==0&&i>0){if(c>0)s+=c.toString();c=0;if(fen!="")fen="/"+fen;fen=s+fen;s="";slashes ++}
if(longStr.charAt(i)=='0'){c++}else{if(c>0)s+=c.toString();s+=longStr.charAt(i);c=0}}
if(c>0)s+=c.toString();if(slashes<8)fen="/"+fen;if(s)fen=s+fen;fen+=" w KQkq - 0 1";return fen}}
this.fromFen=function(fen){var testChess=new Chess();var res=testChess.validate_fen(fen);if(res.valid){var t=fen.split(" ");var s=t[0];var row=8,col=1;for(var i=0;i<s.length;i++){var curChar=s.charAt(i);if(curChar=='/'){row--;col=1}else{var num=parseInt(curChar);if(num){for(var j=0;j<num;j++){this.cells[row*10+col]=new GameBoardCell("0");col ++}}else{this.cells[row*10+col]=new GameBoardCell(curChar);col ++}}}
if(game.chess)game.chess.load(fen);else{game.chess=new Chess(fen)}
this.draw(this.currentView);return!0}else{return!1}}
this.disableEvents=function(){$("."+myFiguresClass).hover(function(){},function(){})}
this.enableEvents=function(){}
this.clone=function(){var board=new GameBoard();for(a in this.cells){board.cells[a]=this.cells[a].clone()}
return board}}
function GameBoardCell(code){this.code=code.toString();this.getNameByCode=function(code){switch(code){case LAD_B:case LAD_W:return"lad";break;case KON_B:case KON_W:return"kon";break;case OFF_B:case OFF_W:return"off";break;case KOR_B:case KOR_W:return"kor";break;case FER_B:case FER_W:return"fer";break;case PES_B:case PES_W:return"pes";break;default:return""}}
this.name=this.getNameByCode(code);this.getImgName=function(color){if(this.code=='0'||this.code=='')return"";var f_color;if(first.indexOf(this.code)!=-1)f_color='w';else f_color='b';var img=this.name+"_"+f_color+".png";return img}
this.reDraw=function(num){if(this.code!=""&&this.code!='0'){var imgsrc=img_url+'/fs/'+this.getImgName();var imgclass=figuresClass+" "+cellFiguresClass;if(this.my()){imgclass+=" "+myFiguresClass}else if(this.my(3-player)){imgclass+=" "+enemyFiguresClass}
var imgStyle='';var imghtml='';imghtml='<img class="'+imgclass+'" id="c'+num+'" src="'+imgsrc+'">';ge("d"+num).innerHTML=imghtml;$("d"+num).removeClass("boardCellHover")}else ge("d"+num).innerHTML=''}
this.my=function(pl){if(pl==null||!pl)pl=player;if(this.code!=""&&(first.indexOf(this.code)!=-1)&&(pl==1))return!0;if(this.code!=""&&(second.indexOf(this.code)!=-1)&&(pl==2))return!0;return!1}
this.getColor=function(){if(first.indexOf(this.code)!=-1)return'w';if(second.indexOf(this.code)!=-1)return'b'}
this.getPieceType=function(){return this.code.toLowerCase()}
this.clone=function(){return new GameBoardCell(this.code)}}
function click_event(){}
function over_event(){}
function out_event(){}
function addClass(id,cls){var a=ge(id);if(a)a.className+=" "+cls}
function removeClass(id,cls){var a=ge(id);if(a){a.className=a.className.replace(cls,"")}};var errorCodes={"1":"Ошибка","601":"Пешка не может так ходить","605":"Пешка не может перепрыгнуть другую фигуру","606":"Пешка не может так бить","611":"Король не может так ходить","612":"Рокировка не возможна, Ваш король уже ходил в этой игре","613":"Рокировка не возможна, ладья уже ходила в этой игре","621":"Слон не может так ходить","622":"Слон не может перепрыгивать через фигуры","631":"Ладья не может так ходить","632":"Ладья не может перепрыгивать через фигуры","641":"Ферзь не может так ходить","642":"Ферзь не может перепрыгивать через фигуры","651":"Конь не может так ходить"};var EDITOR_MODE='1';var GAME_MODE='2';var PROBLEM_MODE='3';function ChessProcessor(board){this.board=board;this.checkMove=function(move){var code=0;switch(this.board.cells[move.from].name){case 'pes':code=this.checkPes(move);break;case 'lad':code=this.checkLad(move);break;case 'off':code=this.checkOff(move);break;case 'fer':code=this.checkFer(move);break;case 'kon':code=this.checkKon(move);break;case 'kor':code=this.checkKor(move);break}
return code}
this.checkPes=function(move){if(move.turn==1){var startVert=2;var longMoveLen=2;var shortMoveLen=1;var midTest=10;var killLeft=9;var killRight=11}else{var startVert=7;var longMoveLen=-2;var shortMoveLen=-1;var midTest=-10;var killLeft=-11;var killRight=-9}
if((this.board.cells[move.lastMove.to].name=='pes')&&(Math.abs(move.lastMove.to-move.lastMove.from)==20)&&((move.to-move.lastMove.to)==midTest))return 0;if(r1(move.from)==startVert){if(((r1(move.to)-r1(move.from))==longMoveLen)&&(r2(move.from)==r2(move.to))){var tst=move.from+midTest;if(this.board.cells[tst].code!='0')return 605;else return 0}}
if(((r1(move.to)-r1(move.from))==shortMoveLen)&&(r2(move.from)==r2(move.to)))
return 0;if(this.board.cells[move.to].code!='0'){if((move.to==(move.from+11))||(move.to==(move.from+9)))
flag=!0;else return 606}
return 601}
this.checkKor=function(move){if(((Math.abs(r1(move.from)-r1(move.to))==1)&&(Math.abs(r2(move.from)-r2(move.to))==1))||((Math.abs(r1(move.from)-r1(move.to))==0)&&(Math.abs(r2(move.from)-r2(move.to))==1))||((Math.abs(r1(move.from)-r1(move.to))==1)&&(Math.abs(r2(move.from)-r2(move.to))==0))){return 0};var numPlus=0;if(move.turn==2)var numPlus=70;if(move.from==(15+numPlus)){if(move.to==(13+numPlus)){if(this.board.korMoved[move.turn]){return 612}else if(this.board.longLadMoved[move.turn]){return 613}
move.ladFrom=11+numPlus;move.ladTo=14+numPlus;move.rokir=!0;return 0}else if(move.to==(17+numPlus)){if(this.board.korMoved[move.turn]){return 612}else if(this.board.shortLadMoved[move.turn]){return 613}
move.ladFrom=18+numPlus;move.ladTo=16+numPlus;move.rokir=!0;return 0}}
return 611}
this.checkOff=function(move){var flag=!1;if(Math.abs(r1(move.from)-r1(move.to))==Math.abs(r2(move.from)-r2(move.to)))
flag=!0;else return 621;if(flag){if((r1(move.from)>r1(move.to))&&(r2(move.from)>r2(move.to))){for(i=move.from-11;i>move.to;i=i-11){if(this.board.cells[i].code!='0')return 622}}
if((r1(move.from)<r1(move.to))&&(r2(move.from)<r2(move.to))){for(i=move.from+11;i<move.to;i=i+11){if(this.board.cells[i].code!='0')return 622}}
if((r1(move.from)>r1(move.to))&&(r2(move.from)<r2(move.to))){for(i=move.from-9;i>move.to;i=i-9){if(this.board.cells[i].code!='0')return 622}}
if((r1(move.from)<r1(move.to))&&(r2(move.from)>r2(move.to))){for(i=move.from+9;i<move.to;i=i+9){if(this.board.cells[i].code!='0')return 622}}}
return 0}
this.checkLad=function(move){var flag=!1;if((r2(move.from)==r2(move.to))||(r1(move.from)==r1(move.to)))
flag=!0;else return 631;if(flag){if(r2(move.from)==r2(move.to)){if(r1(move.from)>r1(move.to)){for(i=r1(move.to)+1;i<r1(move.from);i++){w=move.from+(-i+r1(move.to))*10;if(this.board.cells[w].code!='0')return 632}}else{for(i=r1(move.from)+1;i<r1(move.to);i++){w=move.from+(i-r1(move.from))*10;if(this.board.cells[w].code!='0')return 632}}}
if(r1(move.from)==r1(move.to)){if(r2(move.from)>r2(move.to)){for(i=r2(move.to)+1;i<r2(move.from);i++){w=move.from-i+r2(move.to);if(this.board.cells[w].code!='0')return 632}}else{for(i=r2(move.from)+1;i<r2(move.to);i++){w=move.from+i-r2(move.from);if(this.board.cells[w].code!='0')return 632}}}}
return 0}
this.checkFer=function(move){var ladCode=this.checkLad(move);if(ladCode>0){var offCode=this.checkOff(move);if(offCode>0){var lastLad=ladCode%100%10;var lastOff=offCode%100%10;if(lastLad!=lastOff)return 642;else return 641}else return 0}else return 0}
this.checkKon=function(move){if(((Math.abs(r1(move.from)-r1(move.to))==1)&&(Math.abs(r2(move.from)-r2(move.to))==2))||((Math.abs(r1(move.from)-r1(move.to))==2)&&(Math.abs(r2(move.from)-r2(move.to))==1)))
return 0;else return 651}};var game=null;$(document).ready(function(){game=new Game(EDITOR_MODE);var boardSize='s';$("#boardFlipper").click(function(){game.board.flip();return!1});$("#boardReDrawer").click(function(){game.board.draw();status.setMessage("Доска перерисована.",5)});var drawPreview=function(boardStr){drawSmallBoard(boardStr,"sampleID",null,{size:boardSize})};game.onMoveDone=function(){var boardStr=game.board.toShortString();var fileName=chess_cool?'coolsmallboard':'smallboard';drawPreview(boardStr);$("#fenCode input[type=text]").val(game.board.toFen());$("#forumCode textarea").val("[board="+boardStr+(boardSize!='s'?','+boardSize:'')+"]");$("#jsCode textarea").val('<script type="text/javascript" src="'+js_url+'/'+fileName+'.js"></script>\n<script> drawSmallBoard("'+boardStr+(boardSize!='s'?',null,null,'+boardSize:'')+'"); </script>');$("#htmlCode textarea").val('<style type="text/css"> @import url("'+css_url+'/smallboard.css"); </style>'+$('#sampleID').html());if(game.chess)$("#currentTurn").text(game.chess.turn()=='w'?"Белые":"Черные")};$("#preview_small_ctrl_id").bind("click change",function(){if($(this).attr("checked"))
$("#preview_small").show("fast");else $("#preview_small").hide("fast")});$("#codes_ctrl_id").bind("click change",function(){if($(this).attr("checked"))
$("#codeBlock").slideDown("fast");else $("#codeBlock").slideUp("fast")});$("#figures_ctrl_id").bind("click change",function(){if($(this).attr("checked"))
$("#figuresPlace").slideDown("fast");else $("#figuresPlace").slideUp("fast")});$("#toggleChcking").click(function(){var $this=$(this);if(game.useMoveCheck){game.disableMoveCheck();$this.text(CS.Lang.moves_checking+": "+CS.Lang.disabled)}else{game.enableMoveCheck();$this.text(CS.Lang.moves_checking+": "+CS.Lang.enabled)}
$this.toggleClass("btn-success");$(".figuresPlace").toggle();$("#chessAttributes").toggleClass("hide");return!1});$("#changeTurn").click(function(){game.changeTurn();return!1});$("#clearBoard").click(function(){if(game.useMoveCheck)$("#toggleChcking").click();game.board.loadFromShortString(64);game.board.draw();game.onMoveDone();return!1});$("#setDefault").click(function(){if(game.useMoveCheck)$("#toggleChcking").click();game.board.loadFromShortString('RNBQKBNRPPPPPPPP32pppppppprnbqkbnr');game.board.draw();game.onMoveDone();return!1});$("#fenCode input[type=button]").click(function(){var fen=$('#fenCode input[type=text]').val();var res=game.board.fromFen(fen);if(!res)alert("Строка FEN содержит ошибки. Исправьте и попробуйте еще раз.");else{game.onMoveDone();game.status.setMessage("Позиция загружена.",5)}});$(".size_ctrl .btn").click(function(){var $this=$(this),size=$this.data('size');$(".size_ctrl .btn").removeClass('active');$this.addClass('active');boardSize=size;game.onMoveDone();return!1});game.hideStatus=!0;game.init(start_board);setTimeout(function(){game.onMoveDone()},1000)});function setSettingsElem(sid,sval){$("#"+sid).attr("checked",sval?"checked":"");$("#"+sid).trigger('change')};var FIGURE_SIZE=35;var CELL_SIZE=40;var CELL_MARGIN={top:2,left:2,right:0,bottom:0};var first="RNBQKP";var second="rnbqkp";PES_W="P";LAD_W="R";KON_W="N";OFF_W="B";FER_W="Q";KOR_W="K";PES_B="p";LAD_B="r";KON_B="n";OFF_B="b";FER_B="q";KOR_B="k";var img_url="/i";var f_url=img_url+'/fs/';var elemSize;var boardColors=["white","#666666"];var moveStart=!1;var eventsBlock=!1;var figuresClass="figure";var cellFiguresClass="cellFigure";var myFiguresClass="myFigure";var enemyFiguresClass="enemyFigure";var enemyFigureHL="enemyFigureHL";var srcFigureClass='srcFigure';var player=1;var game=null;var board=null;var move=null;var lastMove=null;var status=null;function Game(mode){this.mode=mode;this.board=new GameBoard(mode);this.board.init();this.turn=2;this.useMoveCheck=!1;this.chess=null;this.hideStatus=!1;this.status=null;this.onMoveDone=null;this.init=function(boardStr){if(this.mode==EDITOR_MODE){if(boardStr&&boardStr!='')
game.board.loadFromString(game.board.shortBoardToLong(boardStr));else game.board.loadFromString("0000000000000000000000000000000000000000000000000000000000000000");this.useMoveCheck=!1}else game.board.loadFromString("RNBQKBNRPPPPPPPP00000000000000000000000000000000pppppppprnbqkbnr");this.board.draw();if(this.mode!=EDITOR_MODE)
if(this.turn!=player)this.disableEvents();elemSize=$('.boardCell').width()+4;board=game.board;this.status=new Status();this.status.hide()}
this.enableMoveCheck=function(){this.useMoveCheck=!0;this.chess=new Chess(this.board.toFen())}
this.disableMoveCheck=function(){this.useMoveCheck=!1;this.chess=null}
this.processMove=function(move){if(status&&status.clear)status.clear();move.lastMove=lastMove;if(move.check()){move.submit();lastMove=move}}
this.disableEvents=function(){eventsBlock=!0;this.board.disableEvents()}
this.enableEvents=function(){eventsBlock=!1;this.board.enableEvents()}
this.changeTurn=function(){var fen=this.chess.fen();var t=fen.split(" ");t[1]=t[1]=="b"?"w":"b";this.chess.load(t.join(" "));this.onMoveDone()}}
function GameMove(from,to){this.from=from;this.to=to?to:'';this.lastMove=null;this.turn=game.turn;this.rokir=!1;this.ladFrom=0;this.ladTo=0;this.validFrom=!1;if(from>10&&from<89)
this.validFrom=!0;this.check=function(){if(!game.useMoveCheck)return!0;var from=this.boardCellNumNormalize(this.from);var to=this.boardCellNumNormalize(this.to);try{var res=game.chess.move({from:from,to:to})}catch(e){console.log(e);return!1}
return res}
this.boardCellNumNormalize=function(num){var c=parseInt(num.toString().charAt(1)),p="";if(c==1){p='a'}if(c==2){p='b'}
if(c==3){p='c'}if(c==4){p='d'}
if(c==5){p='e'}if(c==6){p='f'}
if(c==7){p='g'}if(c==8){p='h'}
var res=p+num.toString().charAt(0);return res}
this.submit=function(){if(this.mode==GAME_MODE){if(this.rokir){board.cells[this.ladTo]=board.cells[this.ladFrom];board.cells[this.ladFrom]=new GameBoardCell("0");board.reDrawCell(this.ladTo);board.reDrawCell(this.ladFrom);board.korMoved[this.turn]=!0;if(r2(this.ladFrom)==8)
board.shortLadMoved[this.turn]=!0;else if(r1(this.ladFrom)==1)
board.longLadMoved[this.turn]=!0}
if(board.cells[this.from].name=='lad'){if(r2(this.from)==8)
board.shortLadMoved[this.turn]=!0;else if(r1(this.from)==1)
board.longLadMoved[this.turn]=!0}else if(board.cells[this.from].name=='kor'){board.korMoved[this.turn]=!0}else if(board.cells[this.from]=='pes'){if((board.cells[this.lastMove.to]=='pes')&&(Math.abs(this.lastMove.from-this.lastMove.to)==20)){if((board.cells[this.lastMove.to]==PES_W)&&((this.to-this.lastMove.to)==-10))
board.cells[this.lastMove.to]=new GameBoardCell("0");else if((board.cells[this.lastMove.to]==PES_B)&&((this.to-this.lastMove.to)==10))
board.cells[this.lastMove.to]=new GameBoardCell("0")}}}
board.cells[this.to]=board.cells[this.from];board.cells[this.from]=new GameBoardCell("0");board.reDrawCell(this.to);board.reDrawCell(this.from)}}
function Status(){this.timer=null;this.displayErrorByCode=function(errorCode){if(errorCodes[errorCode.toString()])
var txtError=errorCodes[errorCode.toString()];else txtError=errorCodes["1"];this.setError(txtError,10)}
this.setError=function(txt,duration){this.setStatus("alert-error",txt,duration)}
this.setMessage=function(txt,duration){this.setStatus("alert-success",txt,duration)}
this.setStatus=function(cssClass,txt,duration){$("#message").removeClass("alert-success");$("#message").removeClass("alert-error");$("#message").removeClass("alert").addClass("alert");$("#message").addClass(cssClass);$("#message").text(txt).show();$("#messageCloser").show();var self=this;this.timer=setTimeout(function(){self.clear()},duration*1000)}
this.clear=function(){clearTimeout(this.timer);$("#message").hide();$("#messageCloser").hide()}
this.hide=function(){$(".messageBox").hide()}
this.show=function(){$(".messageBox").show()}}
function r1(cell){cell=cell+"";return parseInt(cell.charAt(0))}
function r2(cell){cell=cell+"";return parseInt(cell.charAt(1))}
function ge(id){return document.getElementById(id)}
function debug(s){$('#debug').attr("innerHTML",s)}