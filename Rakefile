require 'fileutils'

namespace :edge do
  task :compile_icons do
    FileUtils.mkdir_p('vendor/assets/icons')
    { :flags    => 'ext/famfamfam-icons/flags',
      :mini     => 'ext/famfamfam-icons/mini',
      :fugue    => 'ext/fugue-icons/icons'
    }.each do |set, dir|
      Dir["#{dir}/*.{gif,png}"].each do |icon_file|
        target_name = "ico_#{set}_#{File.basename(icon_file).gsub('-', '_').gsub(/_+/, '_')}"
        FileUtils.cp(icon_file, "vendor/assets/icons/#{target_name}")
      end
    end
  end
end
