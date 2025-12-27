/**
 * Kotlin WebView Bridge for PhilJS
 */

import type { WebViewBridgeConfig, NativeModuleConfig } from './types.js';

/**
 * Generate Kotlin WebView bridge code
 */
export function generateWebViewBridge(config: WebViewBridgeConfig): string {
  return `package com.example.app

import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

class PhilJSWebView(private val webView: WebView) {
    private val _events = MutableSharedFlow<Pair<String, Any?>>()
    val events: SharedFlow<Pair<String, Any?>> = _events

    init {
        webView.settings.javaScriptEnabled = ${config.javascriptEnabled}
        webView.addJavascriptInterface(Bridge(), "PhilJS")
    }

    inner class Bridge {
        ${config.handlers.map(h => `
        @JavascriptInterface
        fun ${h}(data: String) {
            _events.tryEmit("${h}" to data)
        }`).join('\n')}
    }

    fun call(method: String, args: String) {
        webView.evaluateJavascript("window.PhilJS.${'$'}method(${'$'}args)", null)
    }
}
`;
}

/**
 * Generate native module Kotlin code
 */
export function generateNativeModule(config: NativeModuleConfig): string {
  const methods = config.methods.map(m => {
    const params = m.params.map(p => `${p.name}: ${mapTypeToKotlin(p.type)}`).join(', ');
    const suspendKeyword = m.suspend ? 'suspend ' : '';
    const returnType = m.returnType === 'void' ? '' : `: ${mapTypeToKotlin(m.returnType)}`;

    return `    ${suspendKeyword}fun ${m.name}(${params})${returnType} {
        // TODO: Implement
    }`;
  }).join('\n\n');

  return `package com.example.app

object ${config.name} {
${methods}
}
`;
}

function mapTypeToKotlin(tsType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Double',
    'boolean': 'Boolean',
    'void': 'Unit',
    'any': 'Any',
  };
  return typeMap[tsType] || tsType;
}
