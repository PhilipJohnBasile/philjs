// Package server provides a high-performance HTTP server for PhilJS applications.
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// Server is the main PhilJS Go server
type Server struct {
	mux         *http.ServeMux
	routes      []route
	middlewares []Middleware
	config      Config
}

// Config holds server configuration
type Config struct {
	Port        int
	Host        string
	SSR         bool
	StaticDir   string
	APIDir      string
	Compress    bool
	HTTP2       bool
	Timeout     time.Duration
	MaxBodySize int64
	CORS        *CORSConfig
	Edge        bool
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	Origins     []string
	Methods     []string
	Headers     []string
	Credentials bool
	MaxAge      int
}

type route struct {
	method  string
	pattern string
	handler HandlerFunc
}

// HandlerFunc is the signature for route handlers
type HandlerFunc func(*Context) error

// Middleware is the signature for middleware functions
type Middleware func(HandlerFunc) HandlerFunc

// New creates a new PhilJS server with default configuration
func New() *Server {
	return &Server{
		mux: http.NewServeMux(),
		config: Config{
			Port:        getEnvInt("PHILJS_PORT", 3000),
			Host:        getEnv("PHILJS_HOST", "0.0.0.0"),
			SSR:         getEnvBool("PHILJS_SSR", true),
			StaticDir:   getEnv("PHILJS_STATIC", ""),
			APIDir:      getEnv("PHILJS_API_DIR", ""),
			Compress:    getEnvBool("PHILJS_COMPRESS", true),
			HTTP2:       getEnvBool("PHILJS_HTTP2", true),
			Timeout:     time.Duration(getEnvInt("PHILJS_TIMEOUT", 30000)) * time.Millisecond,
			MaxBodySize: parseSize(getEnv("PHILJS_MAX_BODY", "10mb")),
			Edge:        getEnvBool("PHILJS_EDGE", false),
		},
	}
}

// WithConfig creates a server with custom configuration
func WithConfig(config Config) *Server {
	s := New()
	s.config = config
	return s
}

// Use adds middleware to the server
func (s *Server) Use(middleware Middleware) {
	s.middlewares = append(s.middlewares, middleware)
}

// Get registers a GET route
func (s *Server) Get(pattern string, handler HandlerFunc) {
	s.addRoute("GET", pattern, handler)
}

// Post registers a POST route
func (s *Server) Post(pattern string, handler HandlerFunc) {
	s.addRoute("POST", pattern, handler)
}

// Put registers a PUT route
func (s *Server) Put(pattern string, handler HandlerFunc) {
	s.addRoute("PUT", pattern, handler)
}

// Delete registers a DELETE route
func (s *Server) Delete(pattern string, handler HandlerFunc) {
	s.addRoute("DELETE", pattern, handler)
}

// Patch registers a PATCH route
func (s *Server) Patch(pattern string, handler HandlerFunc) {
	s.addRoute("PATCH", pattern, handler)
}

// Options registers an OPTIONS route
func (s *Server) Options(pattern string, handler HandlerFunc) {
	s.addRoute("OPTIONS", pattern, handler)
}

// Head registers a HEAD route
func (s *Server) Head(pattern string, handler HandlerFunc) {
	s.addRoute("HEAD", pattern, handler)
}

func (s *Server) addRoute(method, pattern string, handler HandlerFunc) {
	s.routes = append(s.routes, route{
		method:  method,
		pattern: pattern,
		handler: handler,
	})
}

// Start starts the HTTP server
func (s *Server) Start() error {
	// Setup routes
	s.setupRoutes()

	// Setup static file serving
	if s.config.StaticDir != "" {
		s.mux.Handle("/", http.FileServer(http.Dir(s.config.StaticDir)))
	}

	// Health check endpoint
	s.mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      s.mux,
		ReadTimeout:  s.config.Timeout,
		WriteTimeout: s.config.Timeout,
		IdleTimeout:  s.config.Timeout * 2,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("PhilJS Go server starting on %s", addr)
	return server.ListenAndServe()
}

func (s *Server) setupRoutes() {
	for _, r := range s.routes {
		pattern := r.pattern
		method := r.method
		handler := r.handler

		// Apply middleware
		for i := len(s.middlewares) - 1; i >= 0; i-- {
			handler = s.middlewares[i](handler)
		}

		s.mux.HandleFunc(pattern, func(w http.ResponseWriter, req *http.Request) {
			// Method check
			if req.Method != method && method != "*" {
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
				return
			}

			// Create context
			ctx := &Context{
				Request:  req,
				Response: w,
				params:   make(map[string]string),
			}

			// Parse route params
			ctx.parseParams(pattern, req.URL.Path)

			// Execute handler
			if err := handler(ctx); err != nil {
				ctx.Error(http.StatusInternalServerError, err.Error())
			}
		})
	}
}

// Helper functions

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return strings.ToLower(value) == "true" || value == "1"
	}
	return defaultValue
}

func parseSize(s string) int64 {
	s = strings.ToLower(strings.TrimSpace(s))
	multiplier := int64(1)

	if strings.HasSuffix(s, "kb") {
		multiplier = 1024
		s = strings.TrimSuffix(s, "kb")
	} else if strings.HasSuffix(s, "mb") {
		multiplier = 1024 * 1024
		s = strings.TrimSuffix(s, "mb")
	} else if strings.HasSuffix(s, "gb") {
		multiplier = 1024 * 1024 * 1024
		s = strings.TrimSuffix(s, "gb")
	}

	if n, err := strconv.ParseInt(s, 10, 64); err == nil {
		return n * multiplier
	}
	return 10 * 1024 * 1024 // Default 10MB
}
