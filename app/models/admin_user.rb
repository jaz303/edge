class AdminUser < ActiveRecord::Base
  default_scope :order => 'username ASC'
  
  scope :active, :conditions => {:active => true}
  scope :super_users, :conditions => {:super_user => true}
  
  scope :text_search, lambda { |text|
    { :conditions => [
        'username LIKE :text OR forename LIKE :text
          OR surname LIKE :text OR email LIKE :text',
        { :text =>"%#{text}%" }
      ],
      :order => 'username ASC'
    }
  }
  
  validates_format_of :username, :with => /^[a-z][a-z0-9_-]{2,}$/
  validates_uniqueness_of :username
  
  has_secure_password
  
  def self.authenticate(username, password)
    find_by_username(username).try(:authenticate, password)
  end
  
  validates_format_of :email, :with => /^[^@\s]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i
  validates_uniqueness_of :email
  
  validates_presence_of :forename, :surname
  def full_name; "#{forename} #{surname}"; end
  
  def can_login?
    active?
  end
  
  has_and_belongs_to_many :public_groups, :class_name => "AdminGroup"
  has_one :personal_group, :class_name=> "AdminGroup", :foreign_key => "user_id", :dependent => :destroy
  after_create { |u| u.create_personal_group(:name => "(user #{u.id} - personal group)") }
  
  def all_groups
    [*public_groups, personal_group].compact
  end
  
  def describe_saved_object
    full_name
  end
end
