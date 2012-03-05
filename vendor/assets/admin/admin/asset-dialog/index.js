//= require ./asset.js
//= require ./edge-delegate.js
//= require ./asset-dialog.js

AssetDialog.DELEGATE = new edge.admin.EdgeDelegate();
AssetDialog.ROOT = '/assets/admin/asset-dialog/';

AssetDialog.serialize = function(object) {
  if (!object) {
    return null;
  } else if (object.isFile()) {
    return {
      __file__          : object.getID(),
      delegate          : object._delegate.getDelegateID()
    };
  } else if (object.isFolder()) {
    return {
      __folder__        : object.getID(),
      delegate          : object._delegate.getDelegateID()
    };
  } else {
    throw "WHAT DO YOU CALL THIS?";
  }
};

AssetDialog.unserialize = function(object, callback) {
  if (!object) {
    callback(null);
    return null;
  } else if ('__file__' in object) {
    AssetDialog.DELEGATE.openFile(object.__file__, callback);
    return object.__file__;
  } else if ('__folder__' in object) {
    throw "unserializing folders is not yet supported";
  }
};