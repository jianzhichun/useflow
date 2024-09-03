const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');

let manifest = fs.readFileSync(manifestPath, 'utf8');

if (!manifest.includes('<uses-permission android:name="android.permission.CAMERA" />')) {
  manifest = manifest.replace(
    '</application>',
    '    <uses-permission android:name="android.permission.CAMERA" />\n' +
    '    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n' +
    '</application>'
  );
}

fs.writeFileSync(manifestPath, manifest);
