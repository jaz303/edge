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
  
  function walkChildNodes(root, fn) {
    var stack = [root];
    while (stack.length) {
      var curr = stack.pop();
      if (curr.nodeType != 1) continue;
      fn.call(null, curr);
      for (i = 0; i < curr.childNodes.length; i++) {
        if (!isTemplate(curr.childNodes[i])) {
          stack.push(curr.childNodes[i]);
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
    value: function(tpl, ele) {
      return {
        get: function() { return $(ele).val(); },
        set: function(val) { $(ele).val(val); }
      }
    },
    
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
        
        var context   = tpl.getContext(),
            choices   = [];
            
        for (var i = 0; i < allowedTypes.length; i++) {
          var klass = context.getTemplate(allowedTypes[i]);
          choices.push([klass.getTitle(), klass.getType()]);
        }
        
        Boxy.select('Select the type of object to add:', choices, {
          confirm: function(type) {
            var klass     = context.getTemplate(type),
                template  = new klass(context);
            
            whenEmpty.remove();

            var target = container;
            if (wrapper.length) {
              target = wrapper.clone();
              target.appendTo(container);
            }

            template.appendTo(target);
          }
        });
        
        return false;
      
      });
      
      $ele.on('click', 'a[rel=' + DISCO_ACTION_DELETE_CHILD + ']', function(evt) {
        getTemplate(evt.target).remove();
        if (container.childNodes.length == 0) {
          whenEmpty.appendTo(container);
        }
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

    checkboxes: function(tpl, ele) {
      return {
        get: function() {
          var out = {};
          $('input[type=checkbox]', ele).each(function() {
            out[this.getAttribute('name')] = !!this.checked;
          });
          return out;
        },
        
        set: function(val) {
          
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
        this._wasAttached = false;
      },
      
      getContext: function() {
        return this._context;
      },
      
      // returns name of template type
      getType: function() {
        return this._class.getType();
      },
      
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
        var ele = this._rootElement;
        while (ele && ele.nodeName.toLowerCase() != 'body') {
          ele = ele.parentNode;
        }
        return !!ele;
      },
      
      remove: function() {
        if (this.isAttached()) {
          this._broadcastDown('_willDetach');
          this._rootElement.parentNode.removeChild(this._rootElement);
          this._broadcastDown('_didDetach');
        }
      },
      
      appendTo: function(target) {
        var root = this.getRoot(); // force root to be created
        this.remove();
        this._broadcastDown('_willAttach', !!this._wasAttached);
        root.appendTo(target);
        this._broadcastDown('_didAttach', !!this._wasAttached);
        this._wasAttached = true;
      },
      
      _broadcastDown: function(method) {
        this[method].apply(this, Array.prototype.slice.call(arguments, 1));
        this._walkChildTemplates(function(tpl) {
          tpl._broadcastDown.apply(tpl, arguments);
        });
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
        
        this._walkChildNodes(function(ele) {
          var widgetClass = Widget.nameForClass(ele.className),
              fieldType   = ele.getAttribute(DISCO_FIELD_TYPE_KEY);
          if (widgetClass) {
            Widget.initializeOne(ele);
          } else if (fieldType) {
            $(ele).data(DISCO_DATA_OBJECT_KEY, getDataType(fieldType).call(null, self, ele));
          }
        });
      },
      
      _createHTML: function() {
        var clone = $(this._class.getTemplate()).clone();
        clone.data(DISCO_TEMPLATE_KEY, this);
        return clone;
      },
      
      _willAttach: function(firstTime) {},
      _didAttach: function(firstTime) {},
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
  //
  
  exports.disco = {
    Context     : Context,
    Editor      : Editor
  };
  
})(this, jQuery);