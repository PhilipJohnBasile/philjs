/**
 * Tests for Electron Migration Helpers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMigrationHelper, ElectronToTauriMapper } from './migration';

describe('Migration Helpers', () => {
  describe('ElectronToTauriMapper', () => {
    describe('mapRequire', () => {
      it('should map electron module', () => {
        const mapped = ElectronToTauriMapper.mapRequire('electron');

        expect(mapped.app).toBeDefined();
        expect(mapped.BrowserWindow).toBeDefined();
        expect(mapped.ipcMain).toBeDefined();
        expect(mapped.ipcRenderer).toBeDefined();
      });

      it('should map electron/main', () => {
        const mapped = ElectronToTauriMapper.mapRequire('electron/main');

        expect(mapped.app).toBeDefined();
        expect(mapped.BrowserWindow).toBeDefined();
        expect(mapped.ipcMain).toBeDefined();
      });

      it('should map electron/renderer', () => {
        const mapped = ElectronToTauriMapper.mapRequire('electron/renderer');

        expect(mapped.ipcRenderer).toBeDefined();
      });

      it('should warn for unknown modules', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        ElectronToTauriMapper.mapRequire('unknown-module');

        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });

    describe('checkCompatibility', () => {
      it('should return supported for BrowserWindow', () => {
        const result = ElectronToTauriMapper.checkCompatibility('BrowserWindow');

        expect(result.supported).toBe(true);
      });

      it('should return supported for ipcMain.handle', () => {
        const result = ElectronToTauriMapper.checkCompatibility('ipcMain.handle');

        expect(result.supported).toBe(true);
      });

      it('should return not supported with alternative for sendSync', () => {
        const result = ElectronToTauriMapper.checkCompatibility('ipcRenderer.sendSync');

        expect(result.supported).toBe(false);
        expect(result.alternative).toBe('ipcRenderer.invoke');
      });

      it('should return not supported for session', () => {
        const result = ElectronToTauriMapper.checkCompatibility('session');

        expect(result.supported).toBe(false);
      });

      it('should return not supported for unknown API', () => {
        const result = ElectronToTauriMapper.checkCompatibility('unknownApi');

        expect(result.supported).toBe(false);
      });
    });

    describe('getMigrationGuide', () => {
      it('should return guide for BrowserWindow', () => {
        const guide = ElectronToTauriMapper.getMigrationGuide('BrowserWindow');

        expect(guide).toContain('BrowserWindow');
        expect(guide.length).toBeGreaterThan(50);
      });

      it('should return guide for IPC', () => {
        const guide = ElectronToTauriMapper.getMigrationGuide('ipcMain/ipcRenderer');

        expect(guide).toContain('IPC');
      });

      it('should return guide for dialog', () => {
        const guide = ElectronToTauriMapper.getMigrationGuide('dialog');

        expect(guide).toContain('Dialog');
      });

      it('should return guide for shell', () => {
        const guide = ElectronToTauriMapper.getMigrationGuide('shell');

        expect(guide).toContain('Shell');
      });

      it('should return default message for unknown', () => {
        const guide = ElectronToTauriMapper.getMigrationGuide('unknownApi');

        expect(guide).toContain('No migration guide available');
      });
    });
  });

  describe('createMigrationHelper', () => {
    let helper: ReturnType<typeof createMigrationHelper>;

    beforeEach(() => {
      helper = createMigrationHelper();
    });

    describe('require', () => {
      it('should wrap Electron require', () => {
        const electron = helper.require('electron');

        expect(electron.app).toBeDefined();
        expect(electron.BrowserWindow).toBeDefined();
      });
    });

    describe('analyzeCode', () => {
      it('should detect remote.require usage', () => {
        const code = `
          const fs = require('electron').remote.require('fs');
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.length).toBeGreaterThan(0);
        expect(issues.some(i => i.api === 'remote.require')).toBe(true);
      });

      it('should detect sendSync usage', () => {
        const code = `
          const result = ipcRenderer.sendSync('channel', data);
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.some(i => i.api === 'sendSync')).toBe(true);
      });

      it('should detect nodeIntegration', () => {
        const code = `
          new BrowserWindow({
            webPreferences: {
              nodeIntegration: true
            }
          });
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.some(i => i.api === 'nodeIntegration')).toBe(true);
      });

      it('should detect showItemInFolder', () => {
        const code = `
          shell.showItemInFolder(filePath);
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.some(i => i.api === 'showItemInFolder')).toBe(true);
      });

      it('should detect powerMonitor', () => {
        const code = `
          powerMonitor.on('suspend', () => {});
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.some(i => i.api === 'powerMonitor')).toBe(true);
      });

      it('should detect protocol.register', () => {
        const code = `
          protocol.registerHttpProtocol('custom', handler);
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.some(i => i.api === 'protocol')).toBe(true);
      });

      it('should return empty array for compatible code', () => {
        const code = `
          const win = new BrowserWindow({ width: 800, height: 600 });
          ipcRenderer.invoke('channel', data);
        `;

        const issues = helper.analyzeCode(code);

        expect(issues.length).toBe(0);
      });

      it('should include line numbers', () => {
        const code = `line1
line2
remote.require('fs')
line4`;

        const issues = helper.analyzeCode(code);

        expect(issues[0].line).toBe(3);
      });
    });

    describe('generateReport', () => {
      it('should generate report with sections', () => {
        const report = helper.generateReport([
          'BrowserWindow',
          'ipcMain.handle',
          'ipcRenderer.sendSync',
          'session',
        ]);

        expect(report).toContain('# Electron to Tauri Migration Report');
        expect(report).toContain('## Fully Supported APIs');
        expect(report).toContain('## Partially Supported APIs');
        expect(report).toContain('## Unsupported APIs');
      });

      it('should categorize APIs correctly', () => {
        const report = helper.generateReport([
          'BrowserWindow',           // Fully supported
          'ipcRenderer.sendSync',    // Partial
          'session',                 // Unsupported
        ]);

        expect(report).toContain('BrowserWindow');
        expect(report).toContain('sendSync');
        expect(report).toContain('session');
      });

      it('should handle empty API list', () => {
        const report = helper.generateReport([]);

        expect(report).toContain('Migration Report');
      });
    });
  });
});
