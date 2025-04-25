import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import axios from 'axios';

class PythonServer {
    private process: ChildProcess | null = null;
    private port: number = 5001;
    private serverUrl: string = `http://localhost:${this.port}`;
    private isRunning: boolean = false;

    /**
     * Start the Python server process
     */
    async start(): Promise<boolean> {
        if (this.isRunning) {
            console.log('Python server is already running');
            return true;
        }

        try {
            // Determine the Python executable path
            // First try 'python3', then 'python' if that fails
            let pythonCommand = 'python3';

            // Determine path to the server.py file
            const serverScriptPath = this.getServerScriptPath();
            console.log(`Server script path: ${serverScriptPath}`);

            if (!fs.existsSync(serverScriptPath)) {
                throw new Error(`Server script not found at ${serverScriptPath}`);
            }

            // Start the Python process
            console.log(`Starting Python server with command: ${pythonCommand} ${serverScriptPath} ${this.port}`);
            this.process = spawn(pythonCommand, [serverScriptPath, this.port.toString()], {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false
            });

            // Set up logging for stdout and stderr
            if (this.process.stdout) {
                this.process.stdout.on('data', (data) => {
                    // Only log critical messages, not every single output line
                    const output = data.toString().trim();
                    if (output.includes('ERROR') || output.includes('CRITICAL')) {
                        console.log(`Python server error: ${output}`);
                    }
                });
            }

            if (this.process.stderr) {
                this.process.stderr.on('data', (data) => {
                    console.error(`Python server stderr: ${data.toString().trim()}`);
                });
            }

            // Handle process exit
            this.process.on('exit', (code, signal) => {
                console.log(`Python server process exited with code ${code} and signal ${signal}`);
                this.isRunning = false;
                this.process = null;
            });

            // Handle process error
            this.process.on('error', (err) => {
                console.error(`Failed to start Python server: ${err.message}`);
                this.isRunning = false;
                this.process = null;
            });

            // Check if the server started successfully by polling the health endpoint
            const serverStarted = await this.waitForServerStart();
            this.isRunning = serverStarted;

            // If the server started successfully, check the /api/flows endpoint directly
            if (serverStarted) {
                try {
                    console.log('Testing /api/flows endpoint directly...');
                    const flowsResponse = await axios.get(`${this.serverUrl}/api/flows`, { timeout: 1000 });
                    console.log('Direct /api/flows response:', flowsResponse.status, flowsResponse.data);
                } catch (err) {
                    console.error('Error testing /api/flows endpoint directly:', err);
                }
            }

            return serverStarted;
        } catch (error) {
            console.error(`Error starting Python server: ${error}`);
            return false;
        }
    }

    /**
     * Stop the Python server process
     */
    stop(): boolean {
        if (!this.process) {
            console.log('No Python server process to stop');
            return true;
        }

        try {
            // Kill the process
            if (process.platform === 'win32') {
                // Windows needs special handling
                spawn('taskkill', ['/pid', `${this.process.pid}`, '/f', '/t']);
            } else {
                // Unix-like systems
                this.process.kill('SIGTERM');
            }

            this.isRunning = false;
            this.process = null;
            console.log('Python server stopped successfully');
            return true;
        } catch (error) {
            console.error(`Error stopping Python server: ${error}`);
            return false;
        }
    }

    /**
     * Check if the server is running
     */
    async isServerRunning(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.serverUrl}/api/health`, { timeout: 1000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the path to the server.py file
     */
    private getServerScriptPath(): string {
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            // In development, use the script from the project root
            return path.join(app.getAppPath(), 'python_server', 'server.py');
        } else {
            // In production, use the script from the resources directory
            return path.join(process.resourcesPath, 'python_server', 'server.py');
        }
    }

    /**
     * Wait for the server to start by polling the health endpoint
     */
    private async waitForServerStart(retries = 10, delay = 500): Promise<boolean> {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Checking if Python server is running (attempt ${i + 1}/${retries})...`);
                const isRunning = await this.isServerRunning();
                if (isRunning) {
                    console.log('Python server is running!');
                    return true;
                }
            } catch (error) {
                console.log(`Server check failed: ${error}`);
            }

            // Wait before trying again
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.error('Python server failed to start after multiple retries');
        return false;
    }

    /**
     * Get the server URL
     */
    getServerUrl(): string {
        return this.serverUrl;
    }
}

// Export a singleton instance
export const pythonServer = new PythonServer(); 