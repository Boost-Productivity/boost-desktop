import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { setupTodoIPC } from './todoService';
import { setupRecordingIPC } from './recordingService';
import { setupPythonServerIPC } from './pythonServerIPC';
import { pythonServer } from './pythonServer';
import * as fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;
let originalSize: { width: number; height: number } | null = null;
let originalPosition: { x: number; y: number } | null = null;

const createWindow = () => {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false, // Disable web security to allow local file access
        },
    });

    // Set permission handler for camera and microphone - CRITICAL for packaged apps
    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = ['media'];
        if (allowedPermissions.includes(permission)) {
            // Always allow camera and microphone
            callback(true);
        } else {
            callback(false);
        }
    });

    // In production, load the bundled app
    // In development, connect to webpack-dev-server
    const startUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true,
    });

    mainWindow.loadURL(startUrl);

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

// Debug: Check video files in uploads directory
const debugCheckUploads = () => {
    // Check the uploads directory in user data path
    const uploadsDir = path.join(app.getPath('userData'), 'uploads');
    console.log('Uploads directory:', uploadsDir);

    if (fs.existsSync(uploadsDir)) {
        try {
            const files = fs.readdirSync(uploadsDir);
            console.log('Files in uploads directory:', files);

            // Check file permissions and sizes
            files.forEach(file => {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                let readable = 'yes';
                try {
                    fs.accessSync(filePath, fs.constants.R_OK);
                } catch (err) {
                    readable = 'no';
                }
                console.log(`File ${file}: Size=${stats.size}, Mode=${stats.mode.toString(8)}, Readable=${readable}`);
            });
        } catch (err) {
            console.error('Error reading uploads directory:', err);
        }
    } else {
        console.log('Uploads directory does not exist');
    }
};

// Setup window resize handlers for focus mode
const setupWindowHandlers = () => {
    // Enter focus mode - make window smaller and move to bottom left
    ipcMain.handle('enterFocusMode', async (_, contentHeight) => {
        if (!mainWindow) return { success: false, error: 'Window not available' };

        try {
            // Store current size and position before changing
            const [width, height] = mainWindow.getSize();
            originalSize = { width, height };

            const [x, y] = mainWindow.getPosition();
            originalPosition = { x, y };

            // Fixed width for focus mode
            const focusModeWidth = 400;

            // Calculate appropriate height based on content
            // contentHeight is passed from the renderer process
            // Add small buffer for window chrome/borders
            const windowBuffer = 10;
            const focusModeHeight = Math.min(
                contentHeight + windowBuffer,
                screen.getPrimaryDisplay().workArea.height * 0.8 // Cap at 80% of screen height
            );

            // Resize to the dynamic height
            mainWindow.setSize(focusModeWidth, focusModeHeight);

            // Get the work area (screen space available for applications)
            const workArea = screen.getPrimaryDisplay().workArea;

            // Calculate position with bottom edge aligned to screen bottom
            // and left edge at screen left
            const bottomLeftX = workArea.x;
            const bottomLeftY = workArea.y + workArea.height - focusModeHeight;

            // Set position - flush with bottom left
            mainWindow.setPosition(bottomLeftX, bottomLeftY);

            // Set window to be always on top
            mainWindow.setAlwaysOnTop(true, 'floating', 1);

            return { success: true };
        } catch (error) {
            console.error('Error entering focus mode:', error);
            return { success: false, error: String(error) };
        }
    });

    // Method to update focus mode window size when content changes
    ipcMain.handle('updateFocusModeSize', async (_, contentHeight) => {
        if (!mainWindow) return { success: false, error: 'Window not available' };

        try {
            // Only proceed if window is in focus mode (alwaysOnTop is true)
            if (!mainWindow.isAlwaysOnTop()) {
                return { success: false, message: 'Not in focus mode' };
            }

            // Fixed width for focus mode
            const focusModeWidth = 400;

            // Calculate appropriate height based on content with buffer
            const windowBuffer = 10;
            const focusModeHeight = Math.min(
                contentHeight + windowBuffer,
                screen.getPrimaryDisplay().workArea.height * 0.8 // Cap at 80% of screen height
            );

            // Get current position - we want to keep the bottom edge pinned
            const [currentX, currentY] = mainWindow.getPosition();

            // Get work area to calculate bottom position
            const workArea = screen.getPrimaryDisplay().workArea;

            // Resize keeping the bottom edge in the same position
            mainWindow.setSize(focusModeWidth, focusModeHeight);

            // Recalculate position to keep bottom edge in place
            const newY = workArea.y + workArea.height - focusModeHeight;

            // Update position with new Y value
            mainWindow.setPosition(currentX, newY);

            return { success: true };
        } catch (error) {
            console.error('Error updating focus mode size:', error);
            return { success: false, error: String(error) };
        }
    });

    // Exit focus mode - restore original size and position
    ipcMain.handle('exitFocusMode', () => {
        if (!mainWindow) return { success: false, error: 'Window not available' };

        try {
            // Turn off always on top
            mainWindow.setAlwaysOnTop(false);

            // If we have the original size and position, restore them
            if (originalSize) {
                mainWindow.setSize(originalSize.width, originalSize.height);
            } else {
                // Default fallback if original size wasn't captured
                mainWindow.setSize(800, 600);
            }

            if (originalPosition) {
                mainWindow.setPosition(originalPosition.x, originalPosition.y);
            } else {
                // Center as fallback if we don't have original position
                mainWindow.center();
            }

            return { success: true };
        } catch (error) {
            console.error('Error exiting focus mode:', error);
            return { success: false, error: String(error) };
        }
    });
};

// Set up IPC handlers for todos
setupTodoIPC();
// Set up IPC handlers for recordings
setupRecordingIPC();
// Set up IPC handlers for Python server
setupPythonServerIPC();

// Log important paths for debugging
console.log('App paths:');
console.log('__dirname:', __dirname);
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));

// Set up window handlers
setupWindowHandlers();

app.on('ready', async () => {
    createWindow();
    debugCheckUploads();

    // Start the Python server
    try {
        console.log('Starting Python server...');
        const started = await pythonServer.start();
        if (started) {
            console.log('Python server started successfully');
        } else {
            console.error('Failed to start Python server');
        }
    } catch (error) {
        console.error('Error starting Python server:', error);
    }
});

app.on('window-all-closed', () => {
    // Stop the Python server when all windows are closed
    pythonServer.stop();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Make sure to stop the Python server when the app is quitting
    pythonServer.stop();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
}); 