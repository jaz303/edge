function AssetDialog(html) {
	
	var self = this;
	
	this.lockCount  = 0;
	this.loaded		= false;
	this.showOnLoad	= true;
	
	this.root       = null;
	this.view		= null;
	this.editForm   = null;

	this.query		= new AssetDialog.Query;
	this.asset		= null;
	
	this.mode		= 'browse';
	this.callback	= null;
	
	this._delegate	= new AssetDialog.DELEGATE();
	
	$.get(this.d('getChromeURL'), function(html) {
	  	self.root = self.bind(html);
		self.boxy = new Boxy(self.root, {title: 'Assets', show: self.showOnLoad});
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
							.css('backgroundImage', 'url(' + e.background + ')')
							.append($('<a>').text(e.name));
			
			$.data($entry[0], 'asset-dialog-entry', e);
			$c.append($entry);	
		}
		
		var root = new AssetDialog.Entry(this._delegate, {name: 'Asset Archive', type:'folder'});
		
		appendPathEntry(root);
		
		for(var i = 0; i < path.length; i++) {
			var e = path[i];
			appendPathEntry(e);
		}
		
		$status.html('');
		$status.append($c);
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
			} while (!self.d('isValidFolderName', newFolderName));
			self.d('doCreateFolder', self.query.parentId, newFolderName, function() {
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
						self.d('doDelete', selection, function() { self.refresh(); });
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
				
				self.d('doGetFolders', function(nested_entries) {
					
					var o = [];
					
					$.each(nested_entries, function() {
						var name = "";
						for(var i = 0; i < this[0]; i++) name += "> ";
						name += this[1].name;
						o.push([name, this[1].id]);
					});
					
					Boxy.select(
						"Destination:",
						o,
						{ 
							title: "Please select destination",
							confirm: function(value) {
								if(value) {
									self.d('doMove', selection, value, function() { self.refresh(); });
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
			
			if(entry && entry.asset) {
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
				
					if (entry.folder) {
						self.query.parentId = entry.id;
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
		this.d('doQuery', this.query, function(results) { self.view.setItems(results.entries); self.setPath(results.path); });
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
	
	d: function() {
		var args = $.makeArray(arguments), method = args.shift();
		return this._delegate[method].apply(this._delegate, args);
	},
	
	_alert: function(title, message) {
		Boxy.alert(message, null, {title: title});
	}
		
};

//
//

AssetDialog.Entry = function(delegate, attributes) {
	$.extend(this, AssetDialog.Entry.DEFAULTS, attributes || {});
	this.delegate	= delegate;
	this.folder 	= this.type == 'folder';
	this.asset  	= this.type == 'asset';
	if (this.folder) {
		this.meta = 'Folder';
	} else {
		var fs = this.size, sizes = ['B', 'KB', 'MB', 'GB'];
		while (fs >= 1024 && sizes.length > 1) {
			fs /= 1024; sizes.shift();
		}
		this.formattedSize = (Math.round(fs * 10) / 10) + sizes[0];
		this.extension = this.fileName.split('.').pop();
		if (this.webSafe) {
			this.image = true;
			this.icon = this.delegate.getIconForEntry(this);
		}
		this.meta = this.fileName;
		if (this.width && this.height) {
			this.meta += ', ' + this.formattedSize + ', ' + this.width + 'x' + this.height;
		}
	}

	this.webSafe = this.contentType.match(/^image\/(gif|png|p?jpe?g)$/);

	this.rawThumbnail  = this.delegate.getRawThumbnailForEntry(this);
	this.thumbnail 	   = this.delegate.getThumbnailForEntry(this);
	
	this.typeIcon = this.delegate.getTypeIconForEntry(this);

	this.url = this.delegate.getUrlForEntry(this);
	
	this.icon = this.icon || this.typeIcon;
	this.iconCSS = 'url(' + this.icon + ')';
	
	this.background = this.thumbnail || this.typeIcon;
	this.backgroundCSS = 'url(' + this.background + ')';
	
};

AssetDialog.Entry.DEFAULTS = {
	id: 			null,
	parentId: 		null,
	name: 			"Unknown",
	description: 	'',
	fileName: 		'',
	size: 			0,
	formattedSize:  '',
	contentType: 	"application/octet-stream",
	image:   		false,
	typeIcon: 		"",
	thumbnail: 		"",
	icon: 			"",
	background: 	"",
	width: 			null,
	height: 		null
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
		var self = this;
		
		var $o = $('<div class="inner"/>');
								
		var $c = $('<form class="tabular-form"/>').attr('method','POST').attr('action',self.dialog._delegate.getUpdateURL(self.asset.id));
					
		self.form = $c;			
						
		$c.append($('<div class="fi"/>')
			.append($('<label/>').text('Name:'))
			.append($('<input type="text"/>').val(self.asset.name).attr('name',self.dialog._delegate.getAttributePostName('name')))
			.append($('<div class="cl"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label />').text('Filename:'))
			.append($('<input type="text"/>').val(self.asset.fileName).attr('name',self.dialog._delegate.getAttributePostName('filename')))
			.append($('<div class="cl"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label/>').text('Alt Text:'))
			.append($('<input type="text"/>').val(self.asset.altText).attr('name',self.dialog._delegate.getAttributePostName('alt_text')))
			.append($('<div class="cl"/>'))
		)
		.append($('<div class="fi"/>')
			.append($('<label/>').text('Description:'))
			.append($('<textarea/>').attr('rows', '10').html(self.asset.description).attr('name',self.dialog._delegate.getAttributePostName('description')))
			.append($('<div class="cl"/>'))
		)
		.append($('<div class="buttons"/>')
			.append($('<input type="button"/>').val("Save"))
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
		var attributes = this.form.serialize();
		var self = this;
		
		this.dialog._delegate.doUpdate(this.asset.id, attributes, function() {
			if(self.context) {
				self.close();
			} else {
				alert('Asset updated successfully');
			}
		}, function(d) {
		});
	},
		
	_buildSWFUpload: function(type) {		
		var self = this, delegate = this.dialog._delegate;

		var upload_url;
		
		switch(type) {
			case 'file':
				upload_url = delegate.getUpdateURL(this.asset.id);
				break;
			case 'thumbnail':
				upload_url = delegate.getCreateThumbnailURL(this.asset.id);
				break;
		}
							
		var swfu = new SWFUpload({
			upload_url: upload_url,
			thumbnail_url: delegate.getCreateThumbnailURL(),
			
			file_post_name: delegate.getUploadPostName(),
			flash_url: delegate.getSWFUploadURL(),
			
			button_placeholder_id: 'asset-action-replace-' + type,
			button_image_url: delegate.getSWFUploadButtonURL(),
			button_width: delegate.getSWFUploadButtonDimensions()[0],
			button_height: delegate.getSWFUploadButtonDimensions()[1],
			
			file_upload_limit: 1,
			
			file_dialog_complete_handler: function(n) {
				delegate.setBusy();
				this.startUpload();
			},
			
			upload_error_handler: function(file) {
			},
			
			upload_success_handler: function(file, data, response) {
				var asset = delegate.jsonToEntry(eval("(" + data + ")"));
				switch(type) {
					case 'file':
						alert('update file');
						break;
					case 'thumbnail':
						alert('update thumbnail');
						break;
				}
			},
			
			upload_complete_handler: function(file) {
				delegate.setIdle();
			}, 
			
			upload_progress_handler: function(file,x,y) {
			}			
		});
		return swfu;
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
				.append($('<td class="asset-icon" />').append($('<img/>').attr('src', e.typeIcon)))
				.append($('<td class="asset-title" />').text(e.name))
				.append($('<td class="asset-url" />').text(e.url))
				.append($('<td class="asset-filesize" />').text(e.formattedSize))
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

//
// Delegate supporting integration with Edge CMS

AssetDialog.EdgeDelegate = function() {};

AssetDialog.EdgeDelegate.BASE_URL = '/admin/files/';

AssetDialog.EdgeDelegate.KEY_MAP = {
	parent_id: 'parentId',
	folder_id: 'parentId',
	file_file_name: 'fileName',
	file_file_size: 'size',
	file_content_type: 'contentType',
	alt_text: 'altText',
};

AssetDialog.EdgeDelegate.EXTENSION_MAP = {"com":"application","exe":"application","bat":"application","sh":"application_terminal","h":"blue_document_code","c":"blue_document_code","cpp":"blue_document_code","cs":"blue_document_code","php":"blue_document_php","rb":"blue_document_code","rhtml":"blue_document_code","cfm":"blue_document_code","as":"blue_document_code","html":"blue_document_code","xml":"blue_document_code","java":"blue_document_code","sql":"blue_document_code","jpg":"image","jpeg":"image","gif":"image","png":"image","bmp":"blue_document_image","psd":"blue_document_photoshop","tif":"blue_document_image","tiff":"blue_document_image","ai":"blue_document_illustrator","ppt":"blue_document_powerpoint","pdf":"blue_document_pdf_text","xls":"blue_document_excel_table","doc":"blue_document_word_text","mdb":"blue_document_access","fla":"blue_document_flash","swf":"blue_document_flash_movie","txt":"blue_document_text","pst":"blue_document_outlook","zip":"blue_document_zipper","gz":"blue_document_zipper","bz2":"blue_document_zipper","tar":"blue_document_zipper","iso":"disc","url":"blue_document_globe","webloc":"blue_document_globe","wav":"blue_document_music","aiff":"blue_document_music","aif":"blue_document_music","mp3":"blue_document_music","ogg":"blue_document_music","pls":"blue_document_music_playlist","wmv":"blue_document_film","mpg":"blue_document_film","mpeg":"blue_document_film","avi":"blue_document_film","mov":"blue_document_film","bin":"blue_document_binary"};

AssetDialog.EdgeDelegate.prototype = {
	
	//
	// Public interface; your delegate must implement all of these methods
	
	doQuery: function(query, then) {
		var self = this;
		$.ajax(
			$.extend(this._ajaxOptionsForQuery(query), {
				type: 'GET', dataType: 'json', success: function(json) {
					then(self._jsonToEntries(json))
				}
			})
		);
	},
	
	doCreateFolder: function(parentId, folderName, success, failure) {
		$.ajax({
			type: 'POST',
			url: this._url('create_folder'),
			data: ('folder[parent_id]=' + (parentId || '') + '&folder[name]=' + folderName),
			success: success,
			error: failure
		});
	},
	
	doUpdate: function(assetId, attributes, success, failure) {
		$.ajax({
			type: 'POST',
			url: this.getUpdateURL(assetId),
			data: attributes,
			success: success,
			error: failure
		});
	},
	
	doDelete: function(items, then) {
		var ids = [];
		
		$.each(items, function() {
			ids.push((this.asset ? 'asset_ids[]' : 'folder_ids[]') + '=' + this.id);
		});
		
		$.ajax({
			type: 'POST',
			url: this._url('delete'),
			data: ids.join('&'),
			success: then
		});
	},
	
	doGetFolders: function(then) {
		var self = this;
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: this._url('folders'),
			success: function(json) {
				then(self._jsonFoldersToEntries(json));
			}
		});
	},
	
	doMove: function(items, toFolderId, then) {
		var ids = ['target_folder_id='+toFolderId];
		
		$.each(items, function() {
			ids.push((this.asset ? 'asset_ids[]' : 'folder_ids[]') + '=' + this.id);
		});
	
		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: this._url('move'),
			data: ids.join('&'),
			success: then
		});
	},
	
	// Process the raw JSON from the server and turn it into an AssetDialog.Entry
	jsonToEntry: function(data) {
		var obj = data.file_folder || data.uploaded_file;
		    obj.type = data.file_folder ? 'folder' : 'asset';
		for (var k in AssetDialog.EdgeDelegate.KEY_MAP) {
			var v = AssetDialog.EdgeDelegate.KEY_MAP[k];
			if (k in obj) {
				obj[v] = obj[k];
				delete obj[k];
			}
		}
		
		return new AssetDialog.Entry(this, obj);
	},
	
	isValidFolderName: function(folderName) {
		return folderName.length > 0 && folderName.match(/^[^\/]+$/);
	},
	
	getChromeURL: function() {
		return this._url('dialog');
	},
	
	getUrlForEntry: function(entry) {
		return entry.folder ? '' : ('/files/show/' + entry.id);
	},
	
	getTypeIconForEntry: function(entry) {
		var i = "/assets/ico_fugue_";
		if (entry.folder) {
			if(entry.id) {
				return i + (entry.name == '..' ? 'arrow_up.png' : 'folder.png');
			} else {
				return i + 'drive_network.png';
			}
		} else {
			return i + (AssetDialog.EdgeDelegate.EXTENSION_MAP[entry.extension.toLowerCase()] || 'page_white') + '.png';
		}
	},
	
	getIconForEntry: function(entry) {
		return "/files/show/" + entry.id + "/system-icon";
	},
	
	getRawThumbnailForEntry: function(entry) {
		if(entry.asset && entry.webSafe) {
			return "/files/show/" + entry.id + "/system-thumbnail";
		} else {
			return null;
		}
	},
	
	getThumbnailForEntry: function(entry) {
		if(entry.asset && (entry.webSafe || entry.thumbnail_id)) {
			return "/files/thumb/" + entry.id + "/system-thumbnail";
		} else {
			return null;
		}
	},

	getSWFUploadURL: function() {
		return '/assets/swfupload.swf';
	},
	
	getSWFUploadPlaceholderId: function() {
		return 'swfupload-button';
	},
	
	getSWFUploadButtonURL: function() {
		return '/assets/asset-dialog/upload-button.png';
	},
	
	getSWFUploadButtonDimensions: function() {
		return [61,22];
	},
	
	getUploadURL: function(folderId) {
		return this._url('create') + '?folder_id=' + (folderId || '') + '&' + EDGE_SESSION_KEY + '=' + EDGE_SESSION_ID;
	},
	
	getUpdateURL: function(assetId) {
		return this._url('update') + '/' + assetId + '?' + EDGE_SESSION_KEY + '=' + EDGE_SESSION_ID;
	},
	
	getCreateThumbnailURL: function(assetId) {
		return this._url('create_thumbnail') + '/' + assetId + '?' + EDGE_SESSION_KEY + '=' + EDGE_SESSION_ID;
	},
	
	getUploadPostData: function() {
		return {folder_id: this.dialog.query.parentId}
	},
	
	getUploadPostName: function() {
		return this.getAttributePostName('file');
	},
	
	getAttributePostName: function(attribute) {
		return 'asset[' + attribute + ']';
	},
		
	setBusy: function() {
		admin.busy();
	},
	
	setIdle: function() {
		admin.idle();
	},
		
	//
	// Privates
	
	_jsonToEntries: function(json) {
		var path = [], entries = [], self = this;
		
		$.each(json.entries, function() {
			entries.push(self.jsonToEntry(this));
		});
		
		if ('parent_id' in json) {
			entries.unshift(new AssetDialog.Entry(self, {
				id: json.parent_id || null,
				type: 'folder',
				name: '..'
			}));
		}
		
		if('path' in json) {
			$.each(json.path, function() {
				var obj  = this.file_folder;
				obj.type = 'folder';
				path.push(new AssetDialog.Entry(self,obj));
			});
		}
		
		var structure = {
			entries: entries,
			path:    path
		};
				
		return structure;
	},
	
	_jsonFoldersToEntries: function(json) {
		var r = [], self = this;
		
		$.each(json, function() {
			r.push([this[0], self.jsonToEntry(this[1])]);
		});
		
		return r;
	},
	
	_url: function(url) {
		return AssetDialog.EdgeDelegate.BASE_URL + url;
	},
	
	_ajaxOptionsForQuery: function(query) {
		return {
			url: this._url('list'),
			data: {
				parent_id: (query.parentId || '')
			}
		};
	}
	
};

//
// Delegate constructor

AssetDialog.DELEGATE = AssetDialog.EdgeDelegate;

//
//
//

AssetDialog.prototype.initSWFUpload = function() {
	var self = this;
	
	var swfu = new SWFUpload({
		file_post_name: this.d('getUploadPostName'),
		flash_url: this.d('getSWFUploadURL'),
		
		button_placeholder_id: this.d('getSWFUploadPlaceholderId'),
		button_image_url: this.d('getSWFUploadButtonURL'),
		button_width: this.d('getSWFUploadButtonDimensions')[0],
		button_height: this.d('getSWFUploadButtonDimensions')[1],
		
		file_dialog_complete_handler: function(n) {
			if(n > 0) {
				this.setUploadURL(self.d('getUploadURL', self.query.parentId));
				this.startUpload();
			}
		},

		file_queued_handler: function(file) {
			$(self.root).find('.empty').hide();
			var newRow = $('<li />').addClass('queued-file-' + file.index)
											.append($('<div />').html(file.name).addClass('file-name'))
											.append($('<div />').addClass('progress')
												.append($("<div class='marker'>&nbsp;<div>"))
											)
			$(self.root).find('.upload-queue').append(newRow);
		},
		
		
		upload_error_handler: function(file) {
		},
		
		upload_success_handler: function(file, data, response) {
			var $q = $(self.root).find('.queued-file-' + file.index);
			var asset_data = eval("(" + data + ")");
			var e = self.d('jsonToEntry', asset_data);
			
			$.data($q[0], 'asset-dialog-entry', e);
			$q.addClass('asset-dialog-entry');
		},
		
		upload_complete_handler: function(file) {
			if(this.getStats().files_queued > 0) {
				this.startUpload();
			}
			var $q = $(self.root).find('.queued-file-' + file.index);
			$q.addClass('complete').find('.marker').css('width','100%');
			$q.append($('<div />').addClass('actions')
				.append($("<a class='dismiss' href='#'>dismiss</a>"))
				.append($("<a class='asset-action-edit' href='#'>e</a>"))
			);
		},
		
		upload_progress_handler: function(file,x,y) {
			var percentage = Math.ceil((x/y)*100);
      		$(self.root).find('.queued-file-' + file.index + ' .marker').css('width', percentage + '%');		
		}
	});
};
