/**
 * Simple template-based approach to forms with repeating blocks.
 * It's pretty customisable using callback functions.
 *
 * @todo a nice animation for move up/down
 * @todo drag/drop reordering
 *
 * A repeater instance relies on an HTML structure similar to the following:
 *
 * <div>
 *   <div class='repeater-items'>
 *     <div class='repeater-item'>
 *       <-- contains copy of template row -->
 *       <-- initial rows can either be pre-rendered or supplied as array of JSON data -->
 *     </div>
 *   </div>
 *   <a href='#' rel='repeater-add-item'>Add new item</a>
 *   <div class='repeater-item repeater-template'>
 *     <input type='text' name='items[{index}][name]' />
 *     <input type='text' name='items[{index}][company]' />
 *     <a href='#' rel='repeater-item-move-up'>Up</a>
 *     <a href='#' rel='repeater-item-move-down'>Down</a>
 *     <a href='#' rel='repeater-item-delete'>Delete</a>
 *   </div>
 * </div>
 *
 * CSS required:
 * .repeater-template { display: none; }
 */

Repeater = Widget.extend({
  methods: {
    setup: function() {
      this.$items     = $('> .repeater-items', this.root);
      this.index      = this.$items.find('> .repeater-item').length;
      
      if (this.config.template) {
          this.$template = $(this.config.template);
      } else if (this.config.templateSelector) {
          var context = this.config.templateSelector.match(/^(>|~)/) ? this.root : document;
          this.$template = $(this.config.templateSelector, context);
      }
      
      this.$template.remove().removeClass('repeater-template');
      this.$template[0].id = null;
      
      this.bind();
      
      for (var i = 0; i < this.config.data.length; i++) {
          this.addItem(this.config.data[i], false);
      }
    },
    
    bind: function() {
      var self = this;
      
      this.$items.closest('form').submit(function() {
          self.setPositions();
      });
      
      this.$items.click(function(evt) {
        var $t = $(evt.target), action = $t.attr('rel'), $r = $t.closest('.repeater-item:visible');
        switch (action) {
          case 'repeater-item-delete':
            self.deleteItem($r);
            break;
          case 'repeater-item-move-up':
            $r.insertBefore($r.prevAll('.repeater-item:visible').eq(0));
            break;
          case 'repeater-item-move-down':
            $r.insertAfter($r.nextAll('.repeater-item:visible').eq(0));
            break;
          default:
            return;
        }
        return false;
      });
      
      $('[rel=repeater-add-item]', this.root).click(function() {
          self.addItem({}, true);
          return false;
      });
    },
    
    count: function() {
      return $('.repeater-item:visible', this.$items[0]).length;
    },

    setPositions: function() {
      if (this.config.positionKey) {
        var p = 0, self = this;
        $('.repeater-item:visible', this.root).each(function() {
          $('[name$="[' + self.config.positionKey + ']"]', this).val(p);
          p++;
        });
      }
    },

    addItem: function(data, animate) {

      var opts = this.config;

      if (opts.maxItems !== null && this.count() >= opts.maxItems) {
        opts.alert("The maximum number of items allowed is " + opts.maxItems);
        return;
      }

      var index = this.index++, $row = this.$template.clone();
      $row.find('[name]').each(function() {
        this.name = this.name.replace('{index}', index);
      });

      data = $.extend({}, opts.defaultData, data);

      if (opts.removeBlankID && !data[opts.removeBlankID]) {
        $row.find('input[name$="[' + opts.removeBlankID + ']"]').remove();
      }

      $row.hover(function() {
        $(this).find('.repeater-item-controls').show();
      }, function() {
        $(this).find('.repeater-item-controls').hide();
      });

      opts.substituteAll.call(this, $row, data);
      opts.behaviours.call(this, $row);

      if (animate) {
        $row.css({opacity: 0}).appendTo(this.$items).animate({opacity: 1});
      } else {
        $row.appendTo(this.$items);
      }

    },

    deleteItem: function($row) {
      if (this.config.minItems !== null && this.count() <= this.config.minItems) {
        this.config.alert("The minimum number of items allowed is " + this.config.minItems);
      } else {
        $row.animate({opacity: 0}).slideUp(this.config.deleteHandler);
      }
    },

    substituteAll: function($row, data) {
      for (var k in data) {
        if (k in this.config.substitute) {
          this.config.substitute[k].call(this, $row, data[k]);
        } else {
          $('[name$="[' + k + ']"]', $row[0]).val(data[k]);
        }
      }
    },

    defaults: function() {
      return Repeater.DEFAULTS;
    }
  }
});

Repeater.DEFAULTS = {
  defaultData:        {},
  data:               [],
  minItems:           null,
  maxItems:           null,
  deleteHandler:      function(row) { $(this).remove(); },
  positionKey:        null,
  removeBlankID:      null,
  template:           null,
  templateSelector:   '> .repeater-template',
  substituteAll:      function($row, data) { this.substituteAll($row, data); },
  substitute:         {},
  behaviours:         function($row) { },
  alert:              function(message) { alert(message); }
};

// Globally configure Repeater for use with Rails' nested attributes
Repeater.configureForRails = function() {
  this.DEFAULTS.deleteHandler = function() {
      $(this).find('input[name$="[_destroy]"]').val(1);
      $(this).hide();
  };
  this.DEFAULTS.positionKey = "position";
  this.DEFAULTS.removeBlankID = "id";
};
