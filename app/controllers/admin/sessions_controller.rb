class Admin::SessionsController < Admin::BaseController
  skip_before_filter :require_logged_in_admin, :only => [:new, :create]
  
  layout false
  
  def new
  end
  
  def create
    user = AdminUser.authenticate(params[:session][:username], params[:session][:password])
    @username = params[:session][:username]
    if user
      if user.can_login?
        set_logged_in_admin user
        flash[:success] = 'Login successful'
        redirect_to admin_dashboard_url
      else
        flash[:error] = 'This account has been disabled'
      end
    else
      flash[:error] = 'Incorrect username/password'
    end
    render :action => 'new' unless performed?
  end
  
  def logout
    unset_logged_in_admin
    redirect_to new_admin_session_url
  end
end