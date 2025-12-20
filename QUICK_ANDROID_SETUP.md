# Quick Android Testing Setup

## Easiest Method: EAS Build (No Android Studio Needed!)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

(If you don't have an account, it will prompt you to create one)

### Step 3: Configure EAS

```bash
cd c:\Code\Self-Dev\Projects\Spark
eas build:configure
```

This creates an `eas.json` file with build profiles.

### Step 4: Build Development Build

```bash
eas build --profile development --platform android
```

This will:

- Build your app in the cloud
- Take about 10-15 minutes
- Give you a download link for the APK

### Step 5: Install on Your Android Device

1. Download the APK from the link provided
2. Enable "Install from Unknown Sources" on your Android device
3. Install the APK
4. Open the app

### Step 6: Connect to Development Server

```bash
npx expo start --dev-client
```

Then scan the QR code with your device (or the app will auto-connect).

---

## Alternative: If You Want to Use Emulator

### Install Android Studio:

1. Download from: https://developer.android.com/studio
2. Install it
3. Open Android Studio → Tools → Device Manager
4. Create a virtual device
5. Start it

### Then run:

```bash
npx expo prebuild --clean
npx expo run:android
```

---

## Which Method Should You Use?

- **EAS Build**: Easier, no local setup, works on any Android device
- **Emulator**: Faster iteration, but requires Android Studio installation

For testing the keyboard behavior, **EAS Build is recommended** since you can test on a real device with a real keyboard.
