module Edge
  module TinyMceHelper
  
    # Creates a TinyMCE field which gets its content from a model
    def tiny_mce_field(instance, method, *options)
      object = instance_variable_get("@#{instance.to_s}")
      method = method.to_sym if method
      if object && method && object.respond_to?(method)
        content = object.send(method)
      else
        content = ''
      end
      tiny_mce_field_tag("#{instance}[#{method}]", content, *options)
    end

    # Creates a TinyMCE field with explicit name and content
    def tiny_mce_field_tag(name, value = '', *args)
      options = args.extract_options!
      classes = args.map { |o| "tinymce-options-#{o}" }
      id = options[:id] || (name.to_s + "___tinymce")
      text_area_tag(name, value, :id => id, :class => "tinymce #{classes.join(' ')}")
    end

  end
end