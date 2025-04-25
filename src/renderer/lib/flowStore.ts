import { create } from 'zustand';
import {
    Node,
    Edge,
    Connection
} from '@xyflow/react';
import { FlowService } from '../services/FlowService';

// Simple random ID generator (doesn't rely on Node.js crypto)
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

interface Flow {
    id: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: string;
    updatedAt: string;
}

interface FlowState {
    // Flow data
    flows: Flow[];
    currentFlowId: string | null;
    nodes: Node[];
    edges: Edge[];
    selectedNodeId: string | null;

    // UI state
    loading: boolean;
    error: string | null;

    // Flow operations
    loadFlows: () => Promise<void>;
    loadFlow: (flowId: string) => Promise<void>;
    createFlow: (name?: string) => Promise<void>;
    saveFlow: () => Promise<void>;
    deleteFlow: (flowId: string) => Promise<void>;

    // Node operations
    addNode: (position: { x: number, y: number }, label?: string) => void;
    updateNode: (nodeId: string, data: any) => void;
    deleteNode: (nodeId: string) => void;
    selectNode: (nodeId: string | null) => void;
}

const useFlowStore = create<FlowState>((set, get) => ({
    // Initial state
    flows: [],
    currentFlowId: null,
    nodes: [],
    edges: [],
    selectedNodeId: null,
    loading: false,
    error: null,

    // Flow operations
    loadFlows: async () => {
        try {
            set({ loading: true, error: null });
            const flows = await FlowService.getFlows();
            set({ flows });

            // If there's at least one flow, load the first one
            if (flows.length > 0) {
                await get().loadFlow(flows[0].id);
            }
        } catch (error) {
            set({ error: 'Failed to load flows' });
            console.error('Error loading flows:', error);
        } finally {
            set({ loading: false });
        }
    },

    loadFlow: async (flowId) => {
        try {
            set({ loading: true, error: null });
            const flow = await FlowService.getFlow(flowId);

            console.log('loadFlow received flow data:', flow);

            if (flow) {
                // Ensure nodes and edges are properly initialized and have the correct format
                let nodes = [];
                let edges = [];

                if (Array.isArray(flow.nodes)) {
                    nodes = flow.nodes;
                } else {
                    console.warn('Flow nodes is not an array, initializing empty array');
                }

                if (Array.isArray(flow.edges)) {
                    edges = flow.edges;
                } else {
                    console.warn('Flow edges is not an array, initializing empty array');
                }

                console.log('Setting nodes and edges:', { nodes, edges });

                set({
                    currentFlowId: flow.id,
                    nodes,
                    edges
                });

                // If there are no nodes, create a default node
                if (nodes.length === 0) {
                    console.log('No nodes found in flow, creating a default node');
                    const initialNode = {
                        id: `node-${generateId()}`,
                        type: 'default',
                        position: { x: 250, y: 150 },
                        data: { label: 'New Node' }
                    };

                    set(state => ({
                        nodes: [initialNode]
                    }));

                    // Save the updated flow with the new node
                    setTimeout(() => get().saveFlow(), 100);
                }
            } else {
                set({ error: `Flow with ID ${flowId} not found` });
            }
        } catch (error) {
            set({ error: 'Failed to load flow' });
            console.error(`Error loading flow ${flowId}:`, error);
        } finally {
            set({ loading: false });
        }
    },

    createFlow: async (name = 'New Flow') => {
        try {
            set({ loading: true, error: null });

            // Start with a single node
            const initialNode = {
                id: `node-${generateId()}`,
                type: 'default',
                position: { x: 250, y: 150 },
                data: { label: 'New Node' }
            };

            // Create flow data
            const newFlow = await FlowService.createFlow(name);

            if (newFlow) {
                // Add the initial node to the flow
                newFlow.nodes = [initialNode];
                await FlowService.saveFlow(newFlow);

                // Update local state
                set(state => ({
                    flows: [...state.flows, newFlow],
                    currentFlowId: newFlow.id,
                    nodes: [initialNode],
                    edges: []
                }));
            }
        } catch (error) {
            set({ error: 'Failed to create flow' });
            console.error('Error creating flow:', error);
        } finally {
            set({ loading: false });
        }
    },

    saveFlow: async () => {
        const { currentFlowId, nodes, edges, flows } = get();

        if (!currentFlowId) return;

        try {
            // Find the current flow
            const currentFlow = flows.find(f => f.id === currentFlowId);

            if (currentFlow) {
                // Update the flow with current nodes and edges
                const updatedFlow = {
                    ...currentFlow,
                    nodes,
                    edges,
                    updatedAt: new Date().toISOString()
                };

                // Save to server
                await FlowService.saveFlow(updatedFlow);

                // Update local state
                set(state => ({
                    flows: state.flows.map(f =>
                        f.id === currentFlowId ? updatedFlow : f
                    )
                }));
            }
        } catch (error) {
            console.error('Error saving flow:', error);
        }
    },

    deleteFlow: async (flowId) => {
        try {
            set({ loading: true, error: null });

            // Delete from server
            await FlowService.deleteFlow(flowId);

            // Update local state
            set(state => {
                const newFlows = state.flows.filter(f => f.id !== flowId);

                // If we deleted the current flow, load another one if available
                let newCurrentFlowId = state.currentFlowId;
                let newNodes = state.nodes;
                let newEdges = state.edges;

                if (state.currentFlowId === flowId) {
                    if (newFlows.length > 0) {
                        // We'll load the first available flow
                        newCurrentFlowId = newFlows[0].id;
                        newNodes = newFlows[0].nodes || [];
                        newEdges = newFlows[0].edges || [];
                    } else {
                        // No flows left
                        newCurrentFlowId = null;
                        newNodes = [];
                        newEdges = [];
                    }
                }

                return {
                    flows: newFlows,
                    currentFlowId: newCurrentFlowId,
                    nodes: newNodes,
                    edges: newEdges
                };
            });
        } catch (error) {
            set({ error: 'Failed to delete flow' });
            console.error(`Error deleting flow ${flowId}:`, error);
        } finally {
            set({ loading: false });
        }
    },

    // Node operations
    addNode: (position, label = 'New Node') => {
        const newNode = {
            id: `node-${generateId()}`,
            type: 'default',
            position,
            data: { label }
        };

        set(state => ({
            nodes: [...state.nodes, newNode]
        }));

        // Save changes
        setTimeout(() => get().saveFlow(), 100);
    },

    updateNode: (nodeId, data) => {
        set(state => ({
            nodes: state.nodes.map(node =>
                node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
            )
        }));

        // Save changes
        setTimeout(() => get().saveFlow(), 100);
    },

    deleteNode: (nodeId) => {
        set(state => ({
            nodes: state.nodes.filter(node => node.id !== nodeId),
            edges: state.edges.filter(
                edge => edge.source !== nodeId && edge.target !== nodeId
            ),
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
        }));

        // Save changes
        setTimeout(() => get().saveFlow(), 100);
    },

    selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
    }
}));

export default useFlowStore; 