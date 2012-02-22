class EdgeCreateNodes < ActiveRecord::Migration
  def change
    create_table :collections do |t|
      t.string :title, :null => false
      t.string :collection_type, :null => false
      
      t.boolean :is_site, :null => false, :default => false
      t.string :site_domain_list, :null => false
      t.boolean :default_site, :null => false, :default => false
    end
    
    create_table :nodes do |t|
      t.integer :collection_id, :null => false
      
      t.string :title, :null => false, :default => ''
      t.string :subtitle, :null => false, :default => ''
      
      # TODO: summary text
      # TODO: summary image
      
      t.string :child_sort_order, :null => false
      
      t.datetime :update_time, :null => false
      t.datetime :publish_time, :null => false
      t.datetime :display_time, :null => false
      
      t.string :slug, :null => false, :default => ''
      t.string :url, :null => false, :default => ''
      t.boolean :url_is_custom, :null => false, :default => false
      
      t.string :redirect_url, :null => true
      t.integer :redirect_code, :null => true
      
      t.boolean :show_in_menu, :null => false, :default => true
      t.boolean :show_in_site_map, :null => false, :default => true
      t.boolean :visible, :null => false, :default => true
      
      t.integer :position
      
      t.integer :parent_id
      t.integer :lft
      t.integer :rgt
      t.integer :depth
    end
    
    add_index :nodes, [:site_id, :url], :unique => true
  end
end
