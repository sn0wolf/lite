/*
 * List Template
 * License LGPL(您可以在任何地方免费使用,但请不要吝啬您对框架本身的改进)
 * http://www.xidea.org/project/lite/
 * @author jindw
 * @version $Id: template.js,v 1.4 2008/02/28 14:39:06 jindw Exp $
 */
var BIT_PRIORITY= 60;
var BIT_PRIORITY_SUB= 3840;
var BIT_ARGS= 192;
var VALUE_CONSTANTS= -1;
var VALUE_VAR= -2;
var VALUE_LIST= -3;
var VALUE_MAP= -4;
var OP_GET= 96;
var OP_INVOKE= 97;
var OP_NOT= 28;
var OP_BIT_NOT= 29;
var OP_POS= 30;
var OP_NEG= 31;
var OP_MUL= 88;
var OP_DIV= 89;
var OP_MOD= 90;
var OP_ADD= 84;
var OP_SUB= 85;
var OP_LT= 336;
var OP_GT= 337;
var OP_LTEQ= 338;
var OP_GTEQ= 339;
var OP_EQ= 80;
var OP_NE= 81;
var OP_EQ_STRICT= 82;
var OP_NE_STRICT= 83;
var OP_BIT_AND= 588;
var OP_BIT_XOR= 332;
var OP_BIT_OR= 76;
var OP_AND= 328;
var OP_OR= 72;
var OP_QUESTION= 68;
var OP_QUESTION_SELECT= 69;
var OP_JOIN= 64;
var OP_PUT= 65;






var TYPE_TOKEN_MAP = {}
var TOKEN_TYPE_MAP = {}
function addToken(type,token){
	TYPE_TOKEN_MAP[type] = token;
	TOKEN_TYPE_MAP[token] = type;
}
//9
addToken(OP_GET,".");
//8
addToken(OP_NOT,"!");
addToken(OP_BIT_NOT,"~");
addToken(OP_POS,"+");
addToken(OP_NEG,"-");
//7
addToken(OP_MUL,"*");
addToken(OP_DIV,"/");
addToken(OP_MOD,"%");
//6
addToken(OP_ADD,"+");
addToken(OP_SUB,"-");
//5
addToken(OP_LT,"<");
addToken(OP_GT,">");
addToken(OP_LTEQ,"<=");
addToken(OP_GTEQ,">=");
addToken(OP_EQ,"==");
addToken(OP_EQ_STRICT,"===");
addToken(OP_NE,"!=");
addToken(OP_NE_STRICT,"!==");
//4
addToken(OP_BIT_AND,"&");
addToken(OP_BIT_XOR,"^");
addToken(OP_BIT_OR,"|");
//3
addToken(OP_AND,"&&");
addToken(OP_OR,"||");

//2
addToken(OP_QUESTION,"?");
addToken(OP_QUESTION_SELECT,":");//map 中的：被直接skip了
//1
addToken(OP_JOIN,",");


function findTokenType(token) {
	return TOKEN_TYPE_MAP[token];
}
function findTokenText(type) {
	return TYPE_TOKEN_MAP[type];
}

function hasTokenParam(type) {
	switch (type) {
	case VALUE_VAR:
	case VALUE_CONSTANTS:
//	case OP_GET_STATIC_PROP:
//	case OP_INVOKE_WITH_STATIC_PARAM:
//	case OP_INVOKE_WITH_ONE_PARAM:
	case OP_PUT:
		return true;
	default:
		return  false;
	}
}
function getTokenParam(el) {
	return el[getTokenParamIndex(el[0])]
}

function getTokenLength(type) {
	var size = getTokenParamIndex(type);
	return hasTokenParam(type)?size+1:size;

}
//function optimizeEL(el){
//	var type = el[0];
//	var end = getTokenParamIndex(type) ;
//	if (end > 1) {//2,3
//	
//		el[1] = optimizeEL(el[1]);
//		var co = canOptimize(el[1][0]);
//		if(end>2){
//			el[2] = optimizeEL(el[2]);
//			co = co &&  canOptimize(el[2][0]);
//		}
//		if(co){
//			var o = evaluate(el, []);
//			var type = typeof o;
//			switch(type){
//				case 'string':
//				case 'boolean':
//					break;
//				case 'number':
//					if(isFinite(o)){
//						break;
//					}
//				default:
//					if(o != null){//object undefined
//						return el;
//					}
//			}
//			return [VALUE_CONSTANTS,o]
//		}
//	}
//	return el;
//}
//
//function canOptimize(type) {
//	return type == VALUE_CONSTANTS;
//}
function getTokenParamIndex(type) {
	if(type<0){
		return 1;
	}
	var c = (type & BIT_ARGS) >> 6;
	return c + 2;
}

var offset = 0
var TYPE_NULL = 1<<offset++;
var TYPE_BOOLEAN = 1<<offset++;
var TYPE_NUMBER = 1<<offset++;
var TYPE_STRING = 1<<offset++;
var TYPE_ARRAY = 1<<offset++;
var TYPE_MAP = 1<<offset++;
var TYPE_ANY = (1<<offset++) -1;

//var TYPE_NULL = 1<<offset++;
//var TYPE_BOOLEAN = 1<<offset++;
//var TYPE_NUMBER = 1<<offset++;

//var TYPE_STRING = 1<<offset++;
//var TYPE_ARRAY = 1<<offset++;
//var TYPE_MAP = 1<<offset++;
/**
 * number return true
 * string return false;
 */
function isNTSFAN(type){
	var isN = (type & TYPE_NULL) ||(type & TYPE_BOOLEAN) ||(type & TYPE_NUMBER);
	var isS = (type & TYPE_STRING) ||(type & TYPE_ARRAY) ||(type & TYPE_MAP);
	if(!isS ){
		return true;
	}
	if(!isN ){
		return false;
	}
	return null;
}
function getAddType(arg1,arg2){
	var t1 = getELType(arg1);
	var t2 = getELType(arg2);
	var ns1 = isNTSFAN(t1);
	var ns2 = isNTSFAN(t2);
	if(ns1 === true || ns2 === true){
		if(ns1 === true){
			if(ns2 === true){//n,n
				return TYPE_NUMBER;
			}else{//n,sn
				
			}
		}else{//sn n
			
		}
		return TYPE_NUMBER|TYPE_STRING;
	}
	if(ns1 === false || ns2 === false){
		return TYPE_STRING;
	}
	return TYPE_NUMBER|TYPE_STRING;
}
function getELType(el){
	var op = el[0];
	var type;
	if(op>0){
		var arg1 = el[1];
		var arg2 = el[2];
		switch(op[0]){
		case OP_JOIN:
			return TYPE_ARRAY;
		case OP_PUT:
			return TYPE_MAP;
		case OP_ADD:
			//if(isNumberAdder(arg1)&&isNumberAdder(arg2)){
			//	//return 'number';
			//}else{
			getAddType(arg1,arg2)
			//}
		case OP_POS:
		case OP_NEG:
		case OP_MUL:
		case OP_DIV:
		case OP_MOD:
		case OP_SUB:
		case OP_BIT_AND:
		case OP_BIT_XOR:
		case OP_BIT_OR:
		case OP_BIT_NOT:
			return  TYPE_NUMBER;
		case OP_NOT:
		case OP_LT:
		case OP_GT:
		case OP_LTEQ:
		case OP_GTEQ:
		case OP_EQ:
		case OP_NE:
		case OP_EQ_STRICT:
		case OP_NE_STRICT:
			return  TYPE_BOOLEAN;
		case OP_AND:
		case OP_OR:
			return  getELType(arg1) | getELType(arg2);
		case OP_GET:
			if(arg1[0] == VALUE_VAR && arg1[1] == 'for'){
				if(op[1] == 'index' || op[1] == 'lastIndex'){
					return TYPE_NUMBER;
				}
			}else if(arg2[0] == VALUE_CONSTANTS && arg2[1] == 'length'){
				var t1 = getELType(arg1);
//var TYPE_NULL = 1<<offset++;
//var TYPE_BOOLEAN = 1<<offset++;
//var TYPE_NUMBER = 1<<offset++;

//var TYPE_STRING = 1<<offset++;
//var TYPE_ARRAY = 1<<offset++;

//var TYPE_MAP = 1<<offset++;
				if(t1 & TYPE_MAP){
					return TYPE_ANY;
				}else if((t1 & TYPE_ARRAY) || (t1 & TYPE_STRING)){
					if((t1 & TYPE_STRING) || (t1 & TYPE_BOOLEAN)||(t1 & TYPE_NUMBER)){
						return TYPE_NULL|TYPE_NUMBER;
					}else{
						return TYPE_NUMBER;
					}
				}else{//only TYPE_STRING TYPE_BOOLEAN TYPE_NUMBER
					return TYPE_NULL;
				}
			}
			return TYPE_ANY;
		case OP_INVOKE:
			return TYPE_ANY;
		default:
			return TYPE_ANY;
		}
	}else{
		switch(op){
		case VALUE_CONSTANTS:
			var v= el[1];
			if(v == null){
				return TYPE_NULL;
			}
			switch(typeof v){
			case 'boolean':
				return TYPE_BOOLEAN;
			case 'number':
				return TYPE_NUMBER;
			case 'string':
				return TYPE_STRING;
			case 'object':
				if(v instanceof Array){
					return TYPE_ARRAY;
				}
				return TYPE_MAP;
			}
			return TYPE_ANY;
		case VALUE_VAR:
			return TYPE_ANY;
		case VALUE_LIST:
			return TYPE_ARRAY;
		case VALUE_MAP:
			return TYPE_MAP;
		default:
			return TYPE_ANY;
		}
	}
}