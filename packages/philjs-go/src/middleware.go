package philjs

import (
	"github.com/gofiber/fiber/v2"
)

// Config defines the config for the PhilJS middleware
type Config struct {
	// Root directory of the PhilJS build (client)
	ClientBuildDir string
	// Filter defines a function to skip middleware
	Filter func(*fiber.Ctx) bool
	// SSRHandler allow injecting a NodeJS sidecar or internal process to render
	SSRHandler func(*fiber.Ctx) error
}

// New creates a new middleware handler
func New(config ...Config) fiber.Handler {
	var cfg Config
	if len(config) > 0 {
		cfg = config[0]
	}

	return func(c *fiber.Ctx) error {
		// Filter skip
		if cfg.Filter != nil && cfg.Filter(c) {
			return c.Next()
		}

		// If it's an API request, skip
		if len(c.Path()) >= 4 && c.Path()[0:4] == "/api" {
			return c.Next()
		}

		// Try to serve static file first
		if err := c.SendFile(cfg.ClientBuildDir + c.Path()); err == nil {
			return nil
		}

		// If SSR handler is provided, use it
		if cfg.SSRHandler != nil {
			return cfg.SSRHandler(c)
		}

		// Default to serving index.html for SPA/Client-side routing
		return c.SendFile(cfg.ClientBuildDir + "/index.html")
	}
}
