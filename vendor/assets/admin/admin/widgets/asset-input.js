AssetInput = Widget.Input.extend({
  methods: {
    setup: function() {
      this.$input     = $('input', this.root);
      this.$icon      = $('._icon', this.root);
      this.$caption   = $('._caption', this.root);
      this.emptyText  = this.$caption.text();
      
      var existing    = $(this.root).data('asset'),
          self        = this;
      
      if (existing) {
        this.setValue(AssetDialog.DELEGATE.jsonToEntry(existing));
      } else {
        this._removeAsset();
      }
      
      $('a[rel=change]', this.root).click(function() {
        AssetDialog.select(function(asset) { self.setValue(asset); });
      });
      
      $('a[rel=remove]', this.root).click(function() {
        self._removeAsset();
      });
    },
    
    getName: function() {
      return this.$input.attr('name');
    },
    
    getValue: function() {
      return this._asset;
    },
    
    setValue: function(asset) {
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
      return AssetDialog.serialize(this.getValue());
    },
    
    unserializeValue: function(v) {
      var self          = this,
          setByCallback = false,
          assetID       = null;
      
      assetID = AssetDialog.unserialize(v, function(asset, error) {
        if (!error) {
          setByCallback = true;
          self.setValue(asset);
        }
      });
      
      if (!setByCallback) {
        this.$input.val(assetID ? assetID : '');
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
