DateInput = Widget.Input.extend({
  methods: {
    setup: function() {
      var self = this;
      
      this.$input   = $('input[type=hidden]', this.root);
      this.$display = $('input[type=text]', this.root);
      this.$display.attr('readonly', true);
      
      var currentDate = this.$input.val();
      if (currentDate) {
        this._date = Date.parseISO8601(currentDate);
      } else {
        this._date = null;
      }
      
      this.$display.DatePicker({
        date          : this._date || new Date(),
        eventName     : 'click',
        flat          : false,
        format        : 'Y-m-d',
        start         : 1,
        mode          : 'single',
        calendars     : 1,
        position      : 'bottom',
        onChange      : function(date) {
          // TODO: need to make this work only when final selection has been made
          //self.$display.DatePickerHide();
          self._date = Date.parseISO8601(date);
          self._sync();
        }
      });
      
      $('a[rel=remove]', this.root).click(function() {
        self.setValue(null);
      })
      
      this._sync();
    },
    
    getName: function() {
      return this.$input.attr('name');
    },
    
    getValue: function() {
      return this._date;
    },
    
    setValue: function(date) {
      this._date = date ? date : null;
      this._sync();
    },
    
    serializeValue: function() {
      if (this._date) {
        return this._date.strftime("%Y-%m-%d");
      } else {
        return null;
      }
    },
    
    unserializeValue: function(v) {
      
    },
    
    _sync: function() {
      if (this._date) {
        this.$input.val(this._date.strftime("%Y-%m-%d"));
        this.$display.val(this._date.strftime("%d/%m/%Y")); // TODO: source this from config
        this.$display.DatePickerSetDate(this._date, true);
      } else {
        this.$input.val('');
        this.$display.val('');
        this.$display.DatePickerSetDate(new Date(), true);
      }
    }
  }
});
