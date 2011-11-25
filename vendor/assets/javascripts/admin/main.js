//= require admin/jquery.min.js
//= require admin/edge.config.js

$(function() {
  
  //
  // TinyMCE !!!
  
  $('textarea.tinymce').each(function() {
    
    var optionSets = ['common'];
    
    $.each(this.className.split(/\s+/), function() {
      if (this.match(/^tinymce-options-(.*?)$/)) optionSets.push(RegExp.$1);
    });
    
    if (optionSets.length == 1) {
      $.each(edge.config.admin.tinyMCE.defaultOptionSets, function() { optionSets.push(this); });
    }
    
    console.log(optionSets);
    
    var options = {};
    $.each(optionSets, function() {
      $.extend(options, edge.config.admin.tinyMCE.optionSets[this] || {});
    });
    
    $(this).tinymce(options);
      
  });

});