import { FlowService, Flow } from '../services/FlowService';
import { Node, Edge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

export class FlowController {
    /**
     * Get all flows
     */
    async getFlows(): Promise<Flow[]> {
        try {
            return await FlowService.getFlows();
        } catch (error) {
            console.error('Error getting flows:', error);
            return [];
        }
    }

    /**
     * Get a specific flow
     */
    async getFlow(id: string): Promise<Flow | null> {
        try {
            return await FlowService.getFlow(id);
        } catch (error) {
            console.error(`Error getting flow ${id}:`, error);
            return null;
        }
    }

    /**
     * Create a new flow
     */
    async createFlow(name?: string): Promise<Flow | null> {
        try {
            return await FlowService.createFlow(name);
        } catch (error) {
            console.error('Error creating flow:', error);
            return null;
        }
    }

    /**
     * Save a flow
     */
    async saveFlow(flow: Flow): Promise<boolean> {
        try {
            return await FlowService.saveFlow(flow);
        } catch (error) {
            console.error('Error saving flow:', error);
            return false;
        }
    }

    /**
     * Delete a flow
     */
    async deleteFlow(id: string): Promise<boolean> {
        try {
            return await FlowService.deleteFlow(id);
        } catch (error) {
            console.error(`Error deleting flow ${id}:`, error);
            return false;
        }
    }

    /**
     * Add a node to a flow
     */
    createNode(x: number, y: number, label: string = 'New Node'): Node {
        return {
            id: `node-${uuidv4()}`,
            type: 'basicNode',
            position: { x, y },
            data: {
                label,
                content: ''
            }
        };
    }

    /**
     * Create an edge between nodes
     */
    createEdge(source: string, target: string): Edge {
        return {
            id: `edge-${uuidv4()}`,
            source,
            target
        };
    }
}

// Create a singleton instance
export const flowController = new FlowController(); 