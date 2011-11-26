module Edge
  class Application
    attr_reader :admin_config
    
    def initialize(rails_config)
      @rails_config = rails_config
      @admin_config = ::Edge::Admin::Config.new
    end
  end
end