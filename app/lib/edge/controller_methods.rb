module Edge
  module ControllerMethods
    def self.included(base)
      base.extend(ClassMethods)
      base.send(:include, InstanceMethods)
      base.class_eval do
        helper_method :admin_logged_in?
        helper_method :admin_is_super_user?
        helper_method :administrator
      end
    end
    
    module ClassMethods
    end
    
    module InstanceMethods
      private
      
      def admin_logged_in?
        !! session[:edge_admin_id]
      end
      
      def admin_is_super_user?
        administrator.try(:super_user?)
      end
      
      def administrator
        unless defined?(@edge_admin)
          @edge_admin = AdminUser.find(:first, session[:edge_admin_id])
        end
        @edge_admin
      end
      
      def render_not_found
        render :status => :not_found, :file => File.join(Rails.root, 'public', '404.html')
      end
    end
  end
end