/**
 * @philjs/dotnet - .NET/C# bindings for PhilJS
 *
 * This package provides .NET-based middleware.
 * The core implementation is in C# (.cs files).
 */

export interface DotNetConfig {
  assemblyPath?: string;
}

/**
 * Initialize .NET runtime (requires .NET runtime)
 */
export async function initDotNet(_config?: DotNetConfig): Promise<void> {
  throw new Error('@philjs/dotnet requires the .NET runtime');
}
