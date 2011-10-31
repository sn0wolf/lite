var fs = require('fs');
var Path = require('path');
var vm = require('vm');
var Path = require('path');
var scriptBase = Path.join(__dirname,'../../../../');
var $JSI = {
	impl:{
		loadText : loadSource,
		eval : evalSource,
		log:function(title,level,msg){console.info(msg)}
	}
}
function loadSource(path){
	path = path.replace(/^classpath\:\/+/,'')
	var tp = scriptBase+path;
	if(Path.existsSync(tp)){
		///console.info('!!'+tp);
		var s = fs.readFileSync(tp,'utf8');
		//console.info('!#!'+s.substring(0,1000));
		return s;
	}
}
var g = {$JSI:$JSI,console:console,require:require};
g.window = g;//{$JSI:$JSI,console:console,require:require};
var context = vm.createContext(g);
function evalSource(thiz,text,path){
	 var fn = vm.runInContext('(function(){'+text+'\n})',context,path);
	 return fn.call(thiz);
}
var bootScript = loadSource('org/xidea/lite/nodejs/boot.js')
+"\n$JSI.preload('org.xidea.jsi',{'':'this.addScript(\"1.js\",[\"console\"])','1.js':'({})'})";

vm.runInContext(bootScript,context,"classpath:///boot.js");
try{
	evalSource(g,"$import('org.xidea.lite:*')",'classpath:///$import');
	evalSource(g,"$import('org.xidea.lite.nodejs:DOMParser')",'classpath:///$import');
	evalSource(g,"$import('org.xidea.lite.nodejs:XPathEvaluator')",'classpath:///$import');
	evalSource(g,"$import('org.xidea.lite.impl.js:*')",'classpath:///$import');
	evalSource(g,"$import('org.xidea.lite.impl:*')",'classpath:///$import');
	evalSource(g,"$import('org.xidea.lite.nodejs:TemplateEngine')",'classpath:///$import');
	var TemplateEngine = evalSource(g,"return TemplateEngine;",'classpath:///$import');
}catch(e){
	console.log('error'+e);
	throw e;
}


var templateEngine = new TemplateEngine(root);


process.on('message', function(config) {
	var path = config.path;
	var result = templateEngine.load(path);
    //console.log('child got message:', m.root);
    process.send({path:path,data:result})
});