require 'mime/types'

class File < ActiveRecord::Base
  self.include_root_in_json = true
  
  WEB_SAFE_IMAGE_TYPES  = %w(image/jpeg image/gif image/png)
  PDF_TYPES             = %w(application/pdf)
  AUDIO_TYPES           = %w(audio/mpeg audio/ogg audio/vorbis audio/x-wav)
  FLASH_VIDEO_TYPES     = %w(video/x-flv)
  FLASH_TYPES           = %w(application/x-shockwave-flash)
  TEXT_TYPES            = %w(text/plain text/javascript text/css text/html)
  INLINE_TYPES          = WEB_SAFE_IMAGE_TYPES + PDF_TYPES + FLASH_TYPES + TEXT_TYPES
  
  belongs_to :folder, :class_name => 'FileFolder', :foreign_key => :folder_id
  
  has_attached_file :file
  validates_attachment_presence :file
  
  has_attached_file :thumbnail
  
  validates_presence_of :name
  
  before_validation :infer_mime_type
  before_validation :set_name_from_filename_if_blank
  
  def title;      name;     end
  def file_id;    id;       end
  
  def filename;       file_file_name;       end
  def content_type;   file_content_type;    end
  
  def type_matches?(*types)
    types.each do |t|
      if t.respond_to?(:include?) && t.include?(file_content_type)
        return true
      elsif t == file_content_type
        return true
      end
    end
    false
  end
  
  def audio?;             type_matches?(AUDIO_TYPES);                         end
  def web_safe_image?;    type_matches?(WEB_SAFE_IMAGE_TYPES);                end
  def flash_video?;       type_matches?(FLASH_VIDEO_TYPES);                   end
  def flash?;             type_matches?(FLASH_TYPES);                         end
  def inline?;            type_matches?(INLINE_TYPES);                        end
  
  def has_thumbnail?
    thumbnail_file_name.present?
  end
  
private

  def infer_mime_type
    if file_content_type.blank? || file_content_type == 'application/octet-stream'
      types = MIME::Types.type_for(file_file_name)
      if types.any?
        self.file_content_type = types.first.to_s
      end
    end
  end

  def set_name_from_filename_if_blank
    if name.blank?
      self.name = file_file_name.gsub(/\.[^\.]*$/, '') \
                                .gsub(/_+/, ' ') \
                                .strip \
                                .titleize
    end
  end
end
