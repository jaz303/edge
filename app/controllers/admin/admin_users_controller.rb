class Admin::AdminUsersController < Admin::BaseController
  section_path :system, :admin_users
  crud
end