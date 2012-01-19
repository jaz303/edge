module Admin::WidgetsHelper
  def widget_config(config = nil, &block)
    config = capture(&block) if block_given?
    raise "config cannot be nil" unless config
    config = config.to_json unless config.is_a?(String)
    config = "{#{config}}" if config[0..0] != '{'
    content_tag(:script, "return #{config};".html_safe, :type => 'text/javascript-widget-config')
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
  
  #
  # Repeater
  
  class RepeaterBuilder
    def initialize(template)
      @t, @configs, @item_template, @data = template, [], '', []
    end
    
    def template(&block)
      @item_template = @t.capture(&block)
    end
    
    def config(config = nil, &block)
      @configs.push(@t.widget_config(config, &block))
    end
    
    def data(data)
      config("{data: #{data.is_a?(String) ? data : data.to_json}}")
      nil
    end
    
    def to_s
      # TODO: hide move up/down if not reorderable
      html = <<-CODE
        <div class='widget widget-Repeater'>
          #{@configs.join("\n")}
          <a href='#' rel='repeater-add-item'>#{@t.icon(:plus_circle)} Add Item</a>
          <div class='repeater-items'></div>
          <div class='repeater-template repeater-item'>
            #{@item_template}
            <div class='repeater-item-controls'>
              <a href='#' rel='repeater-item-move-up'>#{@t.icon(:arrow_090)} Up</a> |
              <a href='#' rel='repeater-item-move-down'>#{@t.icon(:arrow_270)} Down</a> |
              <a href='#' rel='repeater-item-delete'>#{@t.icon(:minus_circle)} Delete</a>
            </div>
          </div>
        </div>
      CODE
      html.html_safe
    end
  end
  
  def repeater
    builder = RepeaterBuilder.new(self)
    yield builder if block_given?
    builder.to_s
  end
  
end