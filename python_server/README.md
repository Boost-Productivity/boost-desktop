# Python Server for Boost Desktop

This directory contains a simple Python Flask server that runs as a background process when the Electron app starts.

## Purpose

The Python server provides a backend API for the Electron app to store and retrieve data. It can be used for:

- Data persistence outside of Electron's storage
- Running Python-specific code or libraries
- Executing CPU-intensive tasks without blocking the main Electron process
- Serving as a node for distributed processing

## API Endpoints

The server exposes the following REST API endpoints:

- `GET /api/health` - Check if the server is running
- `GET /api/data` - Get all stored data
- `POST /api/data` - Add new data (requires a key in the JSON payload)
- `DELETE /api/data/<key>` - Delete data by key

## Architecture

The Python server is started automatically when the Electron app starts. The `pythonServer.ts` module handles starting and stopping the server, and the `pythonServerIPC.ts` module provides IPC endpoints for the renderer process to interact with the server.

## Development

To modify the server:

1. Update the `server.py` file with your changes
2. Restart the Electron app to apply the changes

## Requirements

- Python 3.6+
- Flask

The requirements are specified in `requirements.txt` and should be installed when building the app. 