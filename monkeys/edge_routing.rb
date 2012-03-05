ActionDispatch::Routing::Mapper::Base.class_eval do
  def edge_defaults(*defaults)
    defaults.map(&:to_sym).each do |default|
      case default
      when :admin
        scope :module => 'admin' do
          match 'admin' => 'dashboard#main', :as => 'admin_dashboard'
        end
        
        edge_admin_resource(:session) do
          member { get :logout }
        end
        
        edge_admin_resources :admin_users
        edge_admin_resources :admin_groups
        edge_admin_resources :nodes
        
        namespace :admin do
          match 'file_manager/list'               => 'file_manager#list',           :via => :get
          match 'file_manager/folder_list'        => 'file_manager#folder_list',    :via => :get
          match 'file_manager/show_file/:id'      => 'file_manager#show_file',      :via => :get
          match 'file_manager/delete'             => 'file_manager#delete',         :via => :post
          match 'file_manager/move'               => 'file_manager#move',           :via => :post
          match 'file_manager/create_file'        => 'file_manager#create_file',    :via => :post
          match 'file_manager/create_folder'      => 'file_manager#create_folder',  :via => :post
          match 'file_manager/update_file/:id'    => 'file_manager#update_file',    :via => :post
          match 'file_manager/update_folder/:id'  => 'file_manager#update_folder',  :via => :post
        end
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