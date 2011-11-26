class EdgeCreateAssets < ActiveRecord::Migration
  def change
    create_table :asset_folders do |t|
      t.string :name, :null => false
      t.references :parent, :null => true
    end
    
    create_table :assets do |t|
      t.column :folder_id, :integer, :null => true
      
      t.column :name, :string, :null => false, :default => ''
      t.column :description, :text, :null => false, :default => ''
      t.column :alt_text, :string, :null => false, :default => ''
      t.column :width, :integer, :null => true
      t.column :height, :integer, :null => true
      
      t.column :file_file_name, :string
      t.column :file_content_type, :string
      t.column :file_file_size, :integer
      t.column :file_updated_at, :datetime
      
      t.column :thumbnail_file_name, :string
      t.column :thumbnail_content_type, :string
      t.column :thumbnail_file_size, :integer
      t.column :thumbnail_updated_at, :datetime
      
      t.timestamps
    end
    
    add_index :assets, :folder_id
  end
end
