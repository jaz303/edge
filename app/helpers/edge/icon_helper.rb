module Edge
  module IconHelper
    def icon_path(icon, set = nil)
      image_path("ico_#{set || 'fugue'}_#{icon}.png")
    end
    
    def icon(icon, set = nil)
      image_tag(icon_path(icon, set), :class => 'icon', :alt => '')
    end
    
    def icon_css(icon, set)
      "background-image: url(#{icon_path(icon, set)})"
    end
    
    def icon_link_to(i, t, url, options = {})
      inner = icon(i)
      inner << " <span class='caption'>#{t}</span>".html_safe if t
      link_to(inner, url_for(url), options)
    end
  end
end