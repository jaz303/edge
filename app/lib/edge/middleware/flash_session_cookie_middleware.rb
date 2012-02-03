# git://github.com/lardawge/swfupload-rails-authentication.git

require 'rack/utils'
 
module Edge
  module Middleware
    
    class FlashSessionCookieMiddleware
      def initialize(app)
        @app = app
      end
 
      def call(env)
        if env['HTTP_USER_AGENT'] =~ /^(Adobe|Shockwave) Flash/
          params = ::Rack::Utils.parse_query(env['QUERY_STRING'])
          env['HTTP_COOKIE'] = [ session_key, params[session_key] ].join('=').freeze unless params[session_key].nil?
        end
        @app.call(env)
      end
  
    private

      # lazy load the session key to prevent chiken/egg issues during Rails init
      def session_key
        @session_key ||= ::Rails.application.config.session_options[:key]
      end
    end
    
  end
end