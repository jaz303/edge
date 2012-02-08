function AssetDialog(html, delegate) {
	
	var self        = this;
	
	this.lockCount  = 0;
	this.loaded     = false;
	this.showOnLoad	= true;
	
	this.root       = null;
	this.view		    = null;
	this.editForm   = null;

	this.query		  = new AssetDialog.Query;
	this.asset		  = null;
	
	this.mode		    = 'browse';
	this.callback	  = null;
	
	this._delegate	= AssetDialog.DELEGATE;
	
	$.get(AssetDialog.ROOT + 'template.htm', function(html) {
    html = html.replace(/\{\{icon=([\w-]+)\}\}/g, function(m) { return self._delegate.getIconURL(RegExp.$1); });
    
    self.root   = self.bind(html);
	  self.boxy   = new Boxy(self.root, {title: 'File Manager', show: self.showOnLoad});
	  self.initSWFUpload();
	  self._refreshMode();
	  self._selectDefaultView();
	  self.loaded = true;
	});
	
};

//
// Helpers

$.extend(AssetDialog, {
	instance: function() {
		if (!AssetDialog.theInstance) {
			AssetDialog.theInstance = new AssetDialog();
		}
		return AssetDialog.theInstance;
	},
	
	toggle: function() {
		AssetDialog.instance().toggle();
		return false;
	},
	
	extend: function(superClass, methods) {
		var subClass = function() {};
		subClass.prototype = new superClass();
		for (var m in methods) {
			subClass.prototype[m] = methods[m];
		}
		return subClass;
	},
	
	select: function(callback) {
		var i = this.instance();
		i.setMode('select', callback);
		i.show();
	}
});

//
// Asset Dialog Core

AssetDialog.prototype = {
    
  //
  // State
    
	getAsset: function() { return this.asset; },
	
	setAsset: function(asset) {
		this.asset = asset;
		var button = this.root.find('.asset-dialog-action-select')
		if (this.asset) {
			button.removeAttr('disabled');
		} else {
			button.attr('disabled', 'disabled');
		}
	},
	
	setMode: function(mode, callback) {
		this.mode = mode;
		this.callback = callback;
		if (this.loaded) {
			this._refreshMode();
		}
	},
	
	setPath: function(path) {
	  var $status = this.root.find('.asset-dialog-status-bar-left');
    
    var $c = $('<div/>');
    
    function appendPathEntry(e) {
     var $entry = $("<div class='asset-dialog-entry'/>")
             .css('backgroundImage', 'url(' + e.getTypeIcon() + ')')
             .append($('<a>').text(e.getName()));
     
     $.data($entry[0], 'asset-dialog-entry', e);
     $c.append($entry);  
    }
    
    var root = new AssetFolder(this._delegate, {_name: 'Asset Archive'});
    
    appendPathEntry(root);
    
    for(var i = 0; i < path.length; i++) {
     var e = path[i];
     appendPathEntry(e);
    }
    
    $status.html('').append($c);
	},
		
	_refreshMode: function() {
		var $select = this.root.find('.asset-dialog-action-select').hide();
		if (this.mode == 'select') {
			$select.css('display', 'inline');
		}
	},
	
	_selectDefaultView: function() {
		this.root.find('.asset-dialog-view-select li:first').click();
	},
	
	//
	//
	
	bind: function(html) {
		
		var self		= this,
			$html		= $(html),
			$toolbar	= $html.find('.asset-dialog-toolbar'),
			$viewSelect = $toolbar.find('.asset-dialog-view-select li'),
			$stack		= $html.find('.asset-dialog-view-stack'),
			$browser	= $stack.find('.asset-dialog-browser'),
			$edit		= $stack.find('.asset-dialog-editor'),
			$contents	= $browser.find('.asset-dialog-browser-contents'),
			$upload		= $stack.find('.asset-dialog-upload'),
			$select		= $html.find('.asset-dialog-action-select');
			
		function hideStack() { $stack.find('> li').hide(); };
		function selectToolbarItem(item) {
			$toolbar.find('li').removeClass('asset-dialog-selected-button');
			$(item).addClass('asset-dialog-selected-button');
		}
		
		function getSelection() {
			out = [];
			$contents.find('input:checked').each(function() {
				out.push($.data($(this).parents('.asset-dialog-entry')[0], 'asset-dialog-entry'));
			});
			return out;
		}
			
		$toolbar.find('a').tipsy();
		
		$viewSelect.click(function() {
			selectToolbarItem(this);
			hideStack();
			$browser.show();
			self.view = new AssetDialog[$(this).find('a').attr('rel')]();
			self.view.setPanel($contents);
			self.refresh();
			return false;
		});
		
		$toolbar.find('.asset-dialog-view-select li:first').click();
		
		$toolbar.find('.asset-dialog-action-upload').click(function() {
			selectToolbarItem(this);
			hideStack();
			$upload.show();
			return false;
		});
		
		$toolbar.find('.asset-dialog-action-create-folder').click(function() {
			var newFolderName;
			do {
				if ((newFolderName = prompt("New folder name:")) === null) return;
				newFolderName = newFolderName.replace(/(^\s+|\s+$)/g, '');
			} while (!self._delegate.isValidFolderName(newFolderName));
			self._delegate.doCreateFolder(self.query.parentId, newFolderName, function() {
			  self.refresh();
			}, function() {
			  self._alert('Error', 'An error occurred while attempting to create the new folder');
			});
		});
		
		$toolbar.find('.asset-dialog-action-delete').click(function() {
			var selection = getSelection();
			if (selection.length > 0) {
				Boxy.confirm(
					"Are you sure you wish to delete the selected assets/folders?",
					function() {
					  self._delegate.doDelete(selection, function() { self.refresh(); });
					},
					{ title: "Please confirm" }
				);
			} else {
				self._alert('Oops!', 'Please select some items to delete.');
			}
		});
		
		$toolbar.find('.asset-dialog-action-move').click(function() {
			var selection = getSelection();
			
			if(selection.length > 0) {
			  self._delegate.doGetFolders(function(nested_entries) {
			    var o = [];
					
					$.each(nested_entries, function() {
						var name = "";
						for(var i = 0; i < this[0]; i++) name += "> ";
						name += this[1].getName();
						o.push([name, this[1].getID()]);
					});
					
					Boxy.select(
						"Destination:",
						o,
						{ 
							title: "Please select destination",
							confirm: function(value) {
								if(value) {
								  self._delegate.doMove(selection, value, function() { self.refresh(); });
								}
							} 
						}
					);
			  });
			} else {
				self._alert('Oops!', 'Please select some items to move.');
			}
		});
		
		function entryFromTarget($target) {
			var entry = null;
			if ($target.is('.asset-dialog-entry')) {
				entry = this;
			} else {
				entry = $target.parents('.asset-dialog-entry')[0];
			}
			return $.data(entry, 'asset-dialog-entry');
		}
		
		$html.dblclick(function(evt) {
			var $target = $(evt.target), entry = null;
			
			if($target.is('input')) return true;
			
			entry = entryFromTarget($target);
			
			if(entry && entry.isFile()) {
				selectToolbarItem(null);
				hideStack();
				self.editForm = new AssetDialog.EditForm(self, entry);
				self.editForm.context = AssetDialog.EditForm.CONTEXT_LIST;
				self.editForm.setPanel($edit);
				self.editForm.show();
				return false;
			}
			
		});
		
		$html.click(function(evt) {
		
			var $target = $(evt.target), entry = null;
								
			if ($target.is('input')) return true;
		
			entry = entryFromTarget($target);
						
			if (entry) {				
				if($target.is('.asset-action-edit')) {
					selectToolbarItem(null);
					hideStack();
					self.editForm = new AssetDialog.EditForm(self, entry);
					self.editForm.context = AssetDialog.EditForm.CONTEXT_UPLOAD;
					self.editForm.setPanel($edit);
					self.editForm.show();
				} else {
					$contents.find('.asset-dialog-entry').removeClass('selected');
					$(entry).addClass('selected');
					
					if (entry.isFolder()) {
				    self.query.parentId = entry.getID();
				    self.refresh();
				  } else {
				    self.setAsset(entry);
				  }
				}
			}
			
			return false;
			
		});
		
		$upload.click(function(evt) {
			var $target = $(evt.target);
			if($target.is('.asset-action-edit')) {
				return true;
			} else if($target.is('.dismiss')) {
				var $li = $target.parents('li:first');
				$li.fadeOut();
			}
			return false;
		});
		
		$select.click(function() {
			if (self.callback) {
				self.callback(self.asset);
				self.setMode('browse');
				self.hide();
			} else {
				self._alert('Oops!', 'No callback defined - this is probably a bug');
			}
		});
		
        return $html;
		
	},
	
	//
	// Actions
	
	refresh: function() {
		var self = this;
		this._delegate.doQuery(this.query, function(results) {
		  self.view.setItems(results.entries);
		  self.setPath(results.path);
		});
	},
	
	//
	// Show/hide
	
	show: function() {
		if (this.loaded) this.boxy.show();
		else this.showOnLoad = true;
	},
	
	hide: function() {
		if (this.loaded) this.boxy.hide();
		else this.showOnLoad = false;
	},
	
	toggle: function() {
		if (this.loaded) this.boxy.toggle();
		else this.showOnLoad = true;
	},
	
	//
	// 'private'
	
	_alert: function(title, message) {
		Boxy.alert(message, null, {title: title});
	}
};

//
// Query

AssetDialog.Query = function() {
	this.parentId 	= null;
	this.sortBy   	= 'title';
	this.sortOrder	= 'asc';
};

//
//

AssetDialog.EditForm = function(dialog,asset) {
	this.form   = null;
	this.asset  = asset;
	this.dialog = dialog;
};

AssetDialog.EditForm.CONTEXT_UPLOAD = 1;
AssetDialog.EditForm.CONTEXT_LIST   = 2;

AssetDialog.EditForm.prototype = {
	setPanel: function($panel) {
		this.panel = $panel;
	},
	
	show: function() {
		if(this.panel) {
			this.panel.html(this.render());
			this.panel.show();
			this._bind();
		}
	},
	
	render: function() {
		var self  = this,
		    $o    = $('<div class="inner"/>'),
		    $c    = $('<form class="tabular-form"/>');
					
		self.form = $c;
						
		$c.append($('<div class="fi"/>')
			.append($('<label/>').text('Name:'))
			.append($('<input type="text"/>').val(self.asset.getName()).attr('name', 'name'))
			.append($('<div class="c"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label />').text('Filename:'))
			.append($('<input type="text"/>').val(self.asset.getFilename()).attr('name', 'filename'))
			.append($('<div class="c"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label/>').text('Alt Text:'))
			.append($('<input type="text"/>').val(self.asset.getAltText()).attr('name', 'alt_text'))
			.append($('<div class="c"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label/>').text('Description:'))
			.append($('<textarea/>').attr('rows', '10').html(self.asset.getDescription()).attr('name', 'description'))
			.append($('<div class="c"/>'))
		)
		.append($('<div class="buttons"/>')
			.append($('<input type="button"/>').val("Save"))
			.append(' ')
			.append($('<input type="button"/>').val("Cancel"))
		);
		
		var $files = $('<div class="files"/>');
		
		$files.append($('<div/>')
				.append($('<label/>').text('File:'))
				.append($('<div class="thumb"/>').css('backgroundImage', 'url(' + (self.asset.rawThumbnail || self.asset.typeIcon) + ')'))
				.append($('<span id="asset-action-replace-file"/>').text('Change'))
			  )
			  .append($('<div/>')
				.append($('<label/>').text('Thumbnail:'))
				.append(self.asset.thumbnail ? $('<div class="thumb"/>').css('backgroundImage', 'url(' + self.asset.background + ')') : null)
				.append($('<span id="asset-action-replace-thumbnail"/>').text('Change'))
			  );

		$o.append($c);
		$o.append($files);
		$o.append("<div class='cb'/>");
				
		return $o;
	},
	
	_updateAssets: function(entry) {
		var $files = self.panel.find('.files');
	},
	
	_bind: function() {
		this.fileSWFU      = this._buildSWFUpload('file');
		this.thumbnailSWFU = this._buildSWFUpload('thumbnail');
	
		var self = this;
	
		$('input[type=button]', this.panel).click(function() {
			if($(this).val() == 'Cancel') {
				self.close();
			} else {
				self.submit();
			}
		});
	},
	
	close: function() {
		var self = this;
		switch(self.context) {
			case AssetDialog.EditForm.CONTEXT_UPLOAD:
				self.dialog.root.find('.asset-dialog-editor').hide();
				self.dialog.root.find('.asset-dialog-upload').show();
				break;
			case AssetDialog.EditForm.CONTEXT_LIST:
				self.dialog._selectDefaultView();
				break;
		}
	},
	
	submit: function() {
	  var self = this;
	  var attributes = {
	    name          : this.form.find('input[name=name]').val(),
	    filename      : this.form.find('input[name=filename]').val(),
	    altText       : this.form.find('input[name=alt_text]').val(),
	    description   : this.form.find('textarea[name=description]').val()
	  };
		
		this.dialog._delegate.doUpdate(this.asset.getID(), attributes, function() {
			if(self.context) {
				self.close();
			} else {
				alert('Asset updated successfully');
			}
		}, function(d) {
		});
	},
		
	_buildSWFUpload: function(type) {
	  var self        = this,
	      delegate    = this.dialog._delegate;
	      
	  return new SWFUpload(this.dialog._optionsForSWFUpload(type, 'asset-action-replace-' + type, {
      upload_url            : delegate.getUpdateFileURL(this.asset.getID()),
      file_upload_limit     : 1,

      file_dialog_complete_handler: function(n) {
  			this.startUpload();
  		},

  		upload_error_handler: function(file) {},

  		upload_success_handler: function(file, data, response) {
  			var asset = delegate.jsonToEntry(JSON.parse(data));
  			switch(type) {
  				case 'file':
  					alert('File updated!');
  					break;
  				case 'thumbnail':
  					alert('Thumbnail updated!');
  					break;
  			}
  		}
    }));
	}
};

//
//

AssetDialog.AbstractView = function() {};
AssetDialog.AbstractView.prototype = {
	setPanel: function(p) {
		this.panel = p;
	},
	setItems: function(entries) {
		this.entries = entries;
		this.redraw();
	},
	redraw: function() {
		this.panel.html(this.render());
		$('.asset-dialog-entry', this.panel).each(function() {
			this.onselectstart = function() { return false; }
            this.unselectable = 'on';
            this.style.MozUserSelect = 'none';
		});
	}
};

//
//

AssetDialog.ListView = AssetDialog.extend(AssetDialog.AbstractView, {
	render: function() {
		var $c = $('<table class="asset-dialog-browser-list-view" />');
		
		$c.append(
			$('<tr/>')
				.append('<th colspan="3">Name</th>')
				.append('<th class="asset-url">URL</th>')
				.append('<th class="asset-filesize">Size</th>')
		);
		
		for (var i = 0; i < this.entries.length; i++) {
			var e = this.entries[i];
			
			var r = $('<tr class="asset-dialog-entry"/>')
				.append($('<td class="asset-checkbox" />').append($('<input type="checkbox"/>')))
				.append($('<td class="asset-icon" />').append($('<img/>').attr('src', e.getTypeIcon())))
				.append($('<td class="asset-title" />').text(e.getName()))
				.append($('<td class="asset-url" />').text(e.isFile() ? e.getURL() : ''))
				.append($('<td class="asset-filesize" />').text(e.getFormattedSize()))
				.addClass(i & 1 ? 'asset-row-odd' : 'asset-row-even');
			
			$.data(r[0], 'asset-dialog-entry', e);
			
			$c.append(r);
		}
		
		return $c;
	}
});

AssetDialog.GalleryView = AssetDialog.extend(AssetDialog.AbstractView, {
	render: function() {
		var $c = $('<table class="asset-dialog-browser-gallery-view" />'), $row = null;
		
		for (var i = 0; i < this.entries.length; i++) {
			var e = this.entries[i];
			
			if (i % 6 == 0) {
				if ($row) $c.append($row);
				$row = $('<tr/>');
			}
			
			var showTypeIcon = !!e.thumbnail;
			
			var r = $('<td class="asset-dialog-entry"/>')
				.append($('<a class="thumb"/>')
					.css('backgroundImage', 'url(' + e.background + ')')
					.append(showTypeIcon ? $('<div class="type-icon"/>').css('backgroundImage', 'url(' + e.typeIcon + ')') : null)
				)
				.append($('<a class="text"/>')
					.append($('<span/>').text(e.name))
					.append('<br/>')
					.append($('<span class="meta"/>').text(e.formattedSize))
				);
			
			$.data(r[0], 'asset-dialog-entry', e);
			
			$row.append(r);
		}
		
		if ($row) {
			while (i++ % 6 != 0) $row.append($('<td/>'));
			$c.append($row);
		}
		
		return $c;
	}
});

AssetDialog.DetailView = AssetDialog.extend(AssetDialog.AbstractView, {
	render: function() {
		var $c = $('<ul class="asset-dialog-browser-detail-view"/>');
		
		for (var i = 0; i < this.entries.length; i++) {
			var e = this.entries[i];
			
			var showTypeIcon = !!e.thumbnail;
			
			var r = $('<li class="asset-dialog-entry"/>')
				.append($('<a class="thumb" />')
					.css('backgroundImage', 'url(' + e.background + ')')
					.append(showTypeIcon ? $('<div class="type-icon"/>').css('backgroundImage', 'url(' + e.typeIcon + ')') : '')
				)
				.append($('<div class="details"/>')
					.append($('<span class="title"/>').text(e.name))
					.append('<br/>')
					.append($('<span class="meta"/>').text(e.meta))
					.append($('<p class="description"/>').html(e.description))
					.append($('<p class="meta"/>').html(e.timestamps))
				)
				.append($('<div class="cl"/>'))

			$.data(r[0], 'asset-dialog-entry', e);
			
			$c.append(r);
		}
		
		return $c;
	}
});

AssetDialog.prototype.initSWFUpload = function() {
	var self    = this;
	
  new SWFUpload(this._optionsForSWFUpload('file', 'swfupload-button', {
	  file_dialog_complete_handler: function(n) {
			if (n > 0) {
			  this.setUploadURL(self._delegate.getCreateFileURL(self.query.parentId));
			  this.setPostParams(self._delegate.getCreateFileParams(self.query.parentId));
			  this.startUpload();
		  }
		},

		file_queued_handler: function(file) {
			$(self.root).find('.empty').hide();
			var newRow = $('<li />')
			                .addClass('queued-file-' + file.index)
											.append($('<div />').html(file.name).addClass('file-name'))
											.append($('<div />').addClass('progress')
												                  .append($("<div class='marker'>&nbsp;<div>")));
			$(self.root).find('.upload-queue').append(newRow);
		},
		
		upload_error_handler: function(file) {
		},
		
		upload_success_handler: function(file, data, response) {
			var $q        = $(self.root).find('.queued-file-' + file.index),
			    entry     = self._delegate.jsonToEntry(JSON.parse(data));
			
			$.data($q[0], 'asset-dialog-entry', entry);
			$q.addClass('asset-dialog-entry');
		},
		
		upload_complete_handler: function(file) {
			if (this.getStats().files_queued > 0) {
				this.startUpload();
			}
			var $q = $(self.root).find('.queued-file-' + file.index);
			$q.addClass('complete').find('.marker').css('width','100%');
			$q.append($('<div />').addClass('actions')
				.append($("<a class='dismiss' href='#'>dismiss</a>"))
				.append($("<a class='asset-action-edit' href='#'>e</a>"))
			);
		},
		
		upload_progress_handler: function(file, x, y) {
			var percentage = Math.ceil((x / y) * 100);
      $(self.root).find('.queued-file-' + file.index + ' .marker').css('width', percentage + '%');		
		}
	}));
};

AssetDialog.prototype._optionsForSWFUpload = function(type, buttonID, extra) {
  if (type != 'file' && type != 'thumbnail') {
    throw "unknown SWF upload type: " + type;
  }
  
  var dele = this._delegate;
  
  var options = {
    file_post_name          : (type == 'file') ? dele.getFileDataField() : dele.getThumbnailDataField(),
    flash_url               : dele.getSWFUploadSWFURL(),
    button_placeholder_id   : buttonID,
    button_image_url        : AssetDialog.ROOT + 'upload-button.png',
    button_width            : 61,
    button_height           : 22,
  };
  
  if (type == 'thumbnail') {
	  options.file_types = "*.jpg;*.jpeg;*.png;*.gif";
	  options.file_types_description = "Image Files";
	}
	
	return $.extend(options, extra || {});
};