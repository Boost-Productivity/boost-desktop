import React from 'react';
import { NODE_TYPES, getNodeTypeName } from './nodeRegistry';

interface NodeTypeSelectorProps {
    onSelectType: (type: string) => void;
    onCancel: () => void;
}

const NodeTypeSelector: React.FC<NodeTypeSelectorProps> = ({
    onSelectType,
    onCancel
}) => {
    return (
        <div className="node-type-selector">
            <div className="node-type-selector-header">
                <h3>Select Node Type</h3>
                <button className="close-button" onClick={onCancel}>
                    ✕
                </button>
            </div>
            <div className="node-type-list">
                {Object.values(NODE_TYPES).map(type => (
                    <button
                        key={type}
                        className="node-type-option"
                        onClick={() => onSelectType(type)}
                    >
                        {getNodeTypeName(type)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NodeTypeSelector; 