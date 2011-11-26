class AssetFolder < ActiveRecord::Base
  self.include_root_in_json = true
  
  acts_as_tree
  
  validates_presence_of :name
  validates_format_of :name, :with => /^[^\/]+$/
  validates_uniqueness_of :name, :scope => :parent_id
  before_validation { |me| me.name = me.name.strip }
  
  has_many :assets, :foreign_key => :folder_id, :dependent => :destroy
  
  def path
    ancestors.reverse.concat([self])
  end
  
  validate :validate_new_parent_is_not_descendant
  
  private
  
  def validate_new_parent_is_not_descendant
    if !new_record? && parent_id_changed?
      
      v = self
      while (v = v.parent)
        if(v.parent_id == id)
          errors.add(:parent_id)
          break
        end
      end
    
    end
  end
  
end
