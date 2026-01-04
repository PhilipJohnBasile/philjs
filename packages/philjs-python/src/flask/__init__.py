"""
PhilJS Flask Integration

Flask middleware and helpers for PhilJS SSR.
"""

from flask import Flask, request, make_response
from functools import wraps


class PhilJSFlask:
    """Flask extension for PhilJS SSR integration."""
    
    def __init__(self, app=None, render_func=None):
        self.render_func = render_func
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        app.before_request(self._before_request)
        app.after_request(self._after_request)
        app.context_processor(self._context_processor)
    
    def _before_request(self):
        """Prepare PhilJS context before each request."""
        request.philjs_context = {
            'url': request.url,
            'path': request.path,
            'method': request.method,
            'headers': dict(request.headers),
        }
    
    def _after_request(self, response):
        """Inject PhilJS scripts after request."""
        return response
    
    def _context_processor(self):
        """Add PhilJS helpers to template context."""
        return {
            'philjs_render': self.render_component,
            'philjs_state': self.serialize_state,
        }
    
    def render_component(self, name, props=None):
        """Render a PhilJS component server-side."""
        if self.render_func:
            return self.render_func(name, props or {})
        return f'<div data-philjs-component="{name}"></div>'
    
    def serialize_state(self, state):
        """Serialize state for hydration."""
        import json
        return f'<script>window.__PHILJS_STATE__={json.dumps(state)}</script>'


def philjs_ssr(render_func):
    """Decorator for SSR routes."""
    @wraps(render_func)
    def wrapper(*args, **kwargs):
        result = render_func(*args, **kwargs)
        if isinstance(result, str):
            response = make_response(result)
            response.headers['Content-Type'] = 'text/html'
            return response
        return result
    return wrapper


def create_philjs_app(import_name: str, render_func=None):
    """Create a Flask app configured for PhilJS."""
    app = Flask(import_name)
    PhilJSFlask(app, render_func)
    return app
