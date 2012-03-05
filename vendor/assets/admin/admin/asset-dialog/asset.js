(function($, exports) {
  
  var EXTENSION_MAP = {
    com                 : "application",
    exe                 : "application",
    bat                 : "application",
    sh                  : "application_terminal",
    h                   : "blue_document_code",
    c                   : "blue_document_code",
    cpp                 : "blue_document_code",
    cs                  : "blue_document_code",
    php                 : "blue_document_php",
    rb                  : "blue_document_code",
    rhtml               : "blue_document_code",
    cfm                 : "blue_document_code",
    as                  : "blue_document_code",
    html                : "blue_document_code",
    xml                 : "blue_document_code",
    java                : "blue_document_code",
    sql                 : "blue_document_code",
    jpg                 : "image",
    jpeg                : "image",
    gif                 : "image",
    png                 : "image",
    bmp                 : "blue_document_image",
    psd                 : "blue_document_photoshop",
    tif                 : "blue_document_image",
    tiff                : "blue_document_image",
    ai                  : "blue_document_illustrator",
    ppt                 : "blue_document_powerpoint",
    pdf                 : "blue_document_pdf_text",
    xls                 : "blue_document_excel_table",
    doc                 : "blue_document_word_text",
    mdb                 : "blue_document_access",
    fla                 : "blue_document_flash",
    swf                 : "blue_document_flash_movie",
    txt                 : "blue_document_text",
    pst                 : "blue_document_outlook",
    zip                 : "blue_document_zipper",
    gz                  : "blue_document_zipper",
    bz2                 : "blue_document_zipper",
    tar                 : "blue_document_zipper",
    iso                 : "disc",
    url                 : "blue_document_globe",
    webloc              : "blue_document_globe",
    wav                 : "blue_document_music",
    aiff                : "blue_document_music",
    aif                 : "blue_document_music",
    mp3                 : "blue_document_music",
    ogg                 : "blue_document_music",
    pls                 : "blue_document_music_playlist",
    wmv                 : "blue_document_film",
    mpg                 : "blue_document_film",
    mpeg                : "blue_document_film",
    avi                 : "blue_document_film",
    mov                 : "blue_document_film",
    bin                 : "blue_document_binary"
  };
  
  var commonMethods = {
    isFile              : function() { return false; },
    isFolder            : function() { return false; },
                        
    getID               : function() { return this._id; },
    getUID              : function() { return (this.isFile() ? 'edge-file-' : 'edge-folder-') + this.getID() },
                        
    getParentID         : function() { return this._parentID; },
    getName             : function() { return this._name; },
                        
    getURL              : function() { return this._delegate.getUrlForEntry(this); },
    getPreviewImageURL  : function(size) { return this._delegate.getPreviewImageUrlForEntry(this, size); },
                        
    getTypeIcon         : function() {
      if (this.isFolder()) {
        if (this.getID()) {
          if (this.getName() == '..') {
            return this._delegate.getIconURL('arrow_090');
          } else {
            return this._delegate.getIconURL('folder');
          }
        } else {
          return this._delegate.getIconURL('drive_network');
        }
      } else {
        return this._delegate.getIconURL(EXTENSION_MAP[this.getExtension().toLowerCase()] || 'page_white');
      }
    },
    
    getFormattedSize    : function() { return ''; },
    
    equals              : function(that) {
      if (!that || 'function' != typeof(that.getUID)) return false;
      return this.getUID() == that.getUID();
    },
                        
    _extract            : function(obj) { for (var k in obj || {}) this[k] = obj[k]; }
  };
  
  function AssetFolder(delegate, opts) { this._delegate = delegate; this._extract(opts); };
  $.extend(AssetFolder.prototype, commonMethods, {
    isFolder            : function() { return true; }
  });
  
  function AssetFile(delegate, opts) { this._delegate = delegate; this._extract(opts) };
  $.extend(AssetFile.prototype, commonMethods, {
    isFile              : function() { return true; },
                        
    getFilename         : function() { return this._fileName; },
    getContentType      : function() { return this._contentType || 'application/octet-stream'; },
    getSize             : function() { return this._size; },
    
    hasThumb            : function() { return !! this._thumbFileName; },
    getThumbFilename    : function() { return this._thumbFileName; },
    getThumbContentType : function() { return this._thumbContentType; },
    getThumbSize        : function() { return this._thumbSize; },
    
    getDescription      : function() { return this._description; },
    getAltText          : function() { return this._altText; },
    getWidth            : function() { return this._width; },
    getHeight           : function() { return this._height; },
                        
    getExtension        : function() {
      var fn = this.getFilename() || '', p = fn.lastIndexOf('.');
      return p >= 0 ? (fn.substr(p + 1)) : '';
    },
    
    isWebSafeImage      : function() {
      return !! this.getContentType().match(/^image\/(gif|png|p?jpe?g)$/);
    },
    
    getFormattedSize    : function() {
      var sz = this.getSize(), suffixes = ['B', 'KB', 'MB', 'GB'];
      if (sz === null || sz < 0) return '-';
      while (sz >= 1024 && suffixes.length >= 1) {
        sz /= 1024; suffixes.shift();
      }
      return (Math.round(sz * 10) / 10) + suffixes[0];
    }
  });
  
  exports.AssetFolder = AssetFolder;
  exports.AssetFile   = AssetFile;
  
})(jQuery, this);
