/**
 * Kotlin code generation for PhilJS
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { KotlinProjectConfig, ComposeComponent, SignalBinding } from './types.js';

/**
 * Generate Kotlin project structure
 */
export async function generateKotlinProject(
  dir: string,
  config: KotlinProjectConfig
): Promise<void> {
  const kotlinDir = join(dir, 'app', 'src', 'main', 'kotlin', ...config.packageName.split('.'));
  await mkdir(kotlinDir, { recursive: true });

  // Generate build.gradle.kts
  const buildGradle = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${config.packageName}"
    compileSdk = ${config.targetSdk}

    defaultConfig {
        applicationId = "${config.packageName}"
        minSdk = ${config.minSdk}
        targetSdk = ${config.targetSdk}
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "${config.composeVersion}"
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
}
`;
  await writeFile(join(dir, 'app', 'build.gradle.kts'), buildGradle);

  // Generate PhilJSSignal.kt
  const signalKt = `package ${config.packageName}

import androidx.compose.runtime.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * A reactive signal compatible with PhilJS
 */
class Signal<T>(initialValue: T) {
    private val _state = MutableStateFlow(initialValue)
    val state: StateFlow<T> = _state

    var value: T
        get() = _state.value
        set(value) { _state.value = value }

    fun set(value: T) {
        _state.value = value
    }

    fun update(transform: (T) -> T) {
        _state.value = transform(_state.value)
    }
}

/**
 * Create a signal as Compose state
 */
@Composable
fun <T> rememberSignal(initialValue: T): Signal<T> {
    return remember { Signal(initialValue) }
}

/**
 * Collect signal as Compose state
 */
@Composable
fun <T> Signal<T>.collectAsState(): State<T> {
    return state.collectAsState()
}

/**
 * Bridge for communicating with PhilJS WebView
 */
object PhilJSBridge {
    suspend fun call(method: String, vararg args: Any?): Any? {
        // TODO: Implement WebView bridge
        return null
    }

    fun emit(event: String, data: Any? = null) {
        // TODO: Implement event emission
    }
}
`;
  await writeFile(join(kotlinDir, 'PhilJSSignal.kt'), signalKt);
}

/**
 * Generate Compose component from PhilJS component
 */
export function generateComposeComponent(component: ComposeComponent): string {
  const signalDeclarations = component.signals
    .map(s => `    val ${s.name} = rememberSignal(${formatKotlinValue(s.initialValue, s.type)})`)
    .join('\n');

  return `package com.example.app

import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*

@Composable
fun ${component.name}() {
${signalDeclarations}

    ${component.template}
}
`;
}

function formatKotlinValue(value: unknown, type: string): string {
  if (value === undefined || value === null) {
    if (type === 'string' || type === 'String') return '""';
    if (type === 'number' || type === 'Int' || type === 'Double') return '0';
    if (type === 'boolean' || type === 'Boolean') return 'false';
    return 'null';
  }
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}
