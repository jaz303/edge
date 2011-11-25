if (!edge) var edge = {};
if (!edge.config) edge.config = {};

edge.config.admin = {
    
    datePicker: {
        format: "%d/%m/%Y",
        formatWithTime: "%d/%m/%Y %H:%M"
    },
    
    tinyMCE: {
        defaultOptionSets: ['large', 'advanced'],
        
        optionSets: {
            common: {
                // TODO: add .content class

                script_url: '/javascripts/tiny_mce/tiny_mce.js',

                language: 'en',
                docs_language: 'en',

                theme: 'advanced',
                theme_advanced_layout_manager: 'SimpleLayout',
                theme_advanced_toolbar_location: 'top',
                theme_advanced_toolbar_align: 'left',

                plugin_insertdate_dateFormat: "%d/%m/%Y",
                plugin_insertdate_timeFormat: "%H:%M:%S",
                advlink_styles: "",
                dialog_type: "modal",
                
                //content_css: '/stylesheets/editor.css?3',
                body_class: 'content',

                convert_urls: false,
                relative_urls: false,
                remove_script_host: true,

                font_size_style_values: "xx-small,x-small,small,medium,large,x-large,xx-large",

                cleanup: true,
                extended_valid_elements: "a[name|href|target|title|onclick],hr[class|width|size|noshade]",
                invalid_elements: "script,style",

                verify_css_classes: false,
                verify_html: false
            },

            small: { width: 550, height: 120 },
            large: { width: 550, height: 350 },

            simple: {

            },

            advanced: {
                theme_advanced_buttons1: "print,separator,cut,copy,paste,pastetext,pasteword,selectall,separator,undo,redo,separator,search,replace,separator,insertdate,inserttime,separator,ltr,rtl,separator,forecolor,backcolor,visualaid,separator,code",
                theme_advanced_buttons2: "bullist,numlist,separator,outdent,indent,separator,tablecontrols,separator,advhr,anchor,link,unlink,image,charmap",
                theme_advanced_buttons3: "formatselect,styleselect,separator,bold,italic,underline,strikethrough,separator,sub,sup,separator,justifyleft,justifycenter,justifyright,justifyfull,separator,cleanup,removeformat,separator,help",

                plugins: "table,directionality,searchreplace,print,advhr,advlink,contextmenu,insertdatetime,paste,safari",

                theme_advanced_statusbar_location: "bottom",
                theme_advanced_blockformats: "p,div,h1,h2,h3,h4,h5,h6"
            }
        }
    }
    
};
