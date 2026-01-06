// Package gin provides PhilJS middleware for the Gin web framework.
package gin

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// Config defines the config for the PhilJS Gin middleware
type Config struct {
	// ClientBuildDir is the root directory of the PhilJS build (client)
	ClientBuildDir string

	// Filter defines a function to skip middleware
	Filter func(*gin.Context) bool

	// SSRHandler allows injecting a NodeJS sidecar or internal process to render
	SSRHandler gin.HandlerFunc

	// APIPrefix is the prefix for API routes (default: "/api")
	APIPrefix string

	// IndexFile is the fallback file for SPA routing (default: "index.html")
	IndexFile string

	// CacheControl sets the Cache-Control header for static files
	CacheControl string

	// EnableGzip enables gzip compression for responses
	EnableGzip bool
}

// DefaultConfig returns the default configuration
func DefaultConfig() Config {
	return Config{
		ClientBuildDir: "./dist",
		APIPrefix:      "/api",
		IndexFile:      "index.html",
		CacheControl:   "public, max-age=31536000",
		EnableGzip:     true,
	}
}

// New creates a new PhilJS middleware handler for Gin
func New(config ...Config) gin.HandlerFunc {
	cfg := DefaultConfig()
	if len(config) > 0 {
		cfg = mergeConfig(cfg, config[0])
	}

	return func(c *gin.Context) {
		// Filter skip
		if cfg.Filter != nil && cfg.Filter(c) {
			c.Next()
			return
		}

		// If it's an API request, skip
		if strings.HasPrefix(c.Request.URL.Path, cfg.APIPrefix) {
			c.Next()
			return
		}

		// Try to serve static file first
		requestedPath := c.Request.URL.Path
		filePath := filepath.Join(cfg.ClientBuildDir, requestedPath)

		// Check if file exists and is not a directory
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			// Set cache control for static assets
			if cfg.CacheControl != "" && isStaticAsset(requestedPath) {
				c.Header("Cache-Control", cfg.CacheControl)
			}
			c.File(filePath)
			return
		}

		// If SSR handler is provided, use it
		if cfg.SSRHandler != nil {
			cfg.SSRHandler(c)
			return
		}

		// Default to serving index.html for SPA/Client-side routing
		indexPath := filepath.Join(cfg.ClientBuildDir, cfg.IndexFile)
		if _, err := os.Stat(indexPath); err == nil {
			c.File(indexPath)
			return
		}

		c.AbortWithStatus(http.StatusNotFound)
	}
}

// SSR creates an SSR-enabled middleware that renders PhilJS components server-side
func SSR(config Config, renderFunc func(path string, props map[string]interface{}) (string, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Filter skip
		if config.Filter != nil && config.Filter(c) {
			c.Next()
			return
		}

		// Skip API routes
		if strings.HasPrefix(c.Request.URL.Path, config.APIPrefix) {
			c.Next()
			return
		}

		// Try static files first
		requestedPath := c.Request.URL.Path
		filePath := filepath.Join(config.ClientBuildDir, requestedPath)

		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			c.File(filePath)
			return
		}

		// Render SSR
		props := extractProps(c)
		html, err := renderFunc(c.Request.URL.Path, props)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "SSR rendering failed",
			})
			return
		}

		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, html)
	}
}

// APIRouter creates a router group for PhilJS API routes
func APIRouter(router *gin.Engine, prefix string) *gin.RouterGroup {
	if prefix == "" {
		prefix = "/api"
	}
	return router.Group(prefix)
}

// PhilJSContext extends Gin context with PhilJS-specific helpers
type PhilJSContext struct {
	*gin.Context
}

// Signal returns a reactive signal value from the request
func (c *PhilJSContext) Signal(key string) interface{} {
	if value, exists := c.Get("philjs_signals"); exists {
		if signals, ok := value.(map[string]interface{}); ok {
			return signals[key]
		}
	}
	return nil
}

// SetSignal sets a signal value to be passed to the client
func (c *PhilJSContext) SetSignal(key string, value interface{}) {
	signals, exists := c.Get("philjs_signals")
	if !exists {
		signals = make(map[string]interface{})
	}
	signalMap := signals.(map[string]interface{})
	signalMap[key] = value
	c.Set("philjs_signals", signalMap)
}

// RenderComponent renders a PhilJS component with the given props
func (c *PhilJSContext) RenderComponent(component string, props map[string]interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"component": component,
		"props":     props,
		"signals":   c.Signal("philjs_signals"),
	})
}

// Wrap wraps a Gin context with PhilJS helpers
func Wrap(c *gin.Context) *PhilJSContext {
	return &PhilJSContext{Context: c}
}

// Helper functions

func mergeConfig(base, override Config) Config {
	if override.ClientBuildDir != "" {
		base.ClientBuildDir = override.ClientBuildDir
	}
	if override.Filter != nil {
		base.Filter = override.Filter
	}
	if override.SSRHandler != nil {
		base.SSRHandler = override.SSRHandler
	}
	if override.APIPrefix != "" {
		base.APIPrefix = override.APIPrefix
	}
	if override.IndexFile != "" {
		base.IndexFile = override.IndexFile
	}
	if override.CacheControl != "" {
		base.CacheControl = override.CacheControl
	}
	base.EnableGzip = override.EnableGzip
	return base
}

func isStaticAsset(path string) bool {
	staticExtensions := []string{
		".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg",
		".woff", ".woff2", ".ttf", ".eot", ".ico", ".webp", ".avif",
	}
	for _, ext := range staticExtensions {
		if strings.HasSuffix(path, ext) {
			return true
		}
	}
	return false
}

func extractProps(c *gin.Context) map[string]interface{} {
	props := make(map[string]interface{})

	// Extract query parameters
	for key, values := range c.Request.URL.Query() {
		if len(values) == 1 {
			props[key] = values[0]
		} else {
			props[key] = values
		}
	}

	// Extract route parameters
	for _, param := range c.Params {
		props[param.Key] = param.Value
	}

	return props
}
