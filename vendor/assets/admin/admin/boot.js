$.rebind(function(context) {
  
  //
  // TinyMCE
  
  $('textarea.tinymce', context).each(function() {

    var optionSets = ['common'];

    $.each(this.className.split(/\s+/), function() {
      if (this.match(/^tinymce-options-(.*?)$/)) optionSets.push(RegExp.$1);
    });

    if (optionSets.length == 1) {
      $.each(edge.config.admin.tinyMCE.defaultOptionSets, function() { optionSets.push(this); });
    }

    var options = {};
    $.each(optionSets, function() {
      $.extend(options, edge.config.admin.tinyMCE.optionSets[this] || {});
    });

    $(this).tinymce(options);

  });
  
  //
  // CodeMirror
  
  $('textarea.code-mirror').each(function() {
    var config = $(this).data('code-mirror-config');
    CodeMirror.fromTextArea(this, config);
  });
  
  //
  // Widgets
  
  Widget.initializeAll(context);
  
});

$(function() {
  disco.pluckTemplates();
  Repeater.configureForRails();
  $.rebind();
});

$(window).unload(function() {
  Widget.destroyAll();
});
