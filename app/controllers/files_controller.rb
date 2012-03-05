class FilesController < ApplicationController
  caches_page :show, :if => lambda { |c| c.instance_variable_get("@image") }
    
  def show;         do_show(:original);                     end
  def thumb;        do_show(:thumb);                        end
  def download;     do_show(:original, :download => true);  end
  
private
  
  def do_show(type, options = {})
    @file   = UploadedFile.find(params[:id])
    @image  = @file.web_safe_image?
    
    if type == :thumb && @file.thumbnail.path.blank? && @image
      type = :original
    end
    
    if type == :thumb
      s_path = @file.thumbnail.path
      s_file = @file.thumbnail_file_name
      s_type = @file.thumbnail_content_type
    else
      s_path = @file.file.path
      s_file = @file.file_file_name
      s_type = @file.file_content_type
    end
    
    unless s_path.present?
      raise ActionController::RoutingError, 'File not found'
    end
    
    s_disposition = (options[:download] || !@file.inline?) ? 'attachment' : 'inline'
    
    if params[:profile] == 'default' || !@image
      send_file(s_path, :filename => s_file, :type => s_type, :disposition  => s_disposition)
    else
      # TODO: 404 if profile not found
      data = EdgeCms::ImageProfile[params[:profile]].apply_to(File.read(s_path))
      send_data(data, :filename => s_file, :type => s_type, :disposition => s_disposition)
      data = nil # superstition driven development
    end
  end
  
  # after_filter :cache_as_is
  # 
  # def as_is_cache_path(path)
  #   returning("#{ActionController::Base.page_cache_directory}#{path}.asis") do |r|
  #     # pointless security check?
  #     raise unless File.expand_path(r).index(ActionController::Base.page_cache_directory) == 0
  #   end
  # end
  # 
  # def cache_as_is
  #   return unless ActionController::Base.perform_caching
  #       
  #   path = request.path
  #   
  #   FileUtils.makedirs(File.dirname(as_is_cache_path(path)))
  #   
  #   File.open(as_is_cache_path(path), 'wb+') do |f|
  #     f.write(response.headers.map { |k,v| "#{k}: #{v}"}.join("\n") + "\n\n")
  #     f.write(response.body)
  #   end
  # end
  # 
end