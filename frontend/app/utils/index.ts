import { Capacitor, Plugins } from '@capacitor/core';

export async function requestCameraPermission() {
  if (Capacitor.isNativePlatform()) {
    const { Permissions } = Plugins;
    const result = await Permissions.requestPermissions({
      permissions: ['camera'],
    });
    return result;
  } else {
    console.warn('Camera permission request ignored, not running in a native Capacitor environment.');
    return { camera: 'ignored' };
  }
}
