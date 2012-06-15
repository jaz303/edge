module FileAssociations
  module ActMethods
    
    def belongs_to_file(*args)
      
      options           = args.extract_options!
      association_name  = args.first.is_a?(Symbol) ? args.shift : :asset
      foreign_key       = options[:foreign_key] || "#{association_name}_id"
      required          = !! options[:required]
      
      #
      # Set up association
      
      options_for_association = {:foreign_key => foreign_key, :class_name => 'UploadedFile'}
      belongs_to association_name, options_for_association
      
      #
      # Required?
      
      validates_presence_of foreign_key if required
      
      if options[:restrict_to]
        restrictions  = [options[:restrict_to]].flatten
        restrictions += %w(image/jpeg image/pjpeg image/gif image/png) if restrictions.delete(:image)
        restrictions += %w(video/x-flv) if restrictions.delete(:flash_video)
        validate do |me|
          if asset = me.send(association_name)
            unless restrictions.include?(asset.content_type)
              me.errors.add(association_name, 'is not a valid type')
            end
          end
        end
      end
      
    end
    
    # def has_many_assets
    #   has_many :asset_linkings, :as => :linked_model, :dependent => :destroy, :order => "asset_linkings.position ASC"
    #   has_many :assets, :through => :asset_linkings, :order => "asset_linkings.position ASC"
    #   
    #   class_eval <<-CODE
    #     def asset_ids=(*ids)
    #       assets.clear
    #       return if ids.length == 1 && ids.first.blank?
    #       [ids].flatten.each_with_index do |asset_id, i|
    #         self.assets << Asset.find(asset_id)
    #       end
    #     end
    #   CODE
    # end
    
  end
end

ActiveRecord::Base.extend(FileAssociations::ActMethods)