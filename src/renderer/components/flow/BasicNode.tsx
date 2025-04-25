import React from 'react';
import BaseNode, { BaseNodeData } from './BaseNode';

interface BasicNodeProps {
    data: BaseNodeData;
}

const BasicNode: React.FC<BasicNodeProps> = ({ data }) => {
    return (
        <BaseNode data={data}>
            <div className="p-4 rounded-lg shadow-md border border-gray-300 bg-white">
                <div className="font-medium text-gray-900 mb-2">
                    {data?.label || 'Node'}
                </div>

                {data?.content && (
                    <div className="text-sm text-gray-600 overflow-hidden max-h-24">
                        {data.content}
                    </div>
                )}
            </div>
        </BaseNode>
    );
};

export default BasicNode; 