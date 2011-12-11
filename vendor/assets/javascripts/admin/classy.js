(function(context) {
	
	var NO_OP = {};
	
	function Class() {};
	Class.prototype = {
		init: function() {},
		respondsTo: function(method) {
			return typeof this[method] == 'function';
		}
	};
	
	Class._initName = 'init';
	
	Class.extend = function(features, initFunctionName) {
	  initFunctionName = initFunctionName || this._initName;

		var klass = function(_) {
			if (_ != NO_OP) {
				this._class = this.constructor = arguments.callee;
				this[initFunctionName].apply(this, arguments);
			}
		};
		
		klass._class        = true;
		klass._superClass   = this;
		klass._initName     = initFunctionName;
		klass.extend        = this.extend;
		klass.prototype     = new this(NO_OP);
		klass.constructor   = klass;
		
    for (var k in this) {
      (k[0] == '$') && (klass[k] = this[k]);
    }

	  for (var k in features || {}) {
		  klass['$' + k] && klass['$' + k].call(klass, features[k]);
		}

		return klass;
  };
	
	Class.$mixin = function(mixins) {
	  if (!(mixins instanceof Array)) mixins = [mixins];
	  for (var i = 0; i < mixins.length; i++) {
	    this.$methods(mixins[i]);
		}
	};
	
	Class.$methods = function(methodsHash) {
	  for (var k in methodsHash) {
			Object.defineProperty(this.prototype, k, Object.getOwnPropertyDescriptor(methodsHash, k));
		}
	};

	context.Class = Class;
	
})(this);
