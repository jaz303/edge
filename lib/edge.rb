EDGE_ROOT = File.expand_path(File.dirname(__FILE__) + '/..')

Dir["#{EDGE_ROOT}/monkeys/*.rb"].each { |monkey| require monkey }

require 'will_paginate'
require 'will_paginate/active_record'
require 'will_paginate/view_helpers'

module Edge
  class Railtie < Rails::Engine
    # initializer "edge.configure_rails_initialization" do |app|
    #   app.config.assets.paths << File.join(EDGE_ROOT, 'vendor', 'assets')
    #   p app.config.assets.paths
    # end
  end
end