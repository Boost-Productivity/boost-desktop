import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
    Background,
    Controls,
    Panel,
    ReactFlowProvider,
    ConnectionLineType,
    useReactFlow,
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useFlowStore from '../../lib/flowStore';
import { nodeTypes } from '../flow/nodeRegistry';
import NodeTypeSelector from '../flow/NodeTypeSelector';
import { PythonServerService } from '../../services/PythonServerService';

// Flow Sidebar Component
const FlowSidebar = () => {
    const {
        flows,
        currentFlowId,
        loadFlow,
        createFlow,
        deleteFlow
    } = useFlowStore();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCreateFlow = () => {
        const flowName = `Flow-${Math.random().toString(36).slice(2, 7)}`;
        createFlow(flowName);
    };

    return (
        <div className="flow-sidebar">
            <div className="flow-sidebar-header">
                <h3>My Flows</h3>
                <button onClick={handleCreateFlow} title="Create new flow">
                    + New
                </button>
            </div>
            <ul className="flow-list">
                {flows.length === 0 ? (
                    <li className="flow-list-item">
                        <span className="flow-list-item-name">No flows yet</span>
                    </li>
                ) : (
                    flows.map((flow) => (
                        <li
                            key={flow.id}
                            className={`flow-list-item ${flow.id === currentFlowId ? 'active' : ''}`}
                            onClick={() => loadFlow(flow.id)}
                        >
                            <div className="flow-list-item-content">
                                <span className="flow-list-item-name">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'text-bottom' }}
                                    >
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    {flow.name}
                                </span>
                                <div className="flow-list-item-date">Updated: {formatDate(flow.updatedAt)}</div>
                            </div>
                            <div className="flow-list-item-actions">
                                <button
                                    className="flow-list-item-action delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete flow "${flow.name}"?`)) {
                                            deleteFlow(flow.id);
                                        }
                                    }}
                                    title="Delete flow"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

// The main Flow component needs to be inside the ReactFlowProvider
const Flow = () => {
    const reactFlowInstance = useReactFlow();
    const {
        nodes: storeNodes,
        edges: storeEdges,
        addNode,
        currentFlowId,
        flows,
        createFlow,
        saveFlow
    } = useFlowStore();

    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [nodePlacementPosition, setNodePlacementPosition] = useState({ x: 0, y: 0 });

    // Use React Flow's optimized state hooks
    const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

    // Update local state when store nodes/edges change
    useEffect(() => {
        setNodes(storeNodes);
    }, [storeNodes, setNodes]);

    useEffect(() => {
        setEdges(storeEdges);
    }, [storeEdges, setEdges]);

    // Save changes to the server after operations
    const onConnect = useCallback((params) => {
        setEdges((eds) => {
            const newEdges = addEdge(params, eds);
            setTimeout(() => saveFlow(), 100);
            return newEdges;
        });
    }, [saveFlow]);

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Add new node at the center of the viewport
    const handleAddNode = useCallback(() => {
        if (!reactFlowInstance) return;

        const center = reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        // Store position and show selector
        setNodePlacementPosition(center);
        setShowTypeSelector(true);
    }, [reactFlowInstance]);

    // Handle node type selection
    const handleNodeTypeSelect = useCallback((type: string) => {
        addNode(nodePlacementPosition, type);
        setShowTypeSelector(false);
    }, [addNode, nodePlacementPosition]);

    return (
        <div className="flow-editor">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onDragOver={onDragOver}
                connectionLineType={ConnectionLineType.Bezier}
                defaultEdgeOptions={{ type: 'default', animated: true }}
                proOptions={{ hideAttribution: true }}
                fitView
                style={{ background: '#f8f8f8', width: '100%', height: '100%' }}
            >
                <Background color="#aaa" gap={16} />
                <Controls />
                <Panel position="top-right" className="flex gap-2">
                    <button
                        className="flow-add-button"
                        onClick={handleAddNode}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginRight: '4px' }}
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Node
                    </button>
                </Panel>
            </ReactFlow>

            {/* Node Type Selector Modal */}
            {showTypeSelector && (
                <div className="type-selector-overlay">
                    <NodeTypeSelector
                        onSelectType={handleNodeTypeSelect}
                        onCancel={() => setShowTypeSelector(false)}
                    />
                </div>
            )}
        </div>
    );
};

// Main component
const FlowPage: React.FC = () => {
    const {
        loadFlows,
        loading,
        error
    } = useFlowStore();

    const initialized = useRef(false);

    useEffect(() => {
        const init = async () => {
            // Check if Python server is running
            const serverStatus = await PythonServerService.getStatus();

            if (!serverStatus.running) {
                try {
                    await PythonServerService.start();
                } catch (error) {
                    console.error('Failed to start Python server:', error);
                }
            }

            // Load flows
            loadFlows();
        };

        if (!initialized.current) {
            initialized.current = true;
            init();
        }
    }, [loadFlows]);

    if (loading) {
        return (
            <div className="flow-page h-full w-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading flow...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flow-page h-full w-full flex items-center justify-center">
                <div className="text-center p-8 max-w-md bg-red-50 rounded-lg shadow-md">
                    <p className="text-red-500 font-bold text-lg mb-2">Error</p>
                    <p className="text-gray-700">{error}</p>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                        onClick={() => loadFlows()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flow-page" style={{ width: '100%', height: 'calc(100vh - 80px)', position: 'relative' }}>
            <FlowSidebar />
            <ReactFlowProvider>
                <Flow />
            </ReactFlowProvider>
        </div>
    );
};

export default FlowPage; 