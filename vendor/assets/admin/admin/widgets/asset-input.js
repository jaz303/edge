(function(ctx) {
  
  var S_READY         = 1,
      S_UNSERIALIZING = 2;
  
  ctx.AssetInput = Widget.Input.extend({
    methods: {
      setup: function() {
        this.$input         = $('input', this.root);
        this.$icon          = $('._icon', this.root);
        this.$caption       = $('._caption', this.root);
        this.emptyText      = this.$caption.text();
        
        this._state         = S_READY;

        var existing        = $(this.root).data('asset'),
            self            = this;

        if (existing) {
          this.setValue(AssetDialog.DELEGATE.jsonToEntry(existing));
        } else {
          this._removeAsset();
        }

        $('a[rel=change]', this.root).click(function(evt) {
          AssetDialog.select(function(asset) { self.setValue(asset); });
          evt.preventDefault();
          evt.stopPropagation();
        });

        $('a[rel=remove]', this.root).click(function(evt) {
          self._removeAsset();
          evt.preventDefault();
          evt.stopPropagation();
        });
      },

      getName: function() {
        return this.$input.attr('name');
      },

      getValue: function() {
        return this._asset;
      },

      setValue: function(asset) {
        if (this._state == S_UNSERIALIZING) {
          this._state = S_READY;
        }
        
        if (!asset) {
          this._removeAsset();
        } else {
          this.$input.val(asset.getID());
          this.$icon.css('backgroundImage', 'url(' + asset.getPreviewImageURL('small') + ')');
          this.$caption.text(asset.getName());
          this._asset = asset;
        }
      },

      serializeValue: function() {
        if (this._state == S_READY) {
          return AssetDialog.serialize(this.getValue());
        } else if (this._state == S_UNSERIALIZING) {
          return this._unserializationData;
        } else {
          throw "state error";
        }
      },

      unserializeValue: function(v) {
        
        if (this._state == S_UNSERIALIZING) {
          throw "state error - already unserializing";
        } else {
          this._state = S_UNSERIALIZING;
        }
        
        var self      = this,
            assetID   = null;

        this._unserializationData = v;

        assetID = AssetDialog.unserialize(v, function(asset, error) {
          if (!error) {
            self.setValue(asset);
          } else {
            $(self.root).addClass('error');
            self.$caption.text('An error occurred');
          }
          self._state = S_READY;
          sefl._unserializationData = null;
        });
        
        if (this._state == S_UNSERIALIZING) {
          this.$input.val(assetID ? assetID : '');
          this.$caption.text("Loading...");
        }
      
      },

      _removeAsset: function() {
        this.$input.val('');
        this.$icon.css('backgroundImage', 'none');
        this.$caption.text(this.emptyText);
        this._asset = null;
      }
    }
  });
  
})(this);