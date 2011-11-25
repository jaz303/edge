class AdminGroup < ActiveRecord::Base
  scope :user, :conditions => 'user_id IS NOT NULL'
  scope :public, :conditions => {:user_id => nil}, :order => 'name'
  
  has_and_belongs_to_many :users, :class_name => "AdminUser", :order => "surname ASC, forename ASC"
  belongs_to :user, :class_name => "AdminUser", :foreign_key => "user_id"
  
  validates_presence_of :name
  
  def user_group?
    !user_id.nil?
  end
end