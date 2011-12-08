ActionDispatch::Routing::Mapper::Base.class_eval do
  def edge_defaults(*defaults)
    defaults.map(&:to_sym).each do |default|
      case default
      when :admin
        scope :module => 'admin' do
          match 'admin' => 'dashboard#main', :as => 'admin_dashboard'
        end
        edge_admin_resource(:session) { get :logout }
        edge_admin_resources(:admin_users)
        edge_admin_resources(:admin_groups)
      when :assets
        # match 'a/show/:id(/:profile)'  => 'assets#show',     :id => /\d+/, :profile => 'default', :as => 'asset'
        # match 'a/thumb/:id(/:profile)' => 'assets#thumb',    :id => /\d+/, :profile => 'default', :as => 'asset_thumb'
        # match 'a/download/:id'         => 'assets#download', :id => /\d+/, :profile => 'default', :as => 'asset_download'
      when :content
        puts "mapping content..."
      when :home_content
        puts "mapping home content..."
      end
    end
  end
  
  def edge_admin_resource(res)
    namespace :admin do
      resource res do
        yield if block_given?
      end
    end
  end
  
  def edge_admin_resources(res)
    namespace :admin do
      resources res do
        yield if block_given?
        member do
          get :delete
        end
      end
    end
  end
end