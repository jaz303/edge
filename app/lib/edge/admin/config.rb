class Edge::Admin::Config
  def initialize
    @modules = {}
    setup_defaults! # TODO: this should be part of routing
  end
  
  def add_module(id, title = nil, url = nil)
    id = id.to_sym
    mod = (@modules[id] ||= NavItem.new(nil, id))
    mod.title(title || id.to_s.humanize)
    mod.url(url)
    yield mod if block_given?
    mod
  end
  
  def modules
    @modules.values
  end
  
  def module_for(path)
    path.empty? ? nil : @modules[path.first.to_sym]
  end
  
  def top_level_section_for(path)
    if path.length < 2
      nil
    elsif (mod = module_for(path))
      mod.children[path[1].to_sym]
    else
      nil
    end
  end
  
private

  def setup_defaults!
    add_module :dashboard, 'Dashboard' do |m|
      m.section :main, 'Main', :admin_dashboard_path
    end
    add_module :cms, 'CMS' do |m|
      m.section :content, 'Content', :admin_nodes_url
    end
    add_module :system, 'System' do |m|
      m.section :admin_users, 'Users', :admin_admin_users_path
      m.section :admin_groups, 'Groups', :admin_admin_groups_path
    end
  end
  
  class NavItem
    def self.dsl_attr(name)
      class_eval <<-CODE
        def #{name}(val = nil)
          @#{name} = val unless val.nil?
          @#{name}
        end
      CODE
    end
    
    attr_reader :parent, :id, :children
    dsl_attr :title
    dsl_attr :description
    dsl_attr :url
    
    def initialize(parent, id)
      @parent, @id = parent, id.to_sym
      @children = {}
    end
    
    def default_url
      unless defined?(@default_url)
        @default_url = if @url
                         @url
                       elsif @children.size > 0
                         @children.first[1].default_url
                       else
                         nil
                       end
      end
      @default_url
    end
    
    def real_url(template)
      @real_url ||= if default_url.is_a?(String)
                      default_url
                    elsif default_url.is_a?(Symbol)
                      template.send(default_url)
                    else
                      template.send(:url_for, default_url)
                    end
    end
    
    def section(id, title = nil, url = nil)
      id = id.to_sym
      sec = (@children[id] ||= NavItem.new(self, id))
      sec.title(title || id.to_s.humanize)
      sec.url(url)
      yield sec if block_given?
      sec
    end
  end
end