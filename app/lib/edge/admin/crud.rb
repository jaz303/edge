module Edge::Admin::Crud
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    def crud(options = {}, &block)
      Builder.new(self, options, &block)
    end
  end
  
  module InstanceMethods
  private
    
    def default_per_page
      per_page_options[1]
    end
    
    def paginating?
      !!per_page
    end
    
    def per_page
      unless defined?(@per_page)
        @per_page = params[:per_page] || default_per_page
        @per_page = nil if @per_page.to_s.downcase == 'all'
      end
      @per_page
    end
    
    def per_page_options
      ['all', 10, 25, 50, 100]
    end
    
    def paginate(scope)
      if per_page
        scope.paginate(:page => params[:page], :per_page => per_page)
      else
        scope
      end
    end
  end
  
  class Builder
    attr_reader :c, :includes
    
    def initialize(klass, options, &block)
      @c, @options = klass, options
      parse_options!
      yield self if block_given?
      apply!
    end
    
    def model_class
      unless defined?(@model_class)
        @model_class = @options[:model_class] || c.to_s.split('::').pop.gsub(/Controller$/, '').singularize.constantize
      end
      @model_class
    end
    
    def object_var
      @options[:object_var] || model_class.to_s.underscore
    end
    
    def collection_var
      @options[:collection_var] || object_var.pluralize
    end
    
  private
    
    def parse_options!
      @options[:find] ||= {}
      @options[:find][:scope] ||= :all
      
      [:only, :except].each do |key|
        if @options.key?(key)
          @options[key] = Array(@options[key]).map { |m| m.to_sym }
        end
      end
    end
    
    def define_method?(method_name)
      return false if @options[:only] && !@options[:only].include?(method_name)
      return false if @options[:except] && @options[:except].include?(method_name)
      true
    end
    
    def apply!
      
      builder = self
      
      c.__send__(:include, InstanceMethods)
      c.class_eval do
        helper_method :per_page_options
        helper_method :per_page
        helper_method :paginating?
        helper_method :model_class
      end
      
      c.__send__(:define_method, :model_class) do
        builder.model_class
      end
      
      builder         = self
      options         = @options
      model_class     = self.model_class
      object_var      = self.object_var
      collection_var  = self.collection_var
      
      if define_method?(:index)
        c.send(:define_method, :index) do
          set_admin_title("List #{model_class.describe_plural.titleize}")
          scope = model_class
          scope = scope.send(options[:find][:scope]) unless options[:find][:scope] == :all
          collection = paginate(scope).all
          instance_variable_set("@#{collection_var}", collection)
        end
      end
      
      if define_method?(:new)
        c.send(:define_method, :new) do
          set_admin_title("Create New #{model_class.describe.titleize}")
          instance_variable_set("@#{object_var}", model_class.new)
        end
      end
      
      if define_method?(:create)
        c.send(:define_method, :create) do
          object = model_class.new(params[object_var])
          instance_variable_set("@#{object_var}", object)
          if object.save
            flash[:success] = "Object <b>#{object.describe}</b> created successfully"
            redirect_to :action => 'index'
          else
            set_admin_title("Create New #{model_class.describe.titleize}")
            render :action => 'new'
          end
        end
      end
      
      if define_method?(:edit)
        c.send(:define_method, :edit) do
          object = model_class.find(params[:id])
          set_admin_title("Edit #{model_class.describe.titleize}", object.describe)
          instance_variable_set("@#{object_var}", object)
        end
      end
      
      if define_method?(:update)
        c.send(:define_method, :update) do
          object = model_class.find(params[:id])
          object.attributes = params[object_var]
          instance_variable_set("@#{object_var}", object)
          if object.save
            flash[:success] = "Object <b>#{object.describe}</b> updated successfully"
            redirect_to :action => 'index'
          else
            set_admin_title("Edit #{model_class.describe.titleize}", object.describe)
            render :action => 'edit'
          end
        end
      end
      
      if define_method?(:delete)
        c.send(:define_method, :delete) do
          object = model_class.find(params[:id])
          set_admin_title("Delete #{model_class.describe.titleize}", object.describe)
          instance_variable_set("@#{object_var}", object)
        end
      end
      
      if define_method?(:destroy)
        c.send(:define_method, :destroy) do
          object = model_class.find(params[:id])
          instance_variable_set("@#{object_var}", object)
          if object.destroy
            flash[:success] = "Object <b>#{object.describe}</b> deleted successfully"
            redirect_to :action => 'index'
          else
            set_admin_title("Delete #{model_class.describe.titleize}", object.describe)
            render :action => 'delete'
          end
        end
      end
      
    end
  end
end