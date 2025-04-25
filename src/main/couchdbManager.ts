import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess, exec } from 'child_process';
import axios from 'axios';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class CouchDBManager {
    private process: ChildProcess | null = null;
    private couchdbPort: number = 5984;
    private couchdbUrl: string = `http://localhost:${this.couchdbPort}`;
    private couchdbPath: string = '';
    private dbDir: string = '';
    private adminUser: string = 'admin';
    private adminPassword: string = 'password';
    private initialized: boolean = false;

    constructor() {
        this.setupPaths();
    }

    /**
     * Setup paths for CouchDB based on environment
     */
    private setupPaths() {
        try {
            // Set up the database directory in userData
            this.dbDir = path.join(app.getPath('userData'), 'couchdb-data');

            if (!fs.existsSync(this.dbDir)) {
                fs.mkdirSync(this.dbDir, { recursive: true });
            }

            // Determine CouchDB executable path based on platform and dev/prod environment
            if (app.isPackaged) {
                // Production mode
                if (process.platform === 'darwin') {
                    // MacOS
                    this.couchdbPath = path.join(process.resourcesPath, 'couchdb', 'bin', 'couchdb');
                } else if (process.platform === 'win32') {
                    // Windows
                    this.couchdbPath = path.join(process.resourcesPath, 'couchdb', 'bin', 'couchdb.cmd');
                } else {
                    // Linux
                    this.couchdbPath = path.join(process.resourcesPath, 'couchdb', 'bin', 'couchdb');
                }
            } else {
                // Development mode - depends on where CouchDB is installed
                const projectRoot = app.getAppPath();
                const projectCouchdbPath = path.join(projectRoot, 'couchdb');

                if (process.platform === 'darwin') {
                    // Try the downloaded version first
                    const macDownloadedPath = path.join(projectCouchdbPath, 'Apache CouchDB.app', 'Contents', 'Resources', 'couchdbx-core', 'bin', 'couchdb');
                    console.log(`Checking for CouchDB at: ${macDownloadedPath}`);
                    if (fs.existsSync(macDownloadedPath)) {
                        this.couchdbPath = macDownloadedPath;
                        console.log(`Found downloaded CouchDB at: ${macDownloadedPath}`);
                    } else {
                        // MacOS with Homebrew
                        this.couchdbPath = '/usr/local/bin/couchdb';
                        // If using Apple Silicon Mac with Homebrew
                        if (!fs.existsSync(this.couchdbPath)) {
                            this.couchdbPath = '/opt/homebrew/bin/couchdb';
                        }
                    }
                } else if (process.platform === 'win32') {
                    // Windows
                    const winDownloadedPath = path.join(projectCouchdbPath, 'Apache CouchDB', 'bin', 'couchdb.cmd');
                    if (fs.existsSync(winDownloadedPath)) {
                        this.couchdbPath = winDownloadedPath;
                    } else {
                        this.couchdbPath = 'C:\\Program Files\\Apache CouchDB\\bin\\couchdb.cmd';
                    }
                } else {
                    // Linux
                    this.couchdbPath = '/usr/bin/couchdb';
                }
            }
        } catch (error) {
            console.error('Error setting up CouchDB paths:', error);
        }
    }

    /**
     * Start the CouchDB process
     */
    async start(): Promise<boolean> {
        try {
            console.log('Starting CouchDB...');

            // Check if CouchDB is already running
            try {
                const response = await axios.get(this.couchdbUrl);
                if (response.status === 200) {
                    console.log('CouchDB is already running');
                    return this.initializeAdmin();
                }
            } catch (error) {
                // CouchDB is not running, which is expected
                console.log('CouchDB is not running, will start it');
            }

            // Create the config file
            const configPath = path.join(this.dbDir, 'local.ini');

            // Create a new config file with the admin user and single_node=true
            const configContent = `
[couchdb]
database_dir = ${this.dbDir.replace(/\\/g, '/')}
view_index_dir = ${this.dbDir.replace(/\\/g, '/')}
uri_file = ${path.join(this.dbDir, 'couch.uri').replace(/\\/g, '/')}
single_node = true

[httpd]
port = ${this.couchdbPort}
bind_address = 127.0.0.1

[couch_httpd_auth]
require_valid_user = false

[admins]
admin = password

[log]
level = info
            `;

            fs.writeFileSync(configPath, configContent);

            // Log the config file content to verify
            console.log('CouchDB config file content:');
            console.log(fs.readFileSync(configPath, 'utf8'));
            console.log('Config file path:', configPath);

            // Log the command being executed
            console.log('Starting CouchDB with command:', this.couchdbPath, ['-couch_ini', configPath]);

            // Start CouchDB
            this.process = spawn(this.couchdbPath, ['-couch_ini', configPath], {
                env: process.env,
                detached: false,
            });

            // Capture process output
            this.process.stdout.on('data', (data) => {
                console.log(`CouchDB stdout: ${data}`);
            });

            this.process.stderr.on('data', (data) => {
                console.error(`CouchDB stderr: ${data}`);
            });

            // Wait for CouchDB to start
            const isUp = await this.waitForCouchDB(15, 1000);
            if (isUp) {
                return await this.initializeAdmin();
            }

            return false;
        } catch (error) {
            console.error('Error starting CouchDB:', error);
            return false;
        }
    }

    /**
     * Initialize admin user
     */
    private async initializeAdmin(): Promise<boolean> {
        try {
            // Create _users database
            try {
                await axios.put(`${this.couchdbUrl}/_users`);
            } catch (error) {
                // Database might already exist, which is fine
            }

            // Create _replicator database
            try {
                await axios.put(`${this.couchdbUrl}/_replicator`);
            } catch (error) {
                // Database might already exist, which is fine
            }

            return true;
        } catch (error) {
            console.error('Error initializing admin:', error);
            return false;
        }
    }

    /**
     * Wait for CouchDB to start
     */
    private async waitForCouchDB(retries = 10, delay = 1000): Promise<boolean> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(this.couchdbUrl);
                if (response.status === 200) {
                    console.log('CouchDB is up and running');
                    return true;
                }
            } catch (error) {
                console.log(`Waiting for CouchDB (attempt ${i + 1}/${retries})...`);
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.error('CouchDB failed to start after multiple attempts');
        return false;
    }

    /**
     * Stop the CouchDB process
     */
    async stop(): Promise<boolean> {
        if (this.process) {
            this.process.kill();
            this.process = null;
            return true;
        }
        return false;
    }

    /**
     * Get the CouchDB URL for connecting
     */
    getUrl(): string {
        return this.couchdbUrl;
    }

    /**
     * Get the admin credentials
     */
    getCredentials(): { username: string; password: string } {
        return {
            username: this.adminUser,
            password: this.adminPassword,
        };
    }
}
