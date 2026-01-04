<?php

namespace PhilJS;

class PhilJS
{
    private string $buildDir;
    
    public function __construct(string $buildDir)
    {
        $this->buildDir = $buildDir;
    }
    
    /**
     * Renders the PhilJS HTML shell for a given route
     */
    public function render(string $route = '/'): string
    {
        // In a real implementation, this might inject initial state
        // or defer to a Node sidecar for SSR.
        $indexPath = $this->buildDir . '/index.html';
        
        if (!file_exists($indexPath)) {
            return "<!-- PhilJS Error: Build not found at {$this->buildDir} -->";
        }
        
        return file_get_contents($indexPath);
    }
    
    /**
     * Returns the path to static assets
     */
    public function getAssetPath(string $asset): string
    {
        return $this->buildDir . '/' . ltrim($asset, '/');
    }
}
