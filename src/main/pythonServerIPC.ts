import { ipcMain } from 'electron';
import axios from 'axios';
import { pythonServer } from './pythonServer';

/**
 * Set up IPC handlers for Python server operations
 */
export function setupPythonServerIPC() {
    // Get Python server status
    ipcMain.handle('python-server-status', async () => {
        try {
            const isRunning = await pythonServer.isServerRunning();
            return {
                success: true,
                running: isRunning,
                url: pythonServer.getServerUrl()
            };
        } catch (error) {
            console.error('Error getting Python server status:', error);
            return {
                success: false,
                error: String(error)
            };
        }
    });

    // Start Python server
    ipcMain.handle('python-server-start', async () => {
        try {
            const started = await pythonServer.start();
            return {
                success: started,
                url: pythonServer.getServerUrl()
            };
        } catch (error) {
            console.error('Error starting Python server:', error);
            return {
                success: false,
                error: String(error)
            };
        }
    });

    // Stop Python server
    ipcMain.handle('python-server-stop', () => {
        try {
            const stopped = pythonServer.stop();
            return {
                success: stopped
            };
        } catch (error) {
            console.error('Error stopping Python server:', error);
            return {
                success: false,
                error: String(error)
            };
        }
    });

    // Proxy requests to the Python server
    ipcMain.handle('python-server-request', async (_, method, endpoint, data) => {
        try {
            const url = `${pythonServer.getServerUrl()}${endpoint}`;
            console.log(`Making ${method} request to ${url}`);

            let response;
            if (method.toLowerCase() === 'get') {
                response = await axios.get(url);
            } else if (method.toLowerCase() === 'post') {
                response = await axios.post(url, data);
            } else if (method.toLowerCase() === 'delete') {
                response = await axios.delete(url);
            } else {
                throw new Error(`Unsupported method: ${method}`);
            }

            console.log(`Response from ${url}: Status ${response.status}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`Error making ${method} request to ${pythonServer.getServerUrl()}${endpoint}:`, error);
            // Add more detailed error information
            if (error.response) {
                console.error(`Response status: ${error.response.status}`);
                console.error(`Response data:`, error.response.data);
            }
            return {
                success: false,
                error: String(error)
            };
        }
    });
} 