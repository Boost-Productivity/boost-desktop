import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import useFlowStore from '../../lib/flowStore';

// Define our node data structure
interface NodeData {
    label: string;
    content?: string;
}

interface FlowNodeProps {
    id: string;
    data: any;
}

// Simple node component that avoids type issues with React Flow
function FlowNode({ id, data }: FlowNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data?.label || 'Node');
    const inputRef = useRef<HTMLInputElement>(null);
    const updateNode = useFlowStore(state => state.updateNode);
    const deleteNode = useFlowStore(state => state.deleteNode);

    // When entering edit mode, focus the input
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Handle double click to start editing
    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    // Handle label change
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateNode(id, { label });
        setIsEditing(false);
    };

    // Handle delete
    const handleDelete = () => {
        deleteNode(id);
    };

    return (
        <>
            {/* Top handle (target) */}
            <Handle
                type="target"
                position={Position.Top}
            />

            <div
                className="flow-node rounded-lg shadow-md border border-gray-200 bg-white"
                style={{ minWidth: 180, maxWidth: 250 }}
                onDoubleClick={handleDoubleClick}
            >
                <div className="inputWrapper">
                    <div className="dragHandle">
                        {/* Drag handle icon */}
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path
                                fill="#6b7280"
                                stroke="#6b7280"
                                strokeWidth="1"
                                d="M15 5h2V3h-2v2zM7 5h2V3H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2z"
                            />
                        </svg>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="w-full">
                            <input
                                ref={inputRef}
                                value={label}
                                onChange={handleLabelChange}
                                className="w-full p-1 border border-gray-300 rounded text-sm"
                                onBlur={handleSubmit}
                                autoFocus
                            />
                        </form>
                    ) : (
                        <div className="flex justify-between items-center w-full">
                            <div className="font-medium text-gray-900 truncate flex-1">
                                {data?.label || 'Node'}
                            </div>
                            <button
                                className="flow-node-action delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete node "${data?.label || 'Node'}"?`)) {
                                        handleDelete();
                                    }
                                }}
                                title="Delete node"
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
                    )}
                </div>

                {data?.content && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded border border-gray-200">
                        <div className="max-h-20 overflow-y-auto">
                            {data.content}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom handle (source) */}
            <Handle
                type="source"
                position={Position.Bottom}
            />
        </>
    );
}

export default FlowNode; 