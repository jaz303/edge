# TODO: reorganise generators into edge: namespace
# http://nicksda.apotomo.de/2010/09/getting-a-bloody-rails-3-generator-running-and-testing-it/

require 'rails/generators'

class EdgeGenerator < Rails::Generators::Base
  source_root File.expand_path(File.join(__FILE__, '../templates'))
  desc "Installs Edge"
  
  def create_default_routes
    route "edge_defaults :admin, :assets, :content"
  end
  
  def copy_javascripts
    copy_file 'edge.config.js', 'app/assets/javascripts/admin/edge.config.js'
    directory 'tiny_mce', 'public/javascripts/tiny_mce'
    directory 'migrations', 'db/migrate'
  end
  
  def copy_migrations
    # TODO
  end
end