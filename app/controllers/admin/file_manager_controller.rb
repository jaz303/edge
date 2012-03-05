class Admin::FileManagerController < Admin::BaseController
  skip_before_filter :verify_authenticity_token
  
  def list
    parent_id = params[:parent_id].blank? ? nil : params[:parent_id]
    folders   = FileFolder.find(:all, :order => 'name', :conditions => {:parent_id => parent_id})
    files     = UploadedFile.find(:all, :order => 'name', :conditions => {:folder_id => parent_id})
    
    respond_to do |wants|
      wants.json do
        result = {'entries' => folders + files}
        
        unless parent_id.blank?
          parent              = FileFolder.find(parent_id)
          result['path']      = parent.ancestors.reverse.concat([parent])
          result['parent_id'] = parent.parent_id
        end
        
        render :json => result
      end
    end
  end
  
  def folder_list
    render :json => FileFolder.indent
  end
  
  def show_file
    render :json => UploadedFile.find(params[:id])
  end
  
  def delete
    (params[:uploaded_file_ids] || []).each { |a| UploadedFile.destroy(a) }
    (params[:file_folder_ids]   || []).each { |f| FileFolder.destroy(f)   }
    
    json_success
  end
  
  def move
    assets    = UploadedFile.find(params[:uploaded_file_ids] || [])
    folders   = FileFolder.find(params[:file_folder_ids] || [])
    
    target_id = params[:target_folder_id]
    if target_id
      target = FileFolder.find(target_id)
      target_id = target.id
    end
    
    assets.each  { |a| a.update_attributes(:folder_id => target_id) }
    folders.each { |f| f.update_attributes(:parent_id => target_id) }
    
    json_success
  end
  
  def create_file
    asset = UploadedFile.new(params[:uploaded_file])
    asset.save!
    # don't use respond_to here because of swfupload
    render :json => asset
  rescue => e
    json_error(:object => asset)
  end
  
  def create_folder
    folder = FileFolder.new(params[:file_folder])
    folder.save!
    render :json => folder
  rescue => e
    json_error(:message => "Error saving folder", :object => folder)
  end
  
  def update_file
    asset = UploadedFile.find(params[:id])
    asset.attributes = params[:uploaded_file]
    asset.save!
    render :json => asset
  rescue => e
    json_error :object => asset
  end
  
  def update_folder
    folder = FileFolder.find(params[:id])
    folder.attributes = params[:folder]
    folder.save!
    respond_to do |format|
      format.json { json_success }
    end
  rescue => e
    respond_to do |format|
      format.json { json_error(:object => folder) }
    end
  end
  
private

  # json_success and json_error should probably be hoisted out to Admin::BaseController

  def json_success
    render :json => [true]
  end

  def json_error(options = {})
    options[:message] ||= 'An unspecified error occurred'
    
    status = options.delete(:status)
    object = options.delete(:object)
    
    if object && !object.valid?
      status ||= :unprocessable_entity
      # TODO: put validation error messages in options
    end
    
    status ||= :error
    
    render :json => { :error => options }, :status => status
  end
end