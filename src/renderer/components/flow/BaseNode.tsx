import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface BaseNodeData {
    label?: string;
    description?: string;
    content?: string;
    type?: string;
}

export interface BaseNodeProps {
    id?: string;
    data: BaseNodeData;
    children?: React.ReactNode;
    handlePositions?: {
        top?: number;
        bottom?: number;
    };
    onDoubleClick?: (e: React.MouseEvent) => void;
}

/**
 * BaseNode provides consistent styling and structure for all node types.
 * It handles the React Flow container width issue and provides handles.
 */
const BaseNode: React.FC<BaseNodeProps> = ({
    data,
    children,
    handlePositions = { top: -4, bottom: -4 },
    onDoubleClick,
}) => {
    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                style={{ top: handlePositions.top }}
            />

            <div
                className="xy-flow-node"
                onDoubleClick={onDoubleClick}
            >
                {children}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ bottom: handlePositions.bottom }}
            />
        </>
    );
};

export default BaseNode; 