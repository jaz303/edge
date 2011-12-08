class ActiveRecord::Base
  def self.set_type_icon(icon)
    class_eval "def self.type_icon; :#{icon}; end"
  end
  
  def self.type_icon
    :table
  end
  
  def self.describe
    self.to_s.underscore.humanize.downcase
  end
  
  def self.describe_plural
    describe.pluralize
  end
  
  def describe
    new_record? ? describe_new_object : describe_saved_object
  end
  
  def describe_new_object
    "new #{self.class.describe}"
  end
  
  def describe_saved_object
    "#{self.class.describe} ##{id}"
  end
  
  def type_icon
    self.class.type_icon
  end
end