// Electron API stub for browser builds
// This file intentionally exposes minimal no-op shims so code that
// references window.isElectron or window.electronAPI won't fail in the browser.
(window as any).electronAPI = {
  getAppVersion: async () => 'browser',
  showMessageBox: async (_opts: any) => ({ response: 0 }),
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'browser',
  isElectron: false
};
(window as any).isElectron = false;
