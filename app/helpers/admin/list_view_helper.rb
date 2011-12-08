module Admin::ListViewHelper
  def list_view(collection, options = {})
    builder = ListViewBuilder.new(collection, self, options)
    yield builder if block_given?
    builder.to_html
  end
  
  class ListViewBuilder
    def initialize(collection, template, options)
      @collection, @template = collection, template
      @columns, @actions = [], []
    end
    
    def column(method, title = nil, &formatter)
      if method.is_a?(String)
        title = method
        method = nil
      end
      
      @columns << {
        :method     => method,
        :title      => title || method.to_s.humanize,
        :formatter  => formatter
      }
      nil
    end
    
    def action(title, options = {})
      options[:title] = title
      @actions << options
    end
    
    def to_html
      html  = "<table class='list'>\n"
      html << header_html
      html << "<tbody>\n"
      
      if @collection.empty?
        html << "<tr>\n"
        html << "<td class='empty' colspan='#{@columns.size + 1}'>No items found</td>\n"
        html << "</tr>\n"
      else
        @collection.each { |c| html << row_html(c) }
      end
      
      html << "</tbody>\n"
      html << "</table>\n"
      html.html_safe
    end
    
  private
    def h(html)
      ::CGI.escapeHTML(html)
    end
  
    def header_html
      html  = "<thead>\n"
      html << "<tr>\n"
      
      @columns.each do |c|
        html << "<th>#{h(c[:title])}</th>\n"
      end
      
      html << "<th>Actions</th>\n"
      html << "</tr>\n"
      html << "</thead>\n"
      html
    end
    
    def row_html(object)
      html  = "<tr>\n"
      
      @columns.each do |col|
        value = col[:method] ? object.send(col[:method]) : nil
        if col[:formatter]
          value = col[:formatter].call(object, value) || ''
        else
          value = h(value || '')
        end
        html << "<td>#{value}</td>\n"
      end
      
      actions = @actions.map { |a|
        text = a[:title]
        
        if a[:icon].is_a?(Symbol)
          text = "#{@template.icon(a[:icon])} #{text}"
        elsif a[:action].is_a?(String)
          text = "#{a[:icon]} #{text}"
        end
        
        if a[:url].is_a?(String)
          url = a[:url]
        elsif a[:url].is_a?(Proc)
          url = a[:url].call(object)
        elsif a[:url].is_a?(Hash)
          url = @template.url_for(a[:url].merge(:id => object))
        elsif a[:url].is_a?(Symbol)
          url = @template.send(a[:url], object)
        else
          url = '#'
        end
        
        @template.link_to(text.html_safe, url)
      }.join(' | ')
      
      html << "<td>#{actions}</td>"
      
      html << "</tr>\n"
    end
  end
end