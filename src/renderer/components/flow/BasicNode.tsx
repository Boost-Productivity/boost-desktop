import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Define the shape of our node data
interface NodeData {
    label?: string;
    content?: string;
}

interface BasicNodeProps {
    data: NodeData;
}

const BasicNode: React.FC<BasicNodeProps> = ({ data }) => {
    return (
        <div className="p-4 rounded-lg shadow-md border border-gray-300 bg-white"
            style={{ minWidth: 150, maxWidth: 250 }}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-500" />

            <div className="font-medium text-gray-900 mb-2">
                {data?.label || 'Node'}
            </div>

            {data?.content && (
                <div className="text-sm text-gray-600 overflow-hidden max-h-24">
                    {data.content}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-500" />
        </div>
    );
};

export default BasicNode; 