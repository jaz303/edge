// TODO: optionally work with IDs rather than indexes for compatibility with back-button
// Widget init process should be split into two stages so vars are guaranteed to be setup
// before defaults() is called because it would be best if the selectedIndex could be
// inferred from the CSS class.

TabBar = Widget.extend({
	methods: {
		setup: function() {
      var self = this, $act = self.$root.find('> ul.tab-bar > li');
      $act.click(function() {
        $act.removeClass('selected');
        $(this).addClass('selected');
        self.$root.find('.panel').hide().eq($act.index(this)).show();
        return false;
      }).eq(self.config.selectedIndex).click();
	  },

    defaults: function() {
      return { selectedIndex: 0 };
    }
	}
});
