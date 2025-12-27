package server

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

// Context holds request/response context for handlers
type Context struct {
	Request  *http.Request
	Response http.ResponseWriter
	params   map[string]string
	store    map[string]interface{}
}

// Param returns a route parameter by name
func (c *Context) Param(name string) string {
	return c.params[name]
}

// Query returns a query parameter by name
func (c *Context) Query(name string) string {
	return c.Request.URL.Query().Get(name)
}

// Header returns a request header by name
func (c *Context) Header(name string) string {
	return c.Request.Header.Get(name)
}

// SetHeader sets a response header
func (c *Context) SetHeader(name, value string) {
	c.Response.Header().Set(name, value)
}

// Get retrieves a value from the context store
func (c *Context) Get(key string) interface{} {
	if c.store == nil {
		return nil
	}
	return c.store[key]
}

// Set stores a value in the context store
func (c *Context) Set(key string, value interface{}) {
	if c.store == nil {
		c.store = make(map[string]interface{})
	}
	c.store[key] = value
}

// JSON sends a JSON response
func (c *Context) JSON(data interface{}) error {
	c.Response.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(c.Response).Encode(data)
}

// JSONStatus sends a JSON response with a specific status code
func (c *Context) JSONStatus(status int, data interface{}) error {
	c.Response.Header().Set("Content-Type", "application/json")
	c.Response.WriteHeader(status)
	return json.NewEncoder(c.Response).Encode(data)
}

// String sends a plain text response
func (c *Context) String(s string) error {
	c.Response.Header().Set("Content-Type", "text/plain")
	_, err := c.Response.Write([]byte(s))
	return err
}

// HTML sends an HTML response
func (c *Context) HTML(html string) error {
	c.Response.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, err := c.Response.Write([]byte(html))
	return err
}

// Status sets the response status code
func (c *Context) Status(code int) *Context {
	c.Response.WriteHeader(code)
	return c
}

// Error sends an error response
func (c *Context) Error(code int, message string) error {
	return c.JSONStatus(code, map[string]interface{}{
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
		},
	})
}

// Bind parses the request body into the given struct
func (c *Context) Bind(v interface{}) error {
	defer c.Request.Body.Close()
	return json.NewDecoder(c.Request.Body).Decode(v)
}

// Body returns the raw request body
func (c *Context) Body() ([]byte, error) {
	defer c.Request.Body.Close()
	return io.ReadAll(c.Request.Body)
}

// Redirect redirects to the given URL
func (c *Context) Redirect(url string) error {
	http.Redirect(c.Response, c.Request, url, http.StatusFound)
	return nil
}

// RedirectPermanent redirects permanently to the given URL
func (c *Context) RedirectPermanent(url string) error {
	http.Redirect(c.Response, c.Request, url, http.StatusMovedPermanently)
	return nil
}

// NoContent sends a 204 No Content response
func (c *Context) NoContent() error {
	c.Response.WriteHeader(http.StatusNoContent)
	return nil
}

// NotFound sends a 404 Not Found response
func (c *Context) NotFound() error {
	return c.Error(http.StatusNotFound, "Not found")
}

// BadRequest sends a 400 Bad Request response
func (c *Context) BadRequest(message string) error {
	return c.Error(http.StatusBadRequest, message)
}

// Unauthorized sends a 401 Unauthorized response
func (c *Context) Unauthorized() error {
	return c.Error(http.StatusUnauthorized, "Unauthorized")
}

// Forbidden sends a 403 Forbidden response
func (c *Context) Forbidden() error {
	return c.Error(http.StatusForbidden, "Forbidden")
}

// InternalError sends a 500 Internal Server Error response
func (c *Context) InternalError(message string) error {
	return c.Error(http.StatusInternalServerError, message)
}

// parseParams extracts route parameters from the URL path
func (c *Context) parseParams(pattern, path string) {
	patternParts := strings.Split(pattern, "/")
	pathParts := strings.Split(path, "/")

	for i, part := range patternParts {
		if strings.HasPrefix(part, ":") && i < len(pathParts) {
			paramName := strings.TrimPrefix(part, ":")
			c.params[paramName] = pathParts[i]
		}
	}
}

// Stream sends a streaming response
func (c *Context) Stream(contentType string, reader io.Reader) error {
	c.Response.Header().Set("Content-Type", contentType)
	c.Response.Header().Set("Transfer-Encoding", "chunked")

	flusher, ok := c.Response.(http.Flusher)
	if !ok {
		_, err := io.Copy(c.Response, reader)
		return err
	}

	buf := make([]byte, 1024)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			if _, writeErr := c.Response.Write(buf[:n]); writeErr != nil {
				return writeErr
			}
			flusher.Flush()
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	return nil
}

// SSE sends a Server-Sent Events response
func (c *Context) SSE(events <-chan SSEvent) error {
	c.Response.Header().Set("Content-Type", "text/event-stream")
	c.Response.Header().Set("Cache-Control", "no-cache")
	c.Response.Header().Set("Connection", "keep-alive")

	flusher, ok := c.Response.(http.Flusher)
	if !ok {
		return c.InternalError("SSE not supported")
	}

	for event := range events {
		data, _ := json.Marshal(event.Data)
		if event.Event != "" {
			c.Response.Write([]byte("event: " + event.Event + "\n"))
		}
		c.Response.Write([]byte("data: " + string(data) + "\n\n"))
		flusher.Flush()
	}

	return nil
}

// SSEvent represents a Server-Sent Event
type SSEvent struct {
	Event string
	Data  interface{}
}
