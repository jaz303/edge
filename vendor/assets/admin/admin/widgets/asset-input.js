AssetInput = Widget.extend({
  methods: {
    setup: function() {
      var $input    = $('input', this.root),
          $icon     = $('._icon', this.root),
          $caption  = $('._caption', this.root),
          existing  = $(this.root).data('asset');
          
      function removeAsset() {
        $input.val('');
        $icon.css('backgroundImage', 'none');
        $caption.text('(no file selected)');
      }
          
      function setAsset(asset) {
        if (!asset) {
          removeAsset();
        } else {
          $input.val(asset.getID());
          $icon.css('backgroundImage', 'url(' + asset.getPreviewImageURL('small') + ')');
          $caption.text(asset.getName());
        }
      }
      
      if (existing) {
        setAsset(AssetDialog.DELEGATE.jsonToEntry(existing));
      } else {
        removeAsset();
      }
      
      $('a[rel=change]', this.root).click(function() {
        AssetDialog.select(setAsset);
      });
      
      $('a[rel=remove]', this.root).click(function() {
        removeAsset();
      });
    }
  }
});
