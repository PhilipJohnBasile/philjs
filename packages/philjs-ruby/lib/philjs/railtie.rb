module PhilJS
  class Railtie < Rails::Railtie
    initializer "philjs.configure" do |app|
      app.middleware.use PhilJS::Middleware
    end
  end

  class Middleware
    def initialize(app)
      @app = app
    end

    def call(env)
      # Skip API requests
      if env["PATH_INFO"].start_with?("/api")
        return @app.call(env)
      end

      # Try to serve static file from public/
      path = Rails.root.join("public", env["PATH_INFO"].sub(/^\//, ""))
      if File.exist?(path) && !File.directory?(path)
        return [200, { "Content-Type" => MIME::Types.type_for(path.to_s).first.content_type }, [File.read(path)]]
      end

      # Fallback to index.html for client-side routing
      index_path = Rails.root.join("public", "index.html")
      if File.exist?(index_path)
        [200, { "Content-Type" => "text/html" }, [File.read(index_path)]]
      else
        @app.call(env)
      end
    end
  end
end
