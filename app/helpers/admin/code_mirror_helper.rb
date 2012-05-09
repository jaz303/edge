module Admin::CodeMirrorHelper
  def code_mirror_asset_tags
    html = <<-CODE
#{javascript_include_tag('admin/codemirror/index')}
#{stylesheet_link_tag('admin/codemirror/index')}
    CODE
    html.html_safe
  end
  
  def using_code_mirror?
    !! @__use_codemirror
  end
  
  def use_code_mirror!(options = {})
    @__use_codemirror = true
  end
  
  def code_mirror_editor_tag(name, value = '', options = {})
    use_code_mirror!
    
    options = {:theme => 'blackboard', :lineNumbers => 2}.merge(options)
    
    text_area_tag(name, value || '', 'class'                    => 'code-mirror',
                                     'data-code-mirror-config'  => options.to_json)
  end
end