"use strict";

var allow_methods = require("methods");

var fn_map_method = function(method){
	return method.trim().toUpperCase();
};
var fn_filter_allow_methods = function(method){
	return !~allow_methods.indexOf(method);
};
var push = Array.prototype.push;
var slice = Array.prototype.slice;
var concat = Array.prototype.concat;

module.exports = Route;

function Route(base){
	if(!this || this.constructor !== Route){
		return new Route(arguments[0]);
	}
	this.base = base || "/";
	this.map = {};
}

var proto = Route.prototype;

allow_methods.forEach(function(name){
	proto[name] = function(re, gen){
		if(re){
			switch(re.constructor.name){
				case "String":
				case "RegExp":
					return this.addHandle(re, name, gen);
				case "GeneratorFunction":
					return this.addHandle("/", name, re);
			}
		}
	};
});

proto.addHandle = function(re, methods, handle){
	if(re){
		switch(re.constructor.name){
			case "String":
			case "RegExp":
				if(methods){
					switch(methods.constructor.name){
						case "String":
							methods = methods.split(",")
								.map(fn_map_method)
								.filter(fn_filter_allow_methods);
							//handle = concat.apply([], slice.call(arguments, 2));
						break;
						case "Array":
							methods = methods.filter(fn_filter_allow_methods);
						break;
						case "GeneratorFunction":
							handle = methods;
							methods = ["GET"];
						break;
					}
				}
			break;
			case "GeneratorFunction":
				handle = re;
				re = "/";
				methods = ["GET"];
			break;
		}
		if(handle && handle.constructor.name === "GeneratorFunction"){
			var that = this;
			var map = this.map;
			methods.forEach(function(method){
				map[method] = map[method] || [];
				var m = map[method].filter(function(locale){
					switch(re.constructor.name){
						case "String":
							return re == locale.re;
						break;
						case "RegExp":
							return re.source === locale.re.source &&
								re.ignoreCase === locale.re.ignoreCase &&
								re.global === locale.re.global &&
								re.multiline === locale.re.multiline;
						break;
					}
				});
				if(m.length === 0){
					m.push({
						re: re,
						gens: []
					});
					map[method].push(m[0]);
				}
				m.forEach(function(locale){
					if(locale.gens.indexOf(handle) === -1){
						locale.gens.push(handle);
					}
				});
			});
		}
	}
	return this;
};
proto.gen = proto.generator = function(){
	var that = this;
	var map = this.map;
	return function*(next){
		var handles = map[this.method];
		if(handles){
			for(var i = 0, l = handles.length; i < l; i ++){
				var locale = handles[i];
				switch(locale.re.constructor.name){
					case "String":
						if(locale.re === this.path){
							yield locale.gens;
						}
					break;
					case "RegExp":
						if(locale.re.test(this.path)){
							this.params = this.path.match(locale.url).splice(1);
							yield locale.gens;
						}
					break;
				}
			}
		}
		yield next;
	};
};