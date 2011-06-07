<?php
//require_once('LiteFunction.php');
/**
 * Lite 使用实例代码：
 * <?php
 * require_once("../WEB-INF/classes/LiteEngine.php");
 * # 通过上下文数据方式传递模板参数：
 * #$engine = new LiteEngine();
 * #$context = array("int1"=>1,"text1"=>'1');
 * #$engine->render("/example/test.xhtml",$context);
 * 
 */

class LiteEngine{
	/**
	 * 模板根目录（建议为网站根目录）
	 */
	public $root;
	/**
	 * 中间代码根目录（默认为：/[网站根目录]/WEB-INF/litecode）
	 */
	public $litecode;	
	/**
	 * 上线后建议关闭
	 * 可以制定true,false,客户端 ip 匹配正则表达式
	 * A：10.0.0.0-10.255.255.255
	 * B：172.16.0.0-172.31.255.255
	 * C：192.168.0.0-192.168.255.255 
	 */
	public $debug = '127\.0\.0\.1|10\..+|172\.(?:1[6789]|2.|30|31)\..+|192\.168\..+';
	/**
	 * 当前执行的模板示例
	 */
	public static $instance;
	
	/**
	 * 上线后建议置空
	 * 设置是编译器实现，有则自动编译，必须在$debug 为true时，才能生效
	 */
	public $compiler = "/lite-service.php";
	function LiteEngine($root=null,$litecode=null){
		if(!$root){
			$pos = strrpos(__FILE__,'WEB-INF');
			$root = $pos ? substr(__FILE__,0,$pos) : $_SERVER['DOCUMENT_ROOT'];
		}
		
		$this->root = strtr(realpath($root),'\\','/').'/';
		if($litecode){
			$this->litecode = $litecode;
		}else{
			$this->litecode = $this->root.'WEB-INF/litecode/';
		}
		
	}

	function render($path,$context){
		global $lite__instance;
		$old = $lite__instance;
		if($old == null){
			if(is_string($this->debug)){
				$this->debug = !!preg_match("/^(?:$this->debug)$/",$_SERVER["REMOTE_ADDR"]);
			}
		}
	    $lite__instance = $this;
		$fn = lite_load($path);
	    $fn($context);
	    $lite__instance = $old;
	}
}
/**
 * 装载模板函数
 * @return function name
 */
function lite_load($path,$engine=null){
	global $lite__instance;
	$fn = 'lite_template'.str_replace(array('.','/','-','!','%'),'_',$path);
    if($lite__instance->compiler && !$lite__instance->debug){
    	$_REQUEST['LITE_ACTION'] = 'compile';
    	$_REQUEST['LITE_PATH'] = $path;
    	$_REQUEST['LITE_SERVICE_URL'] = $lite__instance->compiler;
    	require($lite__instance->root.$lite__instance->compiler);
    }
    require_once($lite__instance->litecode.strtr($path,'/','^').'.php');
    return $fn;
}


/**
 * javascript == 运算符模拟
 * @return bool
 */
function lite_op__eq($lop, $rop) {
    if($lop === null || $rop === null){
    	return $rop === $lop;
    }
    if(is_string($lop) || is_string($rop)){//0 == 'ttt'=>false
        return strcmp($lop,$rop) == 0;
    }else{
        return $lop == $rop;
    }
}

/**
 * javascript + 运算符模拟
 * @return string|number
 */
function lite_op__add($lop, $rop) {
	if($lop === null || $lop === false || $lop === true || is_numeric($lop)){
		if($rop === null || $rop === false){
			return $lop;
		}else if($rop === true || is_numeric($rop)){
			return $lop + $rop;
		}
	}
	return $lop . $rop;
}
/**
 *
 * 左操作数为确定数值类型(number/boolean/null)的 javascript + 运算符模拟
 * @return string|number
 */
function lite_op__add_nx($lop, $rop) {
	if($rop === null || $rop === false){
		return $lop;
	}else if($rop === true || is_numeric($rop)){
		return $lop + $rop;
	}else{
		return $lop . $rop;
	}
}

/**
 * 获取属性懂得函数(当有特殊属性的时候(length),需要调用这个函数)
 * @param array|object $base
 * @param string $key
 * @return mixed
 */
function lite_op__get($obj, $key) {
	//switch 有陷阱 $key == 0 =>0 =='length'
	if($key === 'length'){
		if(is_string($obj)){
			//TODO: add muti-charsets supported
			return mb_strlen($obj);
		}else if(is_array($obj)){
			return count($obj);
		}
	}
	return @$obj[$key];
}
/* ================ 全局函数调用 =================*/

/**
 * isFinite Evaluates an argument to determine whether it is a finite number
 */
function lite__isFinite($op) {
	if (!is_numeric($op)) {
		//in EcmasScript unnumeric string is infinite
		return false;
	}
	return is_finite($op);
}

/**
 * isNaN Evaluates an argument to determine if it is not a number
 */
function lite__isNaN($op) {
	return is_nan($op);
}

/**
 * parseInt Parses a string argument and returns an integer of the specified radix or base
 * @param int $radix
 * @return number
 */
function lite__parseInt($value, $radix=null) {
	if($radix){
		return intval($value,$radix);
	}else{
		if(preg_match('/^([+-]?)(0x?)([0-9a-fA-F]+)/',$value,$result)){
			if($result[2] == '0'){
				$radix = 8;
			}else{
				$radix = 16;
			}
			$value = $result[3];
			if($result[1] == '-'){
				return -intval($value,$radix);
			}
			return intval($value,$radix);
		}else{
			return intval($value);
		}
	}
}

/**
 * parseFloat Parses a string argument and returns a floating point number
 * @return number
 */
function lite__parseFloat($value) {
	return floatval($value);
}

/**
 * use raurlencode 'cause it's is more comply with the RFC1738
 * converts blank to %20 as ECMA-262 does, on the contrary urlencode convert blank to '+'
 * @return string
 */
function lite__encodeURIComponent($item,$encoding="UTF-8"){
	if (mb_internal_encoding() != $encoding) {
		$item = iconv(mb_internal_encoding(), $encoding, $item);
	}
	return rawurlencode($item);
}

/**
 * @return string
 */
function lite__decodeURIComponent($item,$encoding="UTF-8"){
	$item = rawurldecode($item);
	if (mb_internal_encoding() != $encoding) {
		$item = iconv($encoding, mb_internal_encoding(), $item);
	}
	return $item;
}

/* ===================== 成员函数调用 ======================*/
/**
 * 成员函数调用入口
 */
function lite_member__($obj,$method,$args){
	if(is_object( $obj ) && method_exists($obj,$method)){
		return call_user_func_array(array($obj,$method),$args);
	}
	$method = 'lite_member_'.$method;
	if(function_exists($method)){
		array_unshift($args,$obj);
		return call_user_func_array($method,$args);
	}else{
		trigger_error("method not existed:".$method);
	}
}
/*============ 标准函数库 ==============*/

/**
 * 所有对象都应该支持的成员方法
 */
function lite_member_toString($obj, $radix=10){
	if ($obj === true || $obj ===  false || $obj ===  null) {
		return json_encode($obj);
	}else if(is_array($obj)) {
		$buf = array();
		foreach($obj as $key=>$value){
			if(!$buf && $key !== 0){
				return '[object Object]';
			}
			array_push($buf,lite_member_toString($value));
		}
        return join(",", $buf);
    }else if(is_numeric($obj)) {
        if ($radix<2 || $radix>36) {
            throw new Error("Error: illegal radix {$radix}");
    	}
    	$float = floatval($obj);
    	if ($radix === 10) {
        	return strval($float);
    	}
    	$int = intval($obj);
    	if($int == $float){
    		return base_convert($float, 10, $radix);//小数没有考虑
    	}else{
    		throw new Error("float toString(radix) not support:{$radix}");
    	}
    }else{
   		return strval($obj);
    }
}

/* =================== string ====================*/

/**
 * String.prototype.split
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194452
 * @owner array
 * @return mixed
 */
function lite_member_split($obj, $separator=null, $limit=-1){
	if('' === $separator){
		return str_split($obj);
	}
	if(is_string($separator)){
		$rtv = explode($separator, $obj);
	}else{
		$rtv = preg_split('/'.$separator['source']+'/',$obj);
	}
	if($limit<0){
		return $rtv;
	}else{
		//php -r "print_r(array_slice(array(1,2,3),0,1))
		return array_slice($rtv,0,$limit);
	}
}

/**
 * String.prototype.charAt
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1196596
 * @owner string
 * @return char
 */
function lite_member_charAt($obj, $index) {
	$len = mb_strlen($obj);
	if ($index <0 || $index >= $len) {
		return "";
	}
	return mb_substr($obj, $index, 1);
}

/**
 * String.prototype.charCodeAt
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1196647
 * @owner string
 * @return number
 */
function lite_member_charCodeAt($obj, $index) {
    $len = mb_strlen($obj);
    if ($index <0 || $index >= $len) {
        //TODO: how to return a  NaN
        return null;
    }
    $char = mb_substr($obj, $index);
    $char = iconv(mb_internal_encoding(), 'utf-16BE', $char);
    $code = unpack("n", $char);
    return $code[1];
}

/**
 * String.prototype.indexOf
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1196895
 * @owner string
 * @return number
 */
function lite_member_indexOf($obj, $needle, $from_index=0) {
	return false === ($index = mb_strpos($obj, $needle, $from_index))? -1 : $index;
}

/**
 * String.prototype.lastIndexOf
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1197005
 * @owner string
 * @return number
 */
function lite_member_lastIndexOf($obj, $needle, $from_index=null) {
	if($from_index === null){
		$index = mb_strrpos($obj, $needle);
	}else{
		$index = mb_strrpos($obj, $needle, $from_index);
	}
	return $index === false ? -1 : $index;
}

/**
 * String.prototype.match
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1205239
 * @owner string
 * @deprecate  ugly implement
 * @return array
 */
function lite_member_match($obj, $regexp) {
	//TODO:flag没有加上
	preg_match_all('/'.$regexp['source'].'/', $obj, $matches);
	return $matches;
}

/**
 * String.prototype.replace
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194258
 * @owner string
 * @deprecate ugly implement
 * @return string
 */
function lite_member_replace($obj, $regexp, $replacement) {
    if(is_array($regexp)){
    	//TODO:flags
        return preg_replace('/'.$regexp['source'].'/', $replacement, $obj);
    }else{
    	//if(is_string($regexp)){
    	$pos = strpos($obj, $regexp);
    	return $pos?substr_replace($obj, $replacement, strlen($regexp)) :$obj;
    }
}

/**
 * String.prototype.toLowerCase
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194765
 * @owner string
 */
function lite_member_toLowerCase($obj) {
	return mb_strtolower($obj);
}

/**
 * String.prototype.toUpperCase
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194823
 * @owner string
 */
function lite_member_toUpperCase($obj) {
	return mb_strtoupper($obj);
}

/**
 * String.prototype.substr
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194823
 * @owner string
 */
function lite_member_substr($obj, $start, $length=null) {
	if ($length<0) {
		return '';
	}else if($length === null){
		return mb_substr($obj, $start);
	}
	return mb_substr($obj, $start, $length);
}

/**
 * String.prototype.substring
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194665
 * @owner string
 */
function lite_member_substring($obj, $start, $end=null) {
	if(!is_string($obj)){
	}
	if ($end ===null) {
		return mb_substr($obj, $start);
	}
	$len = mb_strlen($obj);
	$end = min($len,max($end,0));
	$start = min($len,max($start,0));
	return mb_substr($obj, min($start,$end), abs($start-$end));
}
/* =============== array|string ==================*/
/**
 * 给数组或字符串链接
 * String.prototype.concat
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1196678
 * Array.prototype.concat
 * @see http://www.xidea.org/project/jsidoc/js1.5/array.html#1194827
 * eg : print_r(lite_member_concat(array(1,2,3),1,2,3,array(4,5)));
 *      print_r(lite_member_concat("array(1,2,3)",1,2,3,array(4,5)));
 *      print_r(lite_member_concat("array(1,2,3)",1,2,3,"array(4,5)"));
 * @owner array|string
 * @return mixed
 */
function lite_member_concat($obj){
	$args = func_get_args();
	if (is_array($obj)) {
		$result = array();
		foreach($args as $a){
			array_splice($result,count($result),0,$a);
		}
	}else{
		$result = '';
		foreach($args as $a){
			$result .= lite_member_toString($a);
		}
	}
	return $result;
}

/**
 * 给数组或字符串取子系列
 * String.prototype.slice
 * @see http://www.xidea.org/project/jsidoc/js1.5/string.html#1194366
 * Array.prototype.slice
 * @see http://www.xidea.org/project/jsidoc/js1.5/array.html#1193713
 * @owner array|string
 * @return mixed
 */
function lite_member_slice($obj, $start, $end=0){
	if (is_array($obj)) {
		$len = count($obj);
		$impl = 'array_slice';
	}else if(is_string($obj)){
		$obj = strval($obj);
		$len = mb_strlen($obj);
		$impl = 'mb_substr';
	}else{
		throw new Error("method not support $obj->slice");
	}
	if(func_num_args()<3){
		$end = $len;
	}
	$start = $start <0? max($start + $len,0):min($start,$len);
	$end = $end <0? max($end + $len,0):min($end,$len);
	return $impl($obj, $start, $end - $start);
}

/* =============== array ==================*/

/**
 * Array.prototype.join
 * @see http://www.xidea.org/project/jsidoc/js1.5/array.html#1195456
 * @owner array
 * @return mixed
 */
function lite_member_join($obj, $separator=","){
	$result = null;
	foreach($obj as $e){
		if($result === null){
			$result = '';
		}else{
			$result.=$separator;
		}
		$result.=lite_member_toString($e);;
	}
	return $result == null?'':$result;
}
/**
 * Array.prototype.concat,Array.prototype.reverse 两个方法同时调用的效果
 * @see http://www.xidea.org/project/jsidoc/js1.5/array.html#1194827
 * @see lite_member_concat
 * @owner array
 * @return return a refer to the reversed array 
 */
function lite_member_concat_reverse($obj) {
	if(func_num_args()>1){
		$obj = call_user_func_array('lite_member_concat',func_get_args());
	}
	return array_reverse($obj);
}


/* =============== number ==================*/

/**
 * 实现js函数的toFixed方法
 * @liteMethod number
 * @return string
 */
function lite_member_toFixed($obj, $digits=0){
	$ret = sprintf("%.{$digits}f", $obj);
	return $ret;
}

/* =============== date ==================*/
/**
 * JavaScript 基本日期函数支持
 */
function _lite_date_get($date,$s){
	return +strftime($s,$date);
}
function lite_member_getFullYear($d){
	return _lite_date_get($d,'%Y');
}
function lite_member_getYear($d){
	return _lite_date_get($d,'%Y')-1900;
}
function lite_member_getMonth($d){
	return _lite_date_get($d,'%m')-1;
}
function lite_member_getDay($d){
	return _lite_date_get($d,'%w');
}
function lite_member_getDate($d){
	return _lite_date_get($d,'%d');
}
function lite_member_getHours($d){
	return _lite_date_get($d,'%H');
}
function lite_member_getMinutes($d){
	return _lite_date_get($d,'%M');
}
function lite_member_getSeconds($d){
	return _lite_date_get($d,'%S');
}

?>