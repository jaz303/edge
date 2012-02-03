require 'acts_as_tree'

module ActsAsTree
  module ClassMethods
    public
    
    def child_map(order = 'id ASC')
      find(:all, :order => order).inject({}) do |memo, item|
        memo[item.parent_id] ||= []
        memo[item.parent_id] << item
        memo
      end
    end
    
    def indent(order = 'id ASC')
      out = []
      perform_indent(nil, 0, child_map(order), out)
      out
    end
  
    private
  
    def perform_indent(parent_id, depth, children, memo)
      if children[parent_id]
        children[parent_id].each do |node|
          memo << [depth, node]
          perform_indent(node.id, depth + 1, children, memo)
        end
      end
    end
  end
  
  module InstanceMethods
    def root?
      parent_id.nil?
    end
  end
end