(function($, exports) {
  
  var URLS = {
    list                : '/admin/file_manager/list',
    get_file            : '/admin/file_manager/show_file/{id}',
    create_folder       : '/admin/file_manager/create_folder',
    create_file         : '/admin/file_manager/create_file',
    'delete'            : '/admin/file_manager/delete',
    file                : '/files/show/{id}',
    file_preview        : '/files/thumb/{id}/{profile}',
    folder_list         : '/admin/file_manager/folder_list',
    icon                : '/assets/ico_fugue_{icon}.png',
    move                : '/admin/file_manager/move',
    update_folder       : '/admin/file_manager/update_folder/{id}',
    update_file         : '/admin/file_manager/update_file/{id}'
  };
  
  function url_for(key, params) {
    return URLS[key].replace(/\{([\w-]+)\}/g, function(m) {
      return params[m.substr(1, m.length - 2)] || '';
    });
  };
  
  function icon_url(icon) {
    return url_for('icon', {icon: icon});
  };
  
  function appendSession(url) {
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return url + sep + EDGE_SESSION_KEY + '=' + EDGE_SESSION_ID;
  };
  
  //
  //
  
  function EdgeDelegate() {};
  $.extend(EdgeDelegate.prototype, {
    
    //
    //
    
    getDelegateID: function() {
      return "edge";
    },
    
    //
    // Public interface
    
    openFile: function(id, callback) {
      var self = this;
      $.ajax({
        type        : 'GET',
        url         : url_for('get_file', {id: id}),
        success     : function(json) { callback(self.jsonToEntry(json), false); },
        error       : function() { callback(null, true); } // TODO: more comprehensive error object
      });
    },
    
    doQuery: function(query, then) {
      var self = this;
  		$.ajax(
  			$.extend(this._ajaxOptionsForQuery(query), {
  				type      : 'GET',
  				dataType  : 'json',
  				success   : function(json) { then(self._jsonToEntries(json)); }
  			})
  		);
    },
    
    doCreateFolder: function(parentId, folderName, success, failure) {
  		$.ajax({
  			type        : 'POST',
  			url         : url_for('create_folder'),
  			data        : ('file_folder[parent_id]=' + (parentId || '') + '&file_folder[name]=' + folderName),
  			success     : success,
  			error       : failure
  		});
  	},
  	
  	doUpdate: function(assetId, attributes, success, failure) {
  	  var data = [];
  	  ('name'         in attributes) && data.push('uploaded_file[name]='            + escape(attributes.name));
  	  ('filename'     in attributes) && data.push('uploaded_file[file_file_name]='  + escape(attributes.filename));
  	  ('altText'      in attributes) && data.push('uploaded_file[alt_text]='        + escape(attributes.altText));
  	  ('description'  in attributes) && data.push('uploaded_file[description]='     + escape(attributes.description));
  	  
  		$.ajax({
  			type        : 'POST',
  			url         : url_for('update_file', {id: assetId}),
  			data        : data.join('&'),
  			success     : success,
  			error       : failure
  		});
  	},

  	doDelete: function(items, then) {
  		var ids = [];
  		
  		for (var i = 0; i < items.length; i++) {
  		  var item = items[i];
  		  ids.push((item.isFolder() ? 'file_folder_ids' : 'uploaded_file_ids') + '[]=' + item.getID());
  		}

  		$.ajax({
  			type        : 'POST',
  			url         : url_for('delete'),
  			data        : ids.join('&'),
  			success     : then
  		});
  	},
  	
    doGetFolders: function(then) {
      var self = this;
      $.ajax({
        type        : 'GET',
        dataType    : 'json',
        url         : url_for('folder_list'),
        success     : function(json) { then(self._jsonFoldersToEntries(json)); }
     });
    },
    
    doMove: function(items, toFolderId, then) {
     var ids = ['target_folder_id=' + toFolderId];
    
     $.each(items, function() {
       if (this.isFolder()) {
         ids.push('file_folder_ids[]=' + this.getID());
       } else {
         ids.push('uploaded_file_ids[]=' + this.getID());
       }
     });
    
     $.ajax({
       type         : 'POST',
       dataType     : 'json',
       url          : url_for('move'),
       data         : ids.join('&'),
       success      : then
     });
    },
  	
  	//
  	// Public URLs
  	
  	getCreateFileURL: function(parentID) {
  	  return appendSession(url_for('create_file'));
  	},
  	
  	getUpdateFileURL: function(assetID) {
  	  return appendSession(url_for('update_file', {id: assetID}));
  	},
  	
  	getFileDataField: function() {
  	  return 'uploaded_file[file]';
  	},
  	
  	getThumbnailDataField: function() {
  	  return 'uploaded_file[thumbnail]';
  	},
  	
  	getCreateFileParams: function(parentID) {
  	  return {
	      'uploaded_file[folder_id]'  : ('' + (parentID || ''))
	    }
  	},
    
    getIconURL: function(icon) {
      return icon_url(icon);
    },
    
    getSWFUploadSWFURL: function() {
  	  return '/assets/admin/swfupload/swfupload.swf';
  	},
    
    // returns the URL at which the original version of this file can be retrieved
    getUrlForEntry: function(entry) {
  	  if (entry.isFolder()) {
  	    throw "can't get URL for folder";
  	  } else {
  	    return url_for('file', {id: entry.getID()});
  	  }
  	},
  	
  	// returns the URL at which a small preview version of this file can be found
  	// this is what most people would call a "thumbnail", but we use that term to
  	// mean something else (albeit related), so best to stick with "preview"
  	// returns null if no preview URL is available
  	getPreviewImageUrlForEntry: function(entry, size) {
  	  size = size || 'large';
  	  var profiles = {small: 'system-icon', large: 'system-thumb'};
  	  if (entry.hasThumb() || (entry.isFile() && entry.isWebSafeImage())) {
  	    return url_for('file_preview', {id: entry.getID(), profile: profiles[size]});
  	  } else {
  	    return null;
  	  }
  	},

  	//
  	//
  	
  	isValidFolderName: function(folderName) {
  		return folderName.length > 0 && folderName.match(/^[^\/]+$/);
  	},

    //
  	// Private
  	
  	_ajaxOptionsForQuery: function(query) {
  		return {
  			url: url_for('list'),
  			data: {
  				parent_id: (query.parentId || '')
  			}
  		};
  	},
  	
  	// Process the raw JSON from the server and turn it into an AssetDialog.Entry
  	jsonToEntry: function(data) {
      // TODO: timestamps
      
      if (data.file_folder) {
        var raw = data.file_folder;
        return new AssetFolder(this, {
          _id               : raw.id,
          _name             : raw.name,
          _parentID         : raw.parent_id
        });
      } else {
        var raw = data.uploaded_file;
        return new AssetFile(this, {
          _id               : raw.id,
          _name             : raw.name,
          _parentID         : raw.folder_id,
          _description      : raw.description,
          _altText          : raw.alt_text,
          _width            : raw.width,
          _height           : raw.height,
          _fileName         : raw.file_file_name,
          _contentType      : raw.file_content_type,
          _size             : raw.file_file_size,
          _thumbFileName    : raw.thumbnail_file_name,
          _thumbContentType : raw.thumbnail_content_type,
          _thumbSize        : raw.thumbnail_file_size
        });
      }
    },
  	
  	_jsonToEntries: function(json) {
  	  var self    = this,
  	      entries = $.map(json.entries, function(ele) { return self.jsonToEntry(ele); }),
  	      path    = [];
  	      
  	  if ('parent_id' in json) {
  	    entries.unshift(new AssetFolder(self, {
  	      _id     : json.parent_id || null,
  	      _name   : '..'
  	    }));
  	  }
  	  
  	  if ('path' in json) {
  	    path = $.map(json.path, function(ele) {
          ele = ele.file_folder;
  	      return new AssetFolder(self, {
  	        _id       : ele.id,
  	        _name     : ele.name,
  	        _parentID : ele.parent_id
  	      });
  	    });
  	  }
  	  
  	  return {
  	    entries : entries,
  	    path    : path
  	  };
  	},

  	_jsonFoldersToEntries: function(json) {
  	  var self = this, out = [];
  	  $.each(json, function() {
  	    out.push([this[0], self.jsonToEntry(this[1])]);
  	  });
  	  return out;
  	}
  });
  
  if (!exports.edge) exports.edge = {};
  if (!exports.edge.admin) exports.edge.admin = {};
  
  exports.edge.admin.EdgeDelegate = EdgeDelegate;
  
})(jQuery, this);
