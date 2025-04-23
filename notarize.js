// Use dynamic imports for ESM modules
const path = require('path');
const fs = require('fs');

// App details
const appPath = path.join(__dirname, 'release/mac-arm64/Boost Todo.app');
const appBundleId = 'com.boost-productivity.todo';

async function notarizeApp() {
    if (!fs.existsSync(appPath)) {
        console.error(`Cannot find application at: ${appPath}`);
        return;
    }

    console.log(`Notarizing ${appBundleId} found at ${appPath}`);

    try {
        // Dynamic import for @electron/notarize
        const { notarize } = await import('@electron/notarize');

        await notarize({
            appPath,
            appBundleId,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID
        });
        console.log('Notarization completed successfully');
    } catch (error) {
        console.error(`Notarization failed: ${error.message}`);
        process.exit(1);
    }
}

notarizeApp().catch(err => {
    console.error(err);
    process.exit(1);
}); 