module Admin::WidgetsHelper
  def widget_config(hash)
    content_tag(:script, "return #{hash.to_json};".html_safe, :type => 'text/javascript-widget-config')
  end
  
  #
  # Tab bar
  
  class TabBarBuilder
    def initialize(template)
      @t, @tabs = template, []
    end
    
    def tab(title, &block)
      @tabs << [title, @t.capture(&block)]
    end
    
    def to_s
      @t.content_tag(:div,
        @t.content_tag(:ul,
          (@tabs.map { |t| @t.content_tag(:li, @t.content_tag(:a, t.first.html_safe, :href => '#')) }).join.html_safe,
          :class => 'tab-bar'
        ) + @tabs.map { |t|
          @t.content_tag(:div, t.last, :class => 'panel')
        }.join("\n").html_safe,
        :class => 'widget widget-TabBar'
      )
    end
  end

  def tab_bar
    builder = TabBarBuilder.new(self)
    yield builder if block_given?
    builder.to_s
  end
end