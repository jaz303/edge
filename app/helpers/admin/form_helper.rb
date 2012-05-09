module Admin::FormHelper
  def buttons(options = {})
    options[:show] ||= [ :ok, :cancel ]
    options[:ok] ||= "Save"
    options[:cancel] ||= "Cancel"

    if options[:cancel_url]
      cancel_js = "window.location='#{options[:cancel_url]}';"
    else
      cancel_js = "history.go(-1);"
    end

    out  = "<div class='buttons'>\n"
    for button in options[:show]
      case button
      when :ok
        out << " <input type='submit' class='ok' value='#{options[:ok]}' />\n"
      when :cancel
        out << " <input type='button' class='cancel' value='#{options[:cancel]}' onclick=\"#{cancel_js}\" />\n"
      when :reset
        out << " <input type='reset' class='reset' value='#{options[:reset]}' />\n"
      end
    end
    out += "</div>\n"
    out.html_safe
  end
  
  def basic_admin_form_for(record_or_name_or_array, *args, &proc)
    record_or_name_or_array = [:admin, record_or_name_or_array] if record_or_name_or_array.respond_to?(:new_record?)
    form_for(record_or_name_or_array, *args, &proc)
  end
  
  def admin_form_for(record_or_name_or_array, *args, &proc)
    record_or_name_or_array = [:admin, record_or_name_or_array] if record_or_name_or_array.respond_to?(:new_record?)
    args.push({}) unless args.last.is_a?(Hash)
    
    options = args.last
    form_type = options.delete(:form_type) || :tabular
    args.last[:builder] = EDGE_ADMIN_FORM_BUILDERS[form_type]
    
    form_for(record_or_name_or_array, *args, &proc)
  end
  
  class BaseFormBuilder < ::ActionView::Helpers::FormBuilder
    VISIBLE_FIELD_HELPERS = {
      :asset_field                => 1,
      :check_box                  => 1,
      :code_mirror_editor         => 1,
      :collection_select          => 4,
      :date_select                => 1,
      :datetime_select            => 1,
      :email_field                => 1,
      :file_field                 => 1,
      :grouped_collection_select  => 6,
      :number_field               => 1,
      :password_field             => 1,
      :phone_field                => 1,
      :radio_button               => 2,
      :range_field                => 1,
      :search_field               => 1,
      :telephone_field            => 1,
      :text_area                  => 1,
      :text_field                 => 1,
      :time_select                => 1,
      :url_field                  => 1,
    }
    
    INVISIBLE_FIELD_HELPERS = %w(hidden_field)
    
    def initialize(object_name, object, template, options, proc)
      html_options = (options[:html] ||= {})
      html_options[:class] ||= ''
      html_options[:class] << " #{form_class}"
      super
    end
    
    def code_mirror_editor(method, options = {})
      @template.code_mirror_editor_tag("#{@object_name}[#{@method}]", @object.send(method), options)
    end
    
    def asset_field(method, options = {})
      @template.asset_input("#{@object_name}[#{@method}]", @object.send(method))
    end
    
    def form_class
      raise
    end
  end
  
  class TabularFormBuilder < BaseFormBuilder
    def form_class
      'tabular'
    end
    
    def fieldset(title = '', &block)
      html  = "<fieldset>"
      html << @template.content_tag(:legend, title) if title
      html << "<ol>"
      html << @template.capture(&block) if block_given?
      html << "</ol>"
      html << "</fieldset>"
      html.html_safe
    end
    
    def item(options = {}, &block)
      html  = "<li>\n"
      html << "  <label>#{options[:label]}</label>\n" if options[:label]
      html << "  <div class='form-input'>\n"
      html << @template.capture(&block) if block_given?
      html << "    <p class='note'>#{options[:note]}</p>\n" if options[:note]
      html << "  </div>\n"
      html << "</li>\n"
      html.html_safe
    end
    
    def buttons
      @template.buttons
    end
    
    VISIBLE_FIELD_HELPERS.each do |helper, options_arg|
      class_eval <<-CODE
        alias naked_#{helper} #{helper}
      
        def #{helper}(*args, &block)
          options = args[#{options_arg}] || {}
          label   = options.delete(:label)
          label   = args[0].to_s.humanize if label === true
          
          note    = options.delete(:note)
          
          html  = "<li>"
          html << "<label>\#{label}</label>" if label
          html << "<div class='form-input'>"
          html << naked_#{helper}(*args, &block)
          html << "<p class='note'>\#{note}</p>" if note
          html << "</div>"
          html << "</li>"
          html.html_safe
        end
      CODE
    end
  end
  
  EDGE_ADMIN_FORM_BUILDERS = {
    :tabular      => TabularFormBuilder
  }
end