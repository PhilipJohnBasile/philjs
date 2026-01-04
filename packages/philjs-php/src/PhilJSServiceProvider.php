<?php

namespace PhilJS;

use Illuminate\Support\ServiceProvider;

/**
 * PhilJS Service Provider for Laravel
 * 
 * Register in config/app.php:
 *     'providers' => [
 *         PhilJS\PhilJSServiceProvider::class,
 *     ],
 * 
 * Publish config with:
 *     php artisan vendor:publish --tag=philjs-config
 */
class PhilJSServiceProvider extends ServiceProvider
{
    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../config/philjs.php',
            'philjs'
        );

        $this->app->singleton('philjs', function ($app) {
            return new PhilJSManager(
                config('philjs.ssr_enabled', false),
                config('philjs.ssr_url', 'http://localhost:3000'),
                config('philjs.bundle_path', 'js/philjs/bundle.js')
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish configuration
        $this->publishes([
            __DIR__ . '/../config/philjs.php' => config_path('philjs.php'),
        ], 'philjs-config');

        // Publish assets
        $this->publishes([
            __DIR__ . '/../dist' => public_path('js/philjs'),
        ], 'philjs-assets');

        // Register Blade directives
        $this->registerBladeDirectives();

        // Register view components
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'philjs');
    }

    /**
     * Register custom Blade directives.
     */
    protected function registerBladeDirectives(): void
    {
        $blade = $this->app['blade.compiler'];

        // @philjs('ComponentName', ['prop' => 'value'])
        $blade->directive('philjs', function ($expression) {
            return "<?php echo app('philjs')->render($expression); ?>";
        });

        // @philjsIsland('ComponentName', ['prop' => 'value'])
        $blade->directive('philjsIsland', function ($expression) {
            return "<?php echo app('philjs')->island($expression); ?>";
        });

        // @philjsState(['key' => 'value'])
        $blade->directive('philjsState', function ($expression) {
            return "<?php echo app('philjs')->injectState($expression); ?>";
        });

        // @philjsHydrate
        $blade->directive('philjsHydrate', function () {
            return "<?php echo app('philjs')->hydrationScript(); ?>";
        });
    }
}


/**
 * PhilJS Manager - handles rendering and SSR
 */
class PhilJSManager
{
    protected bool $ssrEnabled;
    protected string $ssrUrl;
    protected string $bundlePath;
    protected array $state = [];

    public function __construct(bool $ssrEnabled, string $ssrUrl, string $bundlePath)
    {
        $this->ssrEnabled = $ssrEnabled;
        $this->ssrUrl = $ssrUrl;
        $this->bundlePath = $bundlePath;
    }

    /**
     * Render a PhilJS component.
     */
    public function render(string $component, array $props = []): string
    {
        if ($this->ssrEnabled) {
            return $this->ssrRender($component, $props);
        }

        return $this->clientRender($component, $props);
    }

    /**
     * Render an interactive island.
     */
    public function island(string $component, array $props = [], string $fallback = 'Loading...'): string
    {
        $propsJson = htmlspecialchars(json_encode($props), ENT_QUOTES, 'UTF-8');
        
        $html = $this->ssrEnabled 
            ? $this->ssrRender($component, $props) 
            : "<div>{$fallback}</div>";

        return <<<HTML
<div data-philjs-island="{$component}" data-props="{$propsJson}">
    {$html}
</div>
HTML;
    }

    /**
     * Inject state for hydration.
     */
    public function injectState(array $state): string
    {
        $this->state = array_merge($this->state, $state);
        return '';
    }

    /**
     * Generate hydration script.
     */
    public function hydrationScript(): string
    {
        $stateJson = json_encode($this->state);
        $bundlePath = asset($this->bundlePath);

        return <<<HTML
<script type="module">
import { hydrate } from "{$bundlePath}";
const state = {$stateJson};
hydrate(document.getElementById("philjs-root"), state);
</script>
HTML;
    }

    /**
     * Server-side render via SSR service.
     */
    protected function ssrRender(string $component, array $props): string
    {
        try {
            $response = file_get_contents($this->ssrUrl . '/render', false, stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode(['component' => $component, 'props' => $props]),
                    'timeout' => 5,
                ]
            ]));

            if ($response !== false) {
                $data = json_decode($response, true);
                return $data['html'] ?? '';
            }
        } catch (\Exception $e) {
            // Fall back to client rendering
        }

        return $this->clientRender($component, $props);
    }

    /**
     * Client-side only render (placeholder).
     */
    protected function clientRender(string $component, array $props): string
    {
        $propsJson = htmlspecialchars(json_encode($props), ENT_QUOTES, 'UTF-8');
        return "<div data-philjs-component=\"{$component}\" data-props=\"{$propsJson}\"></div>";
    }
}
