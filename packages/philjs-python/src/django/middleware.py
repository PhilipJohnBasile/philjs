"""
PhilJS Django Middleware

Enables server-side rendering of PhilJS components in Django applications.
"""

import json
import subprocess
from django.http import HttpRequest, HttpResponse
from django.conf import settings


class PhilJSMiddleware:
    """
    Django middleware for PhilJS SSR integration.
    
    Add to MIDDLEWARE in settings.py:
        'philjs.middleware.PhilJSMiddleware',
    
    Configure in settings.py:
        PHILJS_SSR_ENABLED = True
        PHILJS_SSR_URL = 'http://localhost:3000'
        PHILJS_BUNDLE_PATH = 'static/philjs/bundle.js'
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.ssr_enabled = getattr(settings, 'PHILJS_SSR_ENABLED', False)
        self.ssr_url = getattr(settings, 'PHILJS_SSR_URL', 'http://localhost:3000')
        self.bundle_path = getattr(settings, 'PHILJS_BUNDLE_PATH', 'static/philjs/bundle.js')
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        
        # Only process HTML responses
        if 'text/html' not in response.get('Content-Type', ''):
            return response
        
        # Inject PhilJS hydration script if SSR is enabled
        if self.ssr_enabled and hasattr(response, 'content'):
            content = response.content.decode('utf-8')
            
            # Add hydration script before </body>
            hydration_script = self._get_hydration_script(request)
            content = content.replace('</body>', f'{hydration_script}</body>')
            
            response.content = content.encode('utf-8')
            response['Content-Length'] = len(response.content)
        
        return response
    
    def _get_hydration_script(self, request: HttpRequest) -> str:
        """Generate the PhilJS hydration script."""
        initial_state = getattr(request, 'philjs_state', {})
        
        return f'''
<script type="module">
import {{ hydrate }} from "/{self.bundle_path}";
const state = {json.dumps(initial_state)};
hydrate(document.getElementById("philjs-root"), state);
</script>
'''


class PhilJSContextMiddleware:
    """
    Middleware to inject PhilJS context into Django templates.
    
    Provides `philjs` context variable with:
    - `component(name, props)`: Render a PhilJS component
    - `island(name, props)`: Render an interactive island
    - `state`: Current PhilJS state
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Initialize PhilJS state on request
        request.philjs_state = {}
        request.philjs_islands = []
        
        return self.get_response(request)


def render_component(name: str, props: dict = None) -> str:
    """
    Render a PhilJS component to HTML string.
    
    Usage in Django template:
        {% load philjs %}
        {% philjs_component "Button" variant="primary" %}Click me{% endphiljs_component %}
    
    Or in Python:
        from philjs.middleware import render_component
        html = render_component('Button', {'variant': 'primary', 'children': 'Click me'})
    """
    props = props or {}
    
    # Use Node.js for SSR (requires philjs-ssr server running)
    try:
        result = subprocess.run(
            ['node', '-e', f'''
                const {{ renderToString }} = require("@philjs/ssr");
                const {{ {name} }} = require("./components");
                console.log(renderToString({name}({json.dumps(props)})));
            '''],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout
    except Exception as e:
        # Fallback: return client-only component
        return f'<div data-philjs-component="{name}" data-props=\'{json.dumps(props)}\'></div>'


def render_island(name: str, props: dict = None, fallback: str = 'Loading...') -> str:
    """
    Render a PhilJS island (interactive component with hydration).
    
    Usage:
        {% philjs_island "Counter" initial=0 %}
    """
    props = props or {}
    props_json = json.dumps(props)
    
    return f'''
<div data-philjs-island="{name}" data-props='{props_json}'>
    <div data-philjs-fallback>{fallback}</div>
</div>
'''
