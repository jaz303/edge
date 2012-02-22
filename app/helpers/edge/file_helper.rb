module Edge
  module FileHelper
    def resolve_file(file)
      if file.nil? || file.is_a?(UploadedFile)
        file
      else
        UploadedFile.find(file) rescue nil
      end
    end
    
    def path_for_file(file, profile = nil)
      return '' if file.nil?
      params = {:id => file}
      params[:profile] = profile unless profile.nil?
      file_path(file)
    end
    
    def path_for_file_thumb(file, profile = nil)
      return '' if file.nil?
      params = {:id => file}
      params[:profile] = profile unless profile.nil?
      file_thumb_path(file)
    end
    
    def path_for_file_download(file)
      return '' if file.nil?
      file_download_path(file)
    end
    
    def file_image_tag(file, options = {})
      file = resolve_file(file) if false # TODO: config value for asset resolution
      return '' if file.blank?
      
      options = {:profile => options} if options.is_a?(String)
      options[:alt] = file.alt_text.to_s if file.is_a?(UploadedFle)
      profile = options.delete(:profile)
      
      image_tag(file_path(:id => file, :profile => profile), options)
    end
    
    def file_thumb_image_tag(file, options = {})
      file = resolve_file(file) if false # TODO: config value for asset resolution
      return '' if file.blank?
      
      options = {:profile => options} if options.is_a?(String)
      options[:alt] = file.alt_text.to_s if file.is_a?(UploadedFle)
      profile = options.delete(:profile)
      
      image_tag(file_thumb_path(:id => file, :profile => profile), options)
    end

    #
    # Type Icons

    # TODO: this table should be extended to include MIME types
    # TODO: use this table to auto-generate the Javascript version
    FILE_ICON_EXTENSIONS = {

      # executables
      'com'   => :application,
      'exe'   => :application,
      'bat'   => :application,
      'sh'    => :application_terminal,

      # code
      'h'     => :blue_document_code,
      'c'     => :blue_document_code,
      'cpp'   => :blue_document_code,
      'cs'    => :blue_document_code,
      'php'   => :blue_document_php,
      'rb'    => :blue_document_code,
      'rhtml' => :blue_document_code,
      'cfm'   => :blue_document_code,
      'as'    => :blue_document_code,
      'html'  => :blue_document_code,
      'xml'   => :blue_document_code,
      'java'  => :blue_document_code,
      'sql'   => :blue_document_code,

      # editable images
      'jpg'   => :image,
      'jpeg'  => :image,
      'gif'   => :image,
      'png'   => :image,

      # other images
      'bmp'   => :blue_document_image,
      'psd'   => :blue_document_photoshop,
      'tif'   => :blue_document_image,
      'tiff'  => :blue_document_image,
      'ai'    => :blue_document_illustrator,

      # documents
      'ppt'   => :blue_document_powerpoint,
      'pdf'   => :blue_document_pdf_text,
      'xls'   => :blue_document_excel_table,
      'doc'   => :blue_document_word_text,
      'mdb'   => :blue_document_access,
      'fla'   => :blue_document_flash,
      'swf'   => :blue_document_flash_movie,
      'txt'   => :blue_document_text,
      'pst'   => :blue_document_outlook,

      # archives
      'zip'   => :blue_document_zipper,
      'gz'    => :blue_document_zipper,
      'bz2'   => :blue_document_zipper,
      'tar'   => :blue_document_zipper,
      'iso'   => :disc,

      # urls
      'url'   => :blue_document_globe,
      'webloc'=> :blue_document_globe,

      # audio
      'wav'   => :blue_document_music,
      'aiff'  => :blue_document_music,
      'aif'   => :blue_document_music,
      'mp3'   => :blue_document_music,
      'ogg'   => :blue_document_music,
      'pls'   => :blue_document_music_playlist,

      # video

      'wmv'   => :blue_document_film,
      'mpg'   => :blue_document_film,
      'mpeg'  => :blue_document_film,
      'avi'   => :blue_document_film,
      'mov'   => :blue_document_film,

      # binary

      'bin'   => :blue_document_binary

    }.freeze

    FILE_ICON_DEFAULT = :blue_document

    def file_icon_name(file_or_filename)
      if file_or_filename.is_a?(UploadedFile)
        filename = file_or_filename.file_file_name
      else
        filename = file_or_filename.to_s
      end
      FILE_ICON_EXTENSIONS[File.extname(filename)[1..-1]] || FILE_ICON_DEFAULT
    end

    def file_icon_path(file_or_filename)
      image_path(icon_path(file_icon_name(filename)))
    end

    def file_icon(file_or_filename, options = {})
      return '' if file_or_filename.blank?
      icon(file_icon_name(file_or_filename), options)
    end
  end
end
