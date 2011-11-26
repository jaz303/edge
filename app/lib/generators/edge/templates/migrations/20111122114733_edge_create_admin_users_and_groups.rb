class EdgeCreateAdminUsersAndGroups < ActiveRecord::Migration
  def change
    create_table :admin_users do |t|
      t.column :username, :string, :null => false
      t.column :email, :string, :null => false
      t.column :forename, :string, :null => false
      t.column :surname, :string, :null => false
      t.column :password_digest, :string
      t.column :super_user, :boolean, :default => false
      t.column :active, :boolean, :default => true
      t.timestamps
    end
    
    add_index :admin_users, :username, :unique => true
    add_index :admin_users, :email, :unique => true
    
    create_table :admin_groups do |t|
      t.column :name, :string, :null => false
      t.column :comment, :string, :null => false, :default => ''
      t.column :user_id, :integer, :null => true
    end
    
    add_index :admin_groups, :user_id
    
    create_table :admin_groups_admin_users, :id => false do |t|
      t.column :admin_user_id, :integer, :null => false
      t.column :admin_group_id, :integer, :null => false
    end
    
    execute("ALTER TABLE
               admin_groups_admin_users
               ADD PRIMARY KEY (admin_user_id, admin_group_id)")
  end
end
