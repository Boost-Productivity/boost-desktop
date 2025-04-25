import React, { useState, useEffect } from 'react';
import { PythonServerService } from '../../services/PythonServerService';

interface ServerData {
    [key: string]: any;
}

const PythonServerTest: React.FC = () => {
    const [serverStatus, setServerStatus] = useState<{ running: boolean; url: string }>({
        running: false,
        url: ''
    });
    const [serverData, setServerData] = useState<ServerData>({});
    const [newKey, setNewKey] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Check server status on component mount
    useEffect(() => {
        checkServerStatus();
    }, []);

    // Function to check the server status
    const checkServerStatus = async () => {
        try {
            setLoading(true);
            const status = await PythonServerService.getStatus();
            setServerStatus(status);
            if (status.running) {
                await fetchData();
            }
        } catch (err) {
            setError(`Error checking server status: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Start the Python server
    const startServer = async () => {
        try {
            setLoading(true);
            setError(null);
            const started = await PythonServerService.start();
            if (started) {
                await checkServerStatus();
            } else {
                setError('Failed to start Python server');
            }
        } catch (err) {
            setError(`Error starting server: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Stop the Python server
    const stopServer = async () => {
        try {
            setLoading(true);
            setError(null);
            const stopped = await PythonServerService.stop();
            if (stopped) {
                setServerStatus({ running: false, url: '' });
                setServerData({});
            } else {
                setError('Failed to stop Python server');
            }
        } catch (err) {
            setError(`Error stopping server: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data from the server
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await PythonServerService.getData();
            setServerData(data);
        } catch (err) {
            setError(`Error fetching data: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Add new data to the server
    const addData = async () => {
        if (!newKey.trim()) {
            setError('Key is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await PythonServerService.addData(newKey, { value: newValue });
            setNewKey('');
            setNewValue('');
            await fetchData();
        } catch (err) {
            setError(`Error adding data: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    // Delete data from the server
    const deleteData = async (key: string) => {
        try {
            setLoading(true);
            setError(null);
            await PythonServerService.deleteData(key);
            await fetchData();
        } catch (err) {
            setError(`Error deleting data: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="python-server-test">
            <h2>Python Server Test</h2>

            <div className="server-status">
                <h3>Server Status</h3>
                <p>Running: {serverStatus.running ? 'Yes' : 'No'}</p>
                {serverStatus.running && <p>URL: {serverStatus.url}</p>}

                <div className="server-controls">
                    {!serverStatus.running ? (
                        <button onClick={startServer} disabled={loading}>
                            Start Server
                        </button>
                    ) : (
                        <button onClick={stopServer} disabled={loading}>
                            Stop Server
                        </button>
                    )}
                    <button onClick={checkServerStatus} disabled={loading}>
                        Refresh Status
                    </button>
                </div>
            </div>

            {serverStatus.running && (
                <>
                    <div className="add-data">
                        <h3>Add Data</h3>
                        <div>
                            <input
                                type="text"
                                placeholder="Key"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Value"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                            <button onClick={addData} disabled={loading}>
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="server-data">
                        <h3>Server Data</h3>
                        <button onClick={fetchData} disabled={loading}>
                            Refresh Data
                        </button>

                        {Object.keys(serverData).length === 0 ? (
                            <p>No data available</p>
                        ) : (
                            <ul>
                                {Object.entries(serverData).map(([key, data]) => (
                                    <li key={key}>
                                        <strong>{key}</strong>: {JSON.stringify(data)}
                                        <button onClick={() => deleteData(key)} disabled={loading}>
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}

            {error && <div className="error">{error}</div>}
            {loading && <div className="loading">Loading...</div>}
        </div>
    );
};

export default PythonServerTest; 