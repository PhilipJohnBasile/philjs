using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System.IO;

namespace PhilJS
{
    public class PhilJSMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _clientBuildDir;

        public PhilJSMiddleware(RequestDelegate next, string clientBuildDir = "wwwroot")
        {
            _next = next;
            _clientBuildDir = clientBuildDir;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip API routes
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                await _next(context);
                return;
            }

            // Try to serve static file
            var path = Path.Combine(_clientBuildDir, context.Request.Path.Value.TrimStart('/'));
            if (File.Exists(path))
            {
                await context.Response.SendFileAsync(path);
                return;
            }

            // Fallback to index.html
            var indexPath = Path.Combine(_clientBuildDir, "index.html");
            if (File.Exists(indexPath))
            {
                await context.Response.SendFileAsync(indexPath);
                return;
            }

            await _next(context);
        }
    }
}
