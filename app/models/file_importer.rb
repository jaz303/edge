class FileImporter
  # Source folder is a filesystem path
  attr_accessor :source_directory
  
  # Target folder is a FileFolder instance, or nil to import to the root
  attr_accessor :target_folder
  
  def import!
    import_folder(@source_directory, @target_folder)
  end

private
  
  def import_folder(source_directory, target_folder)
    Dir["#{source_directory}/*"].each do |file|
      if File.directory?(file)
        new_target = FileFolder.find(:first, :conditions => {
          :name       => File.basename(file),
          :parent_id  => target_folder.id
        })
        if !new_target
          new_target = FileFolder.create!(:parent => target_folder, :name => File.basename(file))
          $stdout.puts "create folder: #{File.basename(file)}"
        end
        import_folder(file, new_target)
      else
        begin
          $stdout.puts "import: #{file}"
          UploadedFile.create!(:folder => target_folder, :file => File.new(file))
        rescue => e
          $stderr.puts "error importing `#{file}` (#{e.message})"
        end
      end
    end
  end
end