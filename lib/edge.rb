EDGE_ROOT = File.expand_path(File.dirname(__FILE__) + '/..')

Dir["#{EDGE_ROOT}/monkeys/*.rb"].each { |monkey| require monkey }

require 'will_paginate'
require 'will_paginate/active_record'
require 'will_paginate/view_helpers'

module Edge
  @@instance = nil
  
  def self.application
    @@instance
  end
  
  class Railtie < Rails::Engine
    initializer("edge.init") do |app|
      ::Edge.__send__(:set_application, @@instance = ::Edge::Application.new(app.config))
    end
  end
  
private

  def self.set_application(app)
    @@instance = app
  end
end