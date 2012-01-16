module Edge
  module ActiveRecord
    module KeyValueModel
      module ClassMethods
        def options_for_select(skope = :all)
          self.send(skope).map { |obj| [obj.name, obj.id] }
        end
      end
      
      module ActMethods
        def key_value_model(options = {})
          options = {:slug_required => true}.merge(options)
          
          validates_presence_of :name
          class_eval <<-CODE
            def to_s; name; end
          CODE
        
          if column_names.include?('position')
            acts_as_list
            default_scope :order => 'position ASC'
          else
            default_scope :order => 'name ASC'
          end
        
          if column_names.include?('slug')
            if options[:slug_required]
              validates_presence_of :slug
            end
            
            validates_uniqueness_of :slug, :allow_blank => !options[:slug_required]
            
            class_eval <<-CODE
              def to_param
                slug.blank? ? id : \"#\{id\}-#\{slug\}\"
              end
            CODE
          end
          
          extend ClassMethods
        end
      end
    end
  end
end

ActiveRecord::Base.extend(Edge::ActiveRecord::KeyValueModel::ActMethods)