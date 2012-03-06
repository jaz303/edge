module Admin::WidgetsHelper
  def widget_config(config = nil, &block)
    config = capture(&block) if block_given?
    raise "config cannot be nil" unless config
    config = config.to_json unless config.is_a?(String)
    config = "{#{config}}" if config[0..0] != '{'
    content_tag(:script, "return #{config};".html_safe, :type => 'text/javascript-widget-config')
  end
  
  #
  # Date input
  
  def date_input(name, date = nil, options = {})
    html  = "<span class='widget widget-DateInput'>\n"
    html << "  <input type='text' class='widget-DateInput-display' />\n"
    if options[:optional]
      html << "  <a href='#' rel='remove' class='widget-DateInput-remove'>&times;</a>"
    end
    html << "  <input type='hidden' name='#{name}' value='#{date.try(:iso8601)}' />\n"
    html << "</span>\n"
    html.html_safe
  end
  
  #
  # Asset input
  
  def asset_input(name, asset = nil, options = {})
    html  = "<div class='widget widget-AssetInput' data-asset='#{h(asset.to_json) if asset}'>\n"
    html << "  <div class='_icon'></div>"
    html << "  <span class='_caption'>(no #{options[:description] || 'file'} selected)</span><br>"
    html << "  <a href='#' rel='change'>Choose new...</a> | <a href='#' rel='remove'>Remove</a>"
    html << "  " << hidden_field_tag(name, asset ? asset.id : '')
    html << "  <div class='c'></div>\n"
    html << "</div>"
    html.html_safe
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