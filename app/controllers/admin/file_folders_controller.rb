class Admin::FileFoldersController < Admin::BaseController
  def index
    render :json => FileFolder.all
  end
  
  def create
    folder = FileFolder.new(params[:file_folder])
    folder.save!
    render :json => folder
  rescue => e
    render :json => [false], :status => (folder.valid? ? 500 : 400)
  end
  
  def destroy
    folder = FileFolder.find(params[:file_folder])
    folder.destroy
  end
end