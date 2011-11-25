require 'ipaddr'

class Admin::BaseController < ApplicationController
  include ::Edge::ControllerMethods
  include ::Edge::Admin::Crud
  
  layout 'admin/main'
  
  helper 'admin/base'
  helper 'admin/form'
  helper 'admin/list_view'
  helper 'edge/icon'
  helper 'edge/tiny_mce'
  
  helper_method :admin_title, :admin_subtitle
  helper_method :set_admin_title, :set_admin_subtitle
  
  before_filter :require_logged_in_admin

private

  def admin_title
    @admin_title
  end
  
  def admin_subtitle
    @admin_subtitle
  end
  
  def set_admin_title(title, subtitle = '')
    @admin_title = title
    set_admin_subtitle(subtitle)
  end
  
  def set_admin_subtitle(subtitle)
    @admin_subtitle = subtitle
  end
  
  def set_logged_in_admin(admin)
    perform_login(admin, session) unless admin.id == session[:edge_admin_id]
  end
  
  def unset_logged_in_admin
    perform_logout(session)
  end
  
  def perform_login(admin, session)
    session[:edge_admin_id] = admin.id
  end
  
  def perform_logout(session)
    session[:edge_admin_id] = nil
  end
  
  def require_logged_in_admin
    redirect_to(new_admin_session_url) unless admin_logged_in?
  end
end