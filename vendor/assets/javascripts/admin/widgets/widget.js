Widget = Class.extend({
  methods: {
    init: function(root) {
      this.root = root;
      this.$root = $(root);
      this.config = $.extend({}, this.defaults(), this._extractConfig());
      this.$root.data('widget', this);
      this.setup();
    },
    
    destroy: function() {
      try {
        this.dispose();
      } catch (_ignore) {}
      this.$root.data('widget', false);
      this.root = this.$root = null;
    },
    
    /**
	   * Override to provide default configuration options.
	   * Any of these may be overwritten by configuration options passed to
	   * the constructor.
	   */
    defaults: function() {
      return {};
    },
    
    /**
     * Implement custom Widget setup/initialisation logic here.
     */
    setup: function() {},
    
    /**
     * Implement custom destruction logic here.
     */
    dispose: function() {},
    
    _extractConfig: function() {
      return Widget.getConfig(this.root);
    }
  }
});

/**
 * Returns the widget wrapping a given element.
 * That is, the first parent (or self) that has the class 'widget'.
 * (or, more accurately, that has a data key 'widget')
 */
Widget.get = function(ele) {
    var w = null;
    while (ele) {
        if (w = $.data(ele, 'widget')) break;
        ele = ele.parentNode;
    }
    return w;
};

Widget.classForName = function(widgetName) {
    return "widget-" + widgetName.replace(/\./g, '-');
};

Widget.nameForClass = function(className) {
    var match = /(^|\s)widget-([\w-]+)($|\s)/.exec(className);
    if (match) {
        return match[2].replace(/[-_]+/g, '.');
    } else {
        return null;
    }
};

/**
 * Given a root DOM node, returns an array of root widget nodes.
 * Array elements will be organised such that it is safe to instantiate widgets
 * in this order.
 */
Widget.findAllRoots = function(root) {
    var q = [root], w = [], n = null;
    while (n = q.pop()) {
        if (n.className && n.className.match(/(?:\s|^)widget(?:\s|$)/)) {
            w.unshift(n);
        }
        for (var i = 0; i < n.childNodes.length; i++) {
            var c = n.childNodes[i];
            if (c.nodeType == 1) q.push(n.childNodes[i]);
        }
    }
    return w;
};

/**
 * Initialize all widgets in a given container.
 * Call this from document.ready or whenever elements potentially containing
 * widgets are inserted into the DOM.
 */
Widget.initializeAll = function(container) {
    var roots = Widget.findAllRoots(container);
    for (var i = 0; i < roots.length; i++) {
        Widget.initializeOne(roots[i]);
    }
};

Widget.destroyAll = function() {
    var roots = Widget.findAllRoots(document.body), w = null;
    for (var i = 0; i < roots.length; i++) {
        if (w = Widget.get(roots[i])) {
            w.destroy();
        }
    }
};

Widget.getConfig = function(ele) {
  var config = {};
  $('> script[type="text/javascript-widget-config"]', ele).each(function() {
		$.extend(config, (new Function($(this).text()))());
	});
	return config;
};

/**
 * Initialize a single widget rooted at a given element.
 */
Widget.initializeOne = function(element) {
  var existing = $.data(element, 'widget'), wcn, wc, config = {}, i;
  
  // check for existing or destroyed widget (false => destroyed)
  if (existing || existing === false) return existing;
  
  if (wcn = Widget.nameForClass(element.className)) {
    wcn = wcn.split('.');
    wc = window;
    for (i = 0; i < wcn.length; i++) {
        if (!(wc = wc[wcn[i]])) return null;
    }
	  return new wc(element);
  } else {
    return null;
  }
};

if (typeof jQuery != 'undefined') {
  $.fn.widget = function() {
    return Widget.get(this[0]);
  };
}
