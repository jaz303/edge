class Admin::AdminGroupsController < Admin::BaseController
  section_path :system, :admin_groups
  crud :find => {:scope => :public}
end