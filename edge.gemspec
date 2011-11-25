Gem::Specification.new do |s|
  s.name = "edge"
  s.date = "2011-11-09"
  s.version = "0.0.1"
  s.author = "Jason Frame"
  s.email = "jason@onehackoranother.com"
  s.platform = Gem::Platform::RUBY
  s.summary = "..."
  
  s.add_dependency 'bcrypt-ruby'
  s.add_dependency 'will_paginate'
  
  bin     = Dir["bin/*"]
  db      = Dir["db/**/*.rb"]
  lib     = Dir["lib/**/*.rb"]
  vendor  = Dir["vendor/**/*"]
  s.files = bin + db + lib + vendor
  
  s.has_rdoc = false
end