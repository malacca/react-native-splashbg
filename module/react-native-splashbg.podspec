require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-splashbg"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  react-native-splashbg
                   DESC
  s.homepage     = "https://github.com/malacca/react-native-splashbg"
  s.license      = package['license']
  s.authors      = package['author']
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/malacca/react-native-splashbg.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,c,cc,cpp,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React"

  # s.dependency "..."
end

