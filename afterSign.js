// See: https://github.com/electron/electron-notarize
const path = require('path');
const fs = require('fs');

module.exports = async function (params) {
    // Only notarize the app on Mac OS
    if (process.platform !== 'darwin') {
        return;
    }

    console.log('Notarizing macOS application...');

    const { appOutDir, packager } = params;
    const appName = packager.appInfo.productFilename;
    const appBundleId = packager.config.appId || 'com.boost-productivity.todo';
    const appPath = path.join(appOutDir, `${appName}.app`);

    if (!fs.existsSync(appPath)) {
        console.error(`Cannot find application at: ${appPath}`);
        return;
    }

    try {
        console.log(`Notarizing ${appBundleId} found at ${appPath}`);

        // Use dynamic import for @electron/notarize
        const { notarize } = await import('@electron/notarize');

        await notarize({
            appPath,
            appBundleId,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID
        });

        console.log(`Successfully notarized ${appName}`);
    } catch (error) {
        console.error(`Notarization failed: ${error.message}`);
        // Don't throw so the build can continue
    }
}; 