from pathlib import Path
import re

manifest = Path("android/app/src/main/AndroidManifest.xml")
text = manifest.read_text()
activity = re.compile(r'<activity\b(?=[^>]*android:name="[^"]*MainActivity")[^>]*>', re.DOTALL)
match = activity.search(text)
if not match:
    raise SystemExit(f"Could not find Capacitor MainActivity in {manifest}")
tag = match.group(0)
if "android:screenOrientation=" not in tag:
    text = text[:match.start()] + tag[:-1] + ' android:screenOrientation="landscape">' + text[match.end():]
manifest.write_text(text)
