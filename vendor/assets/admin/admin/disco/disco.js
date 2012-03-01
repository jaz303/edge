(function(exports, $) {
  
  var DISCO_TEMPLATE_KEY            = 'disco-template',
      DISCO_TEMPLATE_TYPE_KEY       = 'data-disco-template-type',
      DISCO_FIELD_TYPE_KEY          = 'data-disco-field-type',
      DISCO_DATA_OBJECT_KEY         = 'disco-data-object',
      DISCO_EMPTY_CHILDREN_KEY      = 'data-disco-empty',
      DISCO_ACCEPTED_CHILDREN_KEY   = 'data-disco-children-accept',
      DISCO_CONTAINER_KEY           = 'data-disco-container',
      DISCO_WRAPPER_KEY             = 'data-disco-wrapper',
      
      DISCO_ACTION_ADD_CHILD        = 'disco-add-child',
      DISCO_ACTION_DELETE_CHILD     = 'disco-delete-child';
  
  function log() {
    console.log.apply(console, arguments);
  }
  
  function isNodeInDOM(ele) {
    while (ele.parentNode) ele = ele.parentNode;
    return !! ele.body;
  }
  
  function getFieldName(ele) {
    var name = ele.getAttribute('name') || ele.getAttribute('data-disco-field-name');
    if (!name) throw "couldn't get name for element";
    return name;
  }
  
  function getDataType(typeName) {
    var dataType = dataTypes[typeName];
    if (!dataType) throw "unknown field type " + typeName;
    return dataType;
  }
  
  function getDataTypeForElement(ele) {
    return getDataType(ele.getAttribute(DISCO_FIELD_TYPE_KEY));
  }
  
  function getDataObject(ele) {
    return $(ele).data(DISCO_DATA_OBJECT_KEY);
  }
  
  function getTemplate(ele) {
    return $(ele).data(DISCO_TEMPLATE_KEY);
  }
  
  function isTemplate(ele) {
    return !! getTemplate(ele);
  }
  
  // walk node tree, without straying into subtree owned by another
  // template. callback can return `false` to prevent its own children
  // from being explore
  function walkChildNodes(root, fn) {
    var stack = [root];
    while (stack.length) {
      var curr = stack.pop();
      if (curr.nodeType != 1) continue;
      if (fn.call(null, curr) !== false) {
        for (i = 0; i < curr.childNodes.length; i++) {
          if (!isTemplate(curr.childNodes[i])) {
            stack.push(curr.childNodes[i]);
          }
        }
      }
    }
  }
  
  function walkChildTemplates(root, fn) {
    var stack = [root];
    while (stack.length) {
      var curr = stack.pop();
      if (curr.nodeType != 1) continue;
      for (i = 0; i < curr.childNodes.length; i++) {
        var child = curr.childNodes[i];
        if (isTemplate(child)) {
          fn.call(null, getTemplate(child));
        } else {
          stack.push(child);
        }
      }
    }
  }
  
  //
  // Data types
  
  var dataTypes = {
    
    //
    // Value - works with standard HTML inputs
    
    value: function(tpl, ele) {
      return {
        get: function() { return $(ele).val(); },
        set: function(val) { $(ele).val(val); }
      }
    },
    
    //
    // Asset - integrates with file manager
    
    asset: function(tpl, ele) {
      var input     = $('input[type=hidden]', ele),
          actuator  = $('a', ele);
      
      actuator.click(function() {
        AssetDialog.select(function(asset) {
          $(ele).text(asset.fileName + ' (click to change)');
        });
        return false;
      });
      
      return {
        get: function() {
          var assetId = input.val() || null;
          return assetId ? {_type: 'asset', id: assetId} : null;
        },
        set: function(val) {
          if ('object' == typeof val) {
            input.val(val.id);
          } else if (val) {
            input.val(val);
          } else {
            input.val('');
          }
        }
      }
    },
    
    //
    // Include - inserts another template in-place
    
    include: function(tpl, ele) {
      var context       = tpl.getContext(),
          templateClass = context.getTemplate(ele.getAttribute('data-disco-include-template-type')),
          template      = new templateClass(context);
      
      template.appendTo(ele);
      
      return {
        get: function() {
          return template.serialize();
        },
        set: function(val) {
          template.unserialize(val);
        }
      };
    },
    
    //
    // Children - manages an array of child templates (of potentially different types)
    
    children: function(tpl, ele) {
      var container = $('[' + DISCO_CONTAINER_KEY + ']', ele),
          whenEmpty = $('[' + DISCO_EMPTY_CHILDREN_KEY + ']', ele).remove(),
          wrapper   = $('[' + DISCO_WRAPPER_KEY + ']', ele).remove(),
          $ele      = $(ele);
          
      var allowedTypes = $(ele).attr(DISCO_ACCEPTED_CHILDREN_KEY) || null;
      if (allowedTypes) allowedTypes = allowedTypes.split(',');
      
      if (!container.length) {
        container = $ele;
      }
      
      container.html(whenEmpty.length ? whenEmpty : '');
      
      $ele.on('click', 'a[rel=' + DISCO_ACTION_ADD_CHILD + ']', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        
        var context   = tpl.getContext();
            
        function doAddChild(klass) {
          var template = new klass(context);
          whenEmpty.remove();
          var target = container;
          if (wrapper.length) {
            target = wrapper.clone();
            target.data('disco-child-guard', template);
            target.appendTo(container);
          } else {
            template.getRoot().data('disco-child-guard', template);
          }
          template.appendTo(target);
        }
        
        if (allowedTypes.length == 1) {
          doAddChild(context.getTemplate(allowedTypes[0]));
        } else {
          var choices = [];
          
          for (var i = 0; i < allowedTypes.length; i++) {
            var klass = context.getTemplate(allowedTypes[i]);
            choices.push([klass.getTitle(), klass.getType()]);
          }
          
          Boxy.select('Select the type of object to add:', choices, {
            confirm: function(type) {
              doAddChild(context.getTemplate(type));
            }
          });
        }
      });
      
      $ele.on('click', 'a[rel=' + DISCO_ACTION_DELETE_CHILD + ']', function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        
        var ele = evt.target;
        do {
          var childGuard = $.data(ele, 'disco-child-guard');
          if (childGuard) {
            childGuard.remove();
            $.data(ele, 'disco-child-guard', null);
            if (ele.parentNode) {
              ele.parentNode.removeChild(ele);
            }
            if ($('> *', container).length == 0) {
              whenEmpty.appendTo(container);
            }
            break;
          } else {
            ele = ele.parentNode;
          }
        } while (ele);
      });
      
      return {
        get: function() {
          var children = [];
          walkChildTemplates(ele, function(tpl) {
            children.push(tpl.serialize());
          });
          return children;
        },
        
        set: function(val) {
          for (var i = 0; i < val.length; i++) {
            
          }
        }
      };
    },
    
    //
    // Manages an array of checkboxes

    checkboxes: function(tpl, ele) {
      return {
        get: function() {
          var out = {};
          $('input[type=checkbox]', ele).each(function() {
            out[this.getAttribute('value')] = !!this.checked;
          });
          return out;
        },
        
        set: function(val) {
          var inputs = {};
          $('input[type=checkbox]', ele).each(function() {
            inputs[this.getAttribute('value')] = this;
          });
          for (var k in val) {
            inputs[k].checked = val;
          }
        }
      }
    }
  };
  
  //
  // Context
  
  function Context() {
    this._templates = {};
  };
  
  Context.prototype = {
    addTemplates: function(templates) {
      var self = this;
      $(templates).each(function() {
        var type    = this.getAttribute(DISCO_TEMPLATE_TYPE_KEY),
            root    = null,
            scripts = [];
        
        for (var i = 0; i < this.childNodes.length; i++) {
          var node = this.childNodes[i];
          if (node.nodeType == 1) {
            if (node.nodeName.toLowerCase() == 'script') {
              scripts.push(node);
            } else {
              root = node;
              root.id = null;
            }
          }
        }
        
        if (!root || !type) {
          log("error - template must have root HTML and type");
          return;
        }
        
        var methods = {};
        var templateClass = Template.extend({methods: methods});
        
        templateClass.getTitle = function() { return this.getType() + ' object'; };
        templateClass.getType = function() { return type; };
        templateClass.getTemplate = function() { return root; };
        
        self.registerTemplate(templateClass);
        
      });
    },
    
    registerTemplate: function(templateClass) {
      this._templates[templateClass.getType()] = templateClass;
    },
    
    getTemplate: function(templateTypeName) {
      if (!(templateTypeName in this._templates)) {
        throw "unknown template: " + templateTypeName;
      }
      return this._templates[templateTypeName];
    }
  };
  
  //
  // Template
  
  var Template = Class.extend({
    methods: {
      init: function(context) {
        this._context = context;
      },
      
      getContext: function() {
        return this._context;
      },
      
      // returns name of template type
      getType: function() {
        return this._class.getType();
      },
      
      // Returns jQuery object wrapping root element
      getRoot: function() {
        if (!this._root) this._create();
        return this._root;
      },
      
      serialize: function() {
        var serialized = this._serialize() || {};
        serialized._type = this.getType();
        return serialized;
      },
      
      unserialize: function(data) {
        this._unserialize(data);
      },
      
      isAttached: function() {
        if (!this._rootElement) return false;
        return isNodeInDOM(this._rootElement);
      },
      
      remove: function() {
        if (this.isAttached()) {
          this._broadcastDown('_willDetach');
          this._rootElement.parentNode.removeChild(this._rootElement);
          this._broadcastDown('_didDetach');
        }
      },
      
      appendTo: function(target) {
        var target      = target.nodeType ? target : target[0],
            root        = this.getRoot(), // force root to be created
            targetInDOM = isNodeInDOM(target);
            
        this.remove();
        
        if (targetInDOM) this._broadcastDown('_willAttach');
        root.appendTo(target);
        if (targetInDOM) this._broadcastDown('_didAttach');
      },
      
      // call a named method on this and all descendant templates
      // additional args are passed on too.
      _broadcastDown: function(method) {
        var args = Array.prototype.slice.call(arguments, 1),
            tpls = [this];
            
        while (tpls.length) {
          var tpl = tpls.shift();
          tpl[method].apply(tpl, args);
          tpl._walkChildTemplates(function(t) { tpls.push(t); });
        }
      },
      
      _serialize: function() {
        var out = {};
        this._walkValueNodes({
          onField: function(ele, fieldType) {
            out[getFieldName(ele)] = getDataObject(ele).get();
          },
          onWidget: function(ele, widget) {
            out[widget.getName()] = widget.serializeValue();
          }
        });
        return out;
      },
      
      _unserialize: function(data) {
        this._walkValueNodes({
          onField: function(ele, fieldType) {
            getDataObject(ele).set(data[getFieldName(ele)]);
          },
          onWidget: function(ele, widget) {
            widget.unserializeValue(data[widget.getName()]);
          }
        });
      },
      
      _create: function() {
        var self = this;
        
        this._root        = this._createHTML();
        this._rootElement = this._root[0];
        
        walkChildNodes(this._rootElement, function(ele) {
          var widgetClass = Widget.nameForClass(ele.className),
              fieldType   = ele.getAttribute(DISCO_FIELD_TYPE_KEY);
          
          if (widgetClass) {
            var widget = Widget.initializeOne(ele);
            if (widget.isInput()) {
              return false;
            }
          } else if (fieldType) {
            $(ele).data(DISCO_DATA_OBJECT_KEY, getDataType(fieldType).call(null, self, ele));
            return false;
          }
        });
      },
      
      _createHTML: function() {
        var clone = $(this._class.getTemplate()).clone();
        clone.data(DISCO_TEMPLATE_KEY, this);
        return clone;
      },
      
      _willAttach: function() {},
      _didAttach: function() {},
      _willDetach: function() {},
      _didDetach: function() {},
      
      // walks children of template's root node, invoking callback for each child.
      // does not stray into elements owned by a sub-template.
      _walkChildNodes: function(callback) {
        walkChildNodes(this._rootElement, callback);
      },
      
      _walkChildTemplates: function(callback) {
        walkChildTemplates(this._rootElement, callback);
      },
      
      // walk all child nodes representing data containers.
      // data containers are either disco built-in types, or Widget instances.
      _walkValueNodes: function(options) {
        var onField   = options.onField || function() {},
            onWidget  = options.onWidget || function() {};
        
        this._walkChildNodes(function(ele) {
          if (Widget.elementIsInputWidget(ele)) {
            onWidget(ele, Widget.widgetForElement(ele));
          } else {
            var val = ele.getAttribute(DISCO_FIELD_TYPE_KEY);
            if (val) {
              onField(ele, val);
            }
          }
        });
      }
    }
  });
  
  //
  // Editor
  
  function Editor(context) {
    this._context         = context;
    this._documentWrapper = null;
    this._rootTemplate    = null;
  };
  
  Editor.prototype = {
    appendTo: function(target) {
      this._getHTML().appendTo(target);
    },
    
    clear: function() {
      if (this._rootTemplate) {
        this._rootTemplate.remove();
        this._rootTemplate = null;
      }
    },
    
    newDocument: function(rootType) {
      this.clear();
      var templateClass = this._context.getTemplate(rootType);
      this._rootTemplate = new templateClass(this._context);
      this._rootTemplate.appendTo(this._getHTML());
    },
    
    openDocument: function(serializedData) {
      this.newDocument(serializedData._type);
      this._rootTemplate.unserialize(serializedData);
    },
    
    serializeDocument: function() {
      return this._rootTemplate ? this._rootTemplate.serialize() : null;
    },
    
    _getHTML: function() {
      if (!this._documentWrapper) {
        var dw = $('<div class="disco-editor" />');
        this._documentWrapper = dw;
      }
      return this._documentWrapper;
    }
  };
  
  //
  // Pluck templates from DOM
  
  var pluckedTemplates = [];
  
  function pluckTemplates(context) {
    context = context || document.body;
    pluckedTemplates = $('.disco-template').remove();
  };
  
  function createDefaultContext() {
    var discoContext = new Context();
    for (var i = 0; i < pluckedTemplates.length; i++) {
      discoContext.addTemplates(pluckedTemplates[i]);
    }
    return discoContext;
  };
  
  //
  //
  
  exports.disco = {
    Context               : Context,
    Editor                : Editor,
    pluckTemplates        : pluckTemplates,
    createDefaultContext  : createDefaultContext
  };
  
})(this, jQuery);