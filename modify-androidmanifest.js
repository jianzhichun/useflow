import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const manifestPath = join(__dirname, 'android/app/src/main/AndroidManifest.xml');

let manifest = readFileSync(manifestPath, 'utf8');

if (!manifest.includes('<uses-permission android:name="android.permission.CAMERA" />')) {
  manifest = manifest.replace(
    '</application>',
    '    <uses-permission android:name="android.permission.CAMERA" />\n' +
    '    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n' +
    '</application>'
  );
}

writeFileSync(manifestPath, manifest);
