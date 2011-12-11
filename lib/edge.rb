EDGE_ROOT = File.expand_path(File.dirname(__FILE__) + '/..')

Dir["#{EDGE_ROOT}/monkeys/*.rb"].each { |monkey| require monkey }

require 'will_paginate'
require 'will_paginate/active_record'
require 'will_paginate/view_helpers'

module Edge
  @@configs = []
  @@instance = nil
  
  def self.configure(&block)
    @@configs << [block, :app]
    nil
  end
  
  def self.configure_admin(&block)
    @@configs << [block, :admin]
    nil
  end
  
  def self.config_blocks
    @@configs
  end
  
  def self.application
    @@instance
  end
  
  class Railtie < Rails::Engine
    
    initializer 'edge.kludge_paperclip_into_active_record' do
      ActiveSupport.on_load :active_record do
        ::Paperclip::Railtie.insert
      end
    end
    
    initializer 'edge.init' do |app|
      app = ::Edge::Application.new(app.config)
      ::Edge.__send__(:set_application, app)
      ::Edge.config_blocks.each do |block|
        block[0].call(block[1] == :app ? app : app.admin_config)
      end
    end
    
  end
  
private

  def self.set_application(app)
    @@instance = app
  end
end