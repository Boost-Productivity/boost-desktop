/**
 * PythonServerService - Service for interacting with the Python server
 */
export class PythonServerService {
    /**
     * Check if the Python server is running
     */
    static async getStatus(): Promise<{ running: boolean; url: string }> {
        try {
            const response = await window.api.pythonServerStatus();
            if (response.success) {
                return {
                    running: response.running,
                    url: response.url
                };
            }
            throw new Error(response.error || 'Failed to get Python server status');
        } catch (error) {
            console.error('Error getting Python server status:', error);
            return { running: false, url: '' };
        }
    }

    /**
     * Start the Python server
     */
    static async start(): Promise<boolean> {
        try {
            const response = await window.api.pythonServerStart();
            return response.success;
        } catch (error) {
            console.error('Error starting Python server:', error);
            return false;
        }
    }

    /**
     * Stop the Python server
     */
    static async stop(): Promise<boolean> {
        try {
            const response = await window.api.pythonServerStop();
            return response.success;
        } catch (error) {
            console.error('Error stopping Python server:', error);
            return false;
        }
    }

    /**
     * Get data from the Python server
     */
    static async getData(): Promise<any> {
        try {
            const response = await window.api.pythonServerRequest('GET', '/api/data');
            if (response.success) {
                return response.data;
            }
            throw new Error(response.error || 'Failed to get data from Python server');
        } catch (error) {
            console.error('Error getting data from Python server:', error);
            throw error;
        }
    }

    /**
     * Add data to the Python server
     */
    static async addData(key: string, value: any): Promise<any> {
        try {
            const data = { key, ...value };
            const response = await window.api.pythonServerRequest('POST', '/api/data', data);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.error || 'Failed to add data to Python server');
        } catch (error) {
            console.error('Error adding data to Python server:', error);
            throw error;
        }
    }

    /**
     * Delete data from the Python server
     */
    static async deleteData(key: string): Promise<any> {
        try {
            const response = await window.api.pythonServerRequest('DELETE', `/api/data/${key}`);
            if (response.success) {
                return response.data;
            }
            throw new Error(response.error || 'Failed to delete data from Python server');
        } catch (error) {
            console.error('Error deleting data from Python server:', error);
            throw error;
        }
    }
} 