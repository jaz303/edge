module Admin
  module BaseHelper

    def error_messages_for(object_name, options = {})
      options = options.symbolize_keys
      object = instance_variable_get("@#{object_name}")
      if object && !object.errors.empty?
        content_tag("div",
          content_tag("strong", options[:title] || "The following errors occurred:") +
          content_tag("ul", object.errors.full_messages.map { |msg| content_tag("li", msg) }.join.html_safe),
          "id" => options[:id] || "errorExplanation", "class" => options[:class] || "flash error"
        )
      else
        ""
      end
    end
    
    #
    # Modules & sections
    
    def current_module
      ::Edge.application.admin_config.module_for(controller.section_path)
    end
    
    def current_top_level_section
      ::Edge.application.admin_config.top_level_section_for(controller.section_path)
    end
    
    def admin_section_url(section)
      section.real_url(self)
    end
    
    def admin_module_select
      curr  = current_module
      html  = "<select onchange='document.location=$(this).val();'>"
      ::Edge.application.admin_config.modules.each do |m|
        html << "<option value='#{admin_section_url(m)}'#{curr == m ? ' selected' : ''}>#{m.title}</option>"
      end
      html << "</select>"
      html.html_safe
    end
    
    def admin_section_tabs
      curr = current_top_level_section
      html = "<ul id='sections'>\n"
      current_module.children.each_value do |s|
        html << "  <li><a href='#{admin_section_url(s)}'#{curr == s ? ' class="active"' : ''}>#{h(s.title)}</a></li>\n"
      end
      html << "</ul>\n"
      html.html_safe
    end
    
    #
    # Pagination
    
    def pagination(collection)
      html  = "<div class='pagebar'>\n"
      html << (will_paginate(collection) || '') if paginating?
      html << "<form method='get' class='per-page'>\n"
      html << "Show "
      html << select_tag('per_page',
                         options_for_select(per_page_options, per_page),
                         :onchange => '$(this).closest("form").submit()')
      html << " items"
      html << "</form>\n"
      html << "<div class='c'></div>\n"
      html << "</div>\n"
      html.html_safe
    end
    
    #
    # Boolean status icons
    
    BOOLEAN_ICONS = {
      :flag => { true => :flag_green, false => :flag },
      :tick => { true => :tick, false => :cross }
    }
    
    def boolean_icon(val, set = :tick, text = nil)
      if set.is_a?(String)
        text = set
        set = nil
      end
      
      if text
        "#{icon(BOOLEAN_ICONS[set][!!val])} #{text}"
      else
        icon(BOOLEAN_ICONS[set][!!val])
      end
    end
    
    #
    # Sidebars, context menus, other page parts
    
    def sidebar_section(where, title, &block)
      content_for(:"#{where}_sidebar") do
        content_tag(:div,
          content_tag(:h2, title) + capture(&block),
          :class => 'section'
        )
      end
    end

    def sidebar_menu(where, title, &block)
      sidebar_section(where, title) do
        content_tag(:div, capture(&block), :class => 'menu')
      end
    end

    def context_menu(&block)
      content_for(:context_menu) { capture(&block) }
    end

    def status_icon(ico, condition, text, when_true = '', when_false = 'not')
      icon(ico, :class => "status-icon #{condition ? 'enabled' : 'disabled'}", :title => text.gsub('?', condition ? when_true : when_false).gsub(/\s+/, ' '))
    end

    def admin_gravatar(admin_user)
      admin_user ? image_tag(gravatar_url(admin_user.email, :size => 24), :title => admin_user.full_name, :rel => 'tipsy') : ''
    end

    # def category_select(model, attrib, options = {})
    #   o = instance_variable_get("@#{model}")
    #   i = o.send(attrib.to_sym)
    #     
    #   indented_select_tag(Category, 'name', "#{model}[#{attrib}]", i, options)
    # end
    # 
    # def indented_select_tag(klass, description_method, field, value = nil, options = {})
    #   o = options_for_select(klass.indent.map { |c| [('> ' * c.first.to_i) + c.last.send(description_method), c.last.id] }, value)
    #   o = "#{content_tag(:option,'')}#{o}" if options.delete(:include_blank)
    #   select_tag(field, o)
    # end
    # 
    # def widget_config(hash)
    #   content_tag(:script, "return #{hash.to_json};".html_safe, :type => 'text/javascript-widget-config')
    # end
    # 
    # def asset_field(model, association)
    # 
    #   if (object = instance_variable_get("@#{model}"))
    #     asset = object.send(association)
    #   else
    #     asset = nil
    #   end
    # 
    #   attribute = "#{model}[#{association}_id]" # TODO: get from reflection
    # 
    #   out  = "<div class='asset-input'>"
    #   out << "#{asset_icon(asset)} "
    #   out << content_tag(:span, (asset ? asset.name : '(no asset selected)'), :class => 'caption')
    #   out << '<br/>' + link_to('Choose new...', '#', :rel => 'change') + ' | ' + link_to('Delete', '#', :rel => 'delete')
    #   out << hidden_field_tag(attribute, asset ? asset.id : '')
    #   out << "<div class='cl'></div>"
    #   out << "</div>"
    #   
    #   out.html_safe
    # 
    # end
    # 
    # def multi_asset_field(model, association)
    # 
    #   basename = "#{model}[#{association.to_s.singularize}_ids]"
    # 
    #   out  = "<div class='multi-asset-input'>"
    #   out << "<table class='list'>"
    #   out << "  <thead>"
    #   out << "    <tr>"
    #   out << "      <th></th>"
    #   out << "      <th>Title</th>"
    #   out << "      <th>Action</th>"
    #   out << "    </tr>"
    #   out << "  </thead>"
    #   out << "  <tbody>"
    # 
    #   if (object = instance_variable_get("@#{model}"))
    #     assets = object.send(association)
    #   else
    #     assets = []
    #   end
    # 
    #   assets.each do |asset|
    #     out << "<tr>"
    #     out <<   "<td>#{asset_icon(asset)}</td>"
    #     out <<   "<td>#{h(asset.name)}</td>"
    #     out <<   "<td>"
    #     out <<   "  <input type='hidden' name='#{basename}[]' value='#{asset.id}' />"
    #     out <<   "  <a href='#' rel='up'>Up</a> |"
    #     out <<   "  <a href='#' rel='down'>Down</a> |"
    #     out <<   "  <a href='#' rel='delete'>Delete</a> "
    #     out <<   "</td>"
    #     out << "</tr>"
    #   end
    # 
    #   out << "  </tbody>"
    # 
    #   out << "  <tfoot style='display: #{assets.empty? ? 'table-row-group' : 'none'}'>"
    #   out << "    <tr><td colspan='4' class='empty'>No assets<input type='hidden' name='#{basename}' value='' /></td></tr>"
    #   out << "  </tfoot>"
    # 
    #   out << "</table>"
    #   out << "<div class='actions'>"
    #   out << icon_link_to(:plus_circle, 'Add asset', '#', :rel => 'add')
    #   out << "</div>"
    #   out << "<input type='hidden' name='basename' value='#{basename}[]' />"
    #   out << "</div>"
    # 
    #   out.html_safe
    # 
    # end
    # 
    # def select_layout(model, method = :layout_name)
    # 
    #   if (object = instance_variable_get("@#{model}"))
    #     layout_name = object.send(method)
    #   else
    #     layout_name = nil
    #   end
    # 
    #   layouts = Layout.find_all_grouped(object).map { |k,v|
    #     [k,v.map { |layout| [layout.title, layout.name] }]
    #   }.sort { |l,r| l.first <=> r.first }
    # 
    #   select_tag("#{model}[#{method}]", grouped_options_for_select(layouts, layout_name))
    # 
    # end
    # 
    # def related_links_field(model)
    #   text_area(model, :all_related_links)
    # end
    # 
    # def lat_lng_field(model)
    #   use_google_maps!
    #   html  = "<div class='widget widget-LatLngInput'>"
    #   html << hidden_field(model, :latitude)
    #   html << hidden_field(model, :longitude)
    #   html << "<div class='map' style='width:450px;height:300px;background-color:#f0f0f0'>(click to activate)</div>"
    #   html << "</div>"
    #   html
    # end
    #   
    # #
    # # Tab bar
    #   
    # class TabBarBuilder
    #   def initialize(template)
    #     @t, @tabs = template, []
    #   end
    #   
    #   def tab(title, &block)
    #     @tabs << [title, @t.capture(&block)]
    #   end
    #   
    #   def to_s
    #     @t.content_tag(:div,
    #       @t.content_tag(:ul,
    #         (@tabs.map { |t| @t.content_tag(:li, @t.content_tag(:a, t.first.html_safe, :href => '#')) }).join.html_safe,
    #         :class => 'tab-bar'
    #       ) + @tabs.map { |t|
    #         @t.content_tag(:div, t.last, :class => 'panel')
    #       }.join("\n").html_safe,
    #       :class => 'widget widget-TabPane'
    #     )
    #   end
    # end
    #   
    # def tab_bar
    #   builder = TabBarBuilder.new(self)
    #   yield builder if block_given?
    #   builder.to_s
    # end
    # 
    # #
    # # Content page editor
    # 
    # class ContentPageEditorBuilder
    #   PARTIALS = {
    #     :content        => 'Content',
    #     :summary        => 'Summary &amp; Classification',
    #     :related_links  => 'Related Links',
    #     :metadata       => 'Metadata',
    #     :assets         => 'Assets'
    #   }
    #   
    #   attr_accessor :form_builder
    #   
    #   def initialize(template)
    #     @t, @tabs = template, TabBarBuilder.new(template)
    #   end
    #   
    #   def tab(thing, &block)
    #     if thing.is_a?(Symbol)
    #       raise "Unknown default tab" unless PARTIALS.key?(thing)
    #       @tabs.tab(PARTIALS[thing]) do
    #         html  = @t.render :partial => "admin/content/page_editor/#{thing}",
    #                           :locals  => {:form => @form_builder}
    #         html << @t.capture(@form_builder, &block) if block_given?
    #         html
    #       end
    #     else
    #       @tabs.tab(thing) { @t.capture(@t, &block) }
    #     end
    #   end
    #   
    #   def to_s
    #     @tabs.to_s
    #   end
    # end
    # 
    # def content_page_editor(&block)
    #   render :partial => 'admin/content/page_editor/form',
    #                 :locals  => {
    #                   :builder => ContentPageEditorBuilder.new(self),
    #                   :block   => block
    #                 }
    # end
    # 
  end
end
