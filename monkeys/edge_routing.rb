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
        
        edge_admin_resources :file_folders
        edge_admin_resources :files
      when :assets
        match 'files/show/:id(/:profile)'  => 'files#show',     :id => /\d+/, :profile => 'default', :as => 'file'
        match 'files/thumb/:id(/:profile)' => 'files#thumb',    :id => /\d+/, :profile => 'default', :as => 'file_thumb'
        match 'files/download/:id'         => 'files#download', :id => /\d+/, :profile => 'default', :as => 'file_download'
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