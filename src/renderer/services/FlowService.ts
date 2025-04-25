import { PythonServerService } from './PythonServerService';
import { Node, Edge } from '@xyflow/react';

// Simple random ID generator (doesn't rely on Node.js crypto)
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

export interface Flow {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: string;
    updatedAt: string;
}

export class FlowService {
    /**
     * Get all flows from the server
     */
    static async getFlows(): Promise<Flow[]> {
        try {
            console.log('FlowService.getFlows: Starting to fetch flows');

            // Ensure Python server is running
            const serverStatus = await PythonServerService.getStatus();
            console.log('FlowService.getFlows: Server status:', serverStatus);

            if (!serverStatus.running) {
                console.log('FlowService.getFlows: Server not running, starting it');
                await PythonServerService.start();
            }

            console.log('FlowService.getFlows: Making request to /api/flows');
            const response = await window.api.pythonServerRequest('GET', '/api/flows');
            console.log('FlowService.getFlows: Response received:', response);

            if (response.success) {
                const flows = response.data || [];
                console.log(`FlowService.getFlows: Received ${flows.length} flows`);
                return flows;
            }

            throw new Error(response.error || 'Failed to get flows');
        } catch (error) {
            console.error('Error getting flows:', error);
            return [];
        }
    }

    /**
     * Get a specific flow by ID
     */
    static async getFlow(id: string): Promise<Flow | null> {
        try {
            console.log(`FlowService.getFlow: Fetching flow with ID ${id}`);
            const response = await window.api.pythonServerRequest('GET', `/api/flows/${id}`);
            console.log(`FlowService.getFlow: Response for flow ${id}:`, response);

            if (response.success) {
                return response.data;
            }
            throw new Error(response.error || `Failed to get flow with ID ${id}`);
        } catch (error) {
            console.error(`Error getting flow ${id}:`, error);
            return null;
        }
    }

    /**
     * Create a new flow
     */
    static async createFlow(name: string = 'New Flow'): Promise<Flow | null> {
        try {
            const newFlow: Flow = {
                id: generateId(),
                name,
                nodes: [],
                edges: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            console.log('FlowService.createFlow: Creating new flow:', newFlow);
            const response = await window.api.pythonServerRequest('POST', '/api/flows', newFlow);
            console.log('FlowService.createFlow: Response:', response);

            if (response.success) {
                return newFlow;
            }
            throw new Error(response.error || 'Failed to create flow');
        } catch (error) {
            console.error('Error creating flow:', error);
            return null;
        }
    }

    /**
     * Save a flow
     */
    static async saveFlow(flow: Flow): Promise<boolean> {
        try {
            // Update the timestamp
            flow.updatedAt = new Date().toISOString();

            console.log(`FlowService.saveFlow: Saving flow ${flow.id}`);
            const response = await window.api.pythonServerRequest('POST', '/api/flows', flow);
            console.log(`FlowService.saveFlow: Response for flow ${flow.id}:`, response);

            return response.success;
        } catch (error) {
            console.error('Error saving flow:', error);
            return false;
        }
    }

    /**
     * Delete a flow
     */
    static async deleteFlow(id: string): Promise<boolean> {
        try {
            console.log(`FlowService.deleteFlow: Deleting flow ${id}`);
            const response = await window.api.pythonServerRequest('DELETE', `/api/flows/${id}`);
            console.log(`FlowService.deleteFlow: Response for flow ${id}:`, response);

            return response.success;
        } catch (error) {
            console.error(`Error deleting flow ${id}:`, error);
            return false;
        }
    }
} 