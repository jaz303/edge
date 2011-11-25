require 'rails/generators/resource_helpers'
require 'rails/generators/rails/model/model_generator'
require 'rails/generators/rails/resource/resource_generator'
require 'active_support/core_ext/object/blank'

class ManagedResourceGenerator < Rails::Generators::ResourceGenerator
  source_root File.expand_path(File.join(__FILE__, '../templates'))
  desc "Creates a new admin-managed resource"
  
  def create_admin_controller_files
    template 'admin_controller.rb.erb', File.join('app/controllers', admin_controller_file_path + '_controller.rb')
    
    template 'new.html.erb',      "app/views/#{admin_controller_view_path}/new.html.erb"
    template 'index.html.erb',    "app/views/#{admin_controller_view_path}/index.html.erb"
    template 'edit.html.erb',     "app/views/#{admin_controller_view_path}/edit.html.erb"
    template 'delete.html.erb',   "app/views/#{admin_controller_view_path}/delete.html.erb"
    template '_support.html.erb', "app/views/#{admin_controller_view_path}/_support.html.erb"
    template '_form.html.erb',    "app/views/#{admin_controller_view_path}/_form.html.erb"
  end
  
  def add_admin_resource_route
    route "edge_admin_resources :#{file_name.pluralize}"
  end
  
private
  def admin_controller_class_name
    "Admin::#{controller_class_name}"
  end
  
  def admin_controller_view_path
    admin_controller_file_path
  end

  def admin_controller_file_path
    "admin/#{controller_file_path}"
  end
  
  def admin_list_helper
    "admin_#{plural_table_name}_url"
  end
end