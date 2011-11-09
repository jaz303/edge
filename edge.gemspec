Gem::Specification.new do |s|
  s.name = "edge"
  s.date = "2011-11-09"
  s.version = "0.0.1"
  s.author = "Jason Frame"
  s.email = "jason@onehackoranother.com"
  s.platform = Gem::Platform::RUBY
  s.summary = "..."
  
  # s.add_dependency 'activesupport', '>= 3.0.3', '< 3.1'
  # s.add_dependency 'activerecord', '>= 3.0.3', '< 3.1'
  # s.add_dependency 'mongrel'
  # s.add_dependency 'rack'
  # s.add_dependency 'rack-contrib'
  # s.add_dependency 'sinatra'
  # s.add_dependency 'json'
  # s.add_dependency 'fastthread'
  
  assets  = Dir["assets/**/*"]
  
  bin     = Dir["bin/*"]
  db      = Dir["db/**/*.rb"]
  lib     = Dir["lib/**/*.rb"]
  vendor  = Dir["vendor/**/*"]
  s.files = bin + db + lib + vendor
  
  s.has_rdoc = false
end