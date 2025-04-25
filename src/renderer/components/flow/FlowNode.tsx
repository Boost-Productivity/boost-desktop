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
        <div
            className="px-4 py-3 rounded-lg shadow-md border border-gray-200 bg-white"
            style={{ minWidth: 180, maxWidth: 250 }}
            onDoubleClick={handleDoubleClick}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-2 h-2 bg-blue-500"
            />

            {isEditing ? (
                <form onSubmit={handleSubmit} className="my-1">
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
                <div className="flex justify-between items-center my-1">
                    <div className="font-medium text-gray-900 truncate flex-1">
                        {data?.label || 'Node'}
                    </div>
                    <button
                        className="text-red-500 text-xs ml-2 hover:text-red-700"
                        onClick={handleDelete}
                        title="Delete node"
                    >
                        ×
                    </button>
                </div>
            )}

            {data?.content && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="max-h-20 overflow-y-auto">
                        {data.content}
                    </div>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-2 h-2 bg-blue-500"
            />
        </div>
    );
}

export default FlowNode; 