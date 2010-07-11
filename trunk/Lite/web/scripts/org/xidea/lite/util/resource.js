function loadXML(url){
	try{
		if(url instanceof URI){
			url = url.path;
		}
        if(/^[\s\ufeff]*</.test(url)){
    	    var doc =parseXMLByText(url.substring(url.indexOf('<')))
    	    //alert([data,doc.documentElement.tagName])
    	}else{
    		//print(url)
    	    var pos = url.indexOf('#')+1;
    	    var xpath = pos && url.substr(pos);
    	    var url = pos?url.substr(0,pos-1):url;
    	    var doc = parseXMLByURL(url);
    	    if(xpath){
    	        doc = selectNodes(doc,xpath);
    	    }
    	}
	}catch(e){
		$log.error("文档解析失败",url,e)
		throw e;
	}
	return doc;
}
/**
 * @private
 */
function parseXMLByURL(url){
	var xhr = new XMLHttpRequest();
    xhr.open("GET",url,false)
    xhr.send('');
    if(/\/xml/.test(xhr.getResponseHeader("Content-Type"))){//text/xml,application/xml...
        return xhr.responseXML;
    }else{
        return parseXMLByText(xhr.responseText)
    }
}
/**
 * @private
 */
function parseXMLByText(text){
	try{
		if(this.DOMParser){
	        var doc = new DOMParser().parseFromString(text,"text/xml");
	        var root = doc.documentElement;
	        if(root.tagName == "parsererror"){
	        	var s = new XMLSerializer();
	        	$log.error("解析xml失败",s.serializeToString(root))
	        }
	    }else{
	        //["Msxml2.DOMDocument.6.0", "Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"];
	        var doc = new ActiveXObject("Microsoft.XMLDOM");
	        doc.loadXML(text);
	        doc.documentElement.tagName;
	    }
	    
	    return doc;
    }catch(e){
    	$log.error("解析xml失败",e,text);
    	throw e;
    }
}
/**
 * @private
 */
function getNamespaceMap(node){
	var attributes = node.attributes;
	var map = {};
	for(var i = 0;i<attributes.length;i++){
		var attribute = attributes[i];
		var name = attribute.name;
		if(/^xmlns(:.*)?$/.test(name)){
			var value = attribute.value;
			var prefix = name.substr(6) || value.replace(/^.*\/([^\/]+)\/?$/,'$1');
			map[prefix] = value;
		}
	}
	return map;
}

/**
 * TODO:貌似需要importNode
 */
function selectNodes(currentNode,xpath){
	var doc = currentNode.ownerDocument || currentNode;
    var docFragment = doc.createDocumentFragment();
    var nsMap = getNamespaceMap(doc.documentElement);
    try{//ie
    	var buf = [];
    	for(var n in nsMap){
    		buf.push("xmlns:"+n+'="'+nsMap[n]+'"')
    	}
    	doc.setProperty("SelectionNamespaces",buf.join(' '));
    	doc.setProperty("SelectionLanguage","XPath");
        var nodes = currentNode.selectNodes(xpath);
        var buf = [];
        for (var i=0; i<nodes.length; i++) {
            buf.push(nodes.item(i))
        }
    }catch(e){
        var xpe = doc.evaluate? doc: new XPathEvaluator();
        //var nsResolver = xpe.createNSResolver(doc.documentElement);
        var result = xpe.evaluate(xpath, currentNode, function(prefix){return nsMap[prefix]}, 5, null);
        var node;
        var buf = [];
        while (node = result.iterateNext()){
            buf.push(node);
        }
    }
    while (node = buf.shift()){
        docFragment.appendChild(node.cloneNode(true));
    }
    return docFragment;
}

if(!(window.DOMParser && window.XMLHttpRequest || window.ActiveXObject)){
    var pu = Packages.org.xidea.lite.impl.ParseUtil;
    parseXMLByURL = parseXMLByText = function(url){
    	//TODO:data for text
    	url = $JSI.loadText&&$JSI.loadText(url) || url;
        if(/^[\s\ufeff]*</.test(url)){
        	return pu.loadXML(url,null);
        }else{
        	var pos = url.indexOf('#')+1;
        	var xpath = pos && url.substr(pos);
        	var url = pos?url.substr(0,pos-1):url;
        	var doc = pu.loadXML(url,null);
        	if(xpath){
		        doc = selectNodes(doc,xpath);
		    }
		    return doc;
        }
    }
    selectNodes = function(node,path){
        return pu.selectNodes(node,path);
    }
}
    
function NodeList(list){
	this.list = list;
	this.length = list.length;
	this.item = itemNodeList;
	this.getLength = itemNodeList;
}
function itemNodeList(i){
	return this.list[i];
}
function getNodeListLength(){
	return this.length;
}

function URI(path){
	if(path.scheme){
		path += '';
	}
	this.path = path+'';
}
URI.create = function(path,currentURI,baseURI){
	var parentPath = (currentURI || baseURI || {}).path
	if(parentPath && !/^\w+\:|^</.test(path)){
		path = parentPath.replace(/[^\/]*(?:[#\?].*)?$/,path)
	}
	return new URI(path);
}
URI.prototype = {
	toString:function(){
		return this.path;
	}
}