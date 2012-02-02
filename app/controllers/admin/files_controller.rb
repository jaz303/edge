class Admin::FilesController < Admin::BaseController
  skip_before_filter :verify_authenticity_token
  
  def dialog
    render :layout => false
  end
  
  def list
    
    parent_id = params[:parent_id]
    parent_id = nil if parent_id.blank? || parent_id == 'null'
    
    @output = FileFolder.find(:all,
                              :order => 'name',
                              :conditions => {:parent_id => parent_id}) +
              UploadedFile.find(:all, 
                                :order => 'name',
                                :conditions => {:folder_id => parent_id})
    
    respond_to do |wants|
      wants.html
      wants.json {
        structure = { 'entries' => @output }
        
        if parent_id
          parent = FileFolder.find(parent_id)
          structure['path']      = parent.ancestors.reverse.concat([parent])
          structure['parent_id'] = parent.parent_id
        end
        
        render :json => structure
      }
    end
    
  end
  
  def folders
    render :json => FileFolder.indent
  end
  
  def delete
    if request.post?
      (params[:asset_ids] || []).each { |a| UploadedFile.destroy(a) }
      (params[:folder_ids] || []).each { |f| FileFolder.destroy(f) }
    end
    render :nothing => true
  end

  def create
    if request.post?
      @asset = UploadedFile.new(params[:asset])
      @asset.folder_id = params[:folder_id]
      @asset.description ||= ''
      @asset.name = @asset.filename if @asset.name.blank?
      respond_to do |format|
        if @asset.save
          # Have to return :status => :ok here rather than the usual :created because
          # flash won't pass the data to upload_success_handler unless the response is 200
          format.json { render :json => @asset, :status => :ok }
        else
          format.json { render :json => @asset.errors, :status => :unprocessable_entity }
        end
      end
    end
  end
  
  def create_thumbnail
    if request.post?
      @asset = UploadedFile.find(params[:id])
      
      UploadedFile.transaction do
      
        @thumbnail              = UploadedFile.new(params[:asset])
        @thumbnail.is_thumbnail = true
        @thumbnail.name         = @thumbnail.filename if @thumbnail.name.blank?        
        @thumbnail.save!
      
        @asset.thumbnail = @thumbnail
        @asset.save!
      
        respond_to do |format|
          format.json { render :json => @asset, :status => :ok }
        end
      
      end
      
    end
  end
  
  def update
    if request.post?
      @asset = UploadedFile.find(params[:id])
      @asset.attributes = params[:asset]
      respond_to do |format|
        if @asset.save
          format.json { render :json => @asset }
        else
          format.json { render :json => @asset.errors, :status => :unprocessable_entity }
        end
      end
    end
  end
  
  def move
    @assets   = UploadedFile.find(params[:asset_ids] || [])
    @folders  = FileFolder.find(params[:folder_ids] || [])
    @target   = FileFolder.find(params[:target_folder_id])
    
    if request.post?      
      @assets.each  { |a| a.update_attributes(:folder_id => @target.id) }
      @folders.each { |f| f.update_attributes(:parent_id => @target.id) }
      render :json => true
    end
  end
  
  def create_folder
    if request.post?
      FileFolder.create!(params[:folder])
      render :nothing => true
    end
  rescue ActiveRecord::RecordInvalid
    render :nothing => true, :status => :error
  end
  
end