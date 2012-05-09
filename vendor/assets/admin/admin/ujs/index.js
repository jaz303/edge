$(function() {
  var authTokenParam  = $('meta[name=csrf-param]').attr('content'),
      authTokenValue  = $('meta[name=csrf-token]').attr('content');
      
  $(document.body).on('click', 'a[data-confirm]', function(evt) {
    var confirmationMessage = this.getAttribute('data-confirm');
    if (!confirm(confirmationMessage)) {
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();
    }
  });
  
  $(document.body).on('click', 'a[data-method]', function(evt) {
    var $form = $('<form/>').attr('action', this.href)
                            .attr('method', 'POST');
                            
    $form.append($('<input type="hidden"/>').attr('name', authTokenParam).val(authTokenValue))
         .append($('<input type="hidden"/>').attr('name', '_method').val(this.getAttribute('data-method')))
         .submit();
      
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
  });
});
