module Edge
  module ActionController
    module Robots
      def self.included(base)
        base.extend(ClassMethods)
        base.__send__(:include, InstanceMethods)
      end
      
      module InstanceMethods
        def robots(*commands)
          response.headers['X-Robots-Tag'] = (commands.map(&:to_s) & %w(noarchive noindex nosnippet)).join(', ')
        end
        
        def unavailable_after(date)
          response.headers['X-Robots-Tag'] = "unavailable_after: #{date.to_s(:rfc822)}"
        end
      end
      
      module ClassMethods
        def robots(*commands)
          filter_options = commands.extract_options!
          before_filter(filter_options) { |ctl| ctl.robots(*commands) }
        end
        
        def unavailable_after(date, filter_options = {})
          before_filter(filter_options) { |ctl| ctl.unavailable_after(date) }
        end
      end
    end
  end
end

ActionController::Base.send(:include, Edge::ActionController::Robots)