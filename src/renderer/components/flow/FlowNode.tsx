import React, { useState, useRef, useEffect } from 'react';
import useFlowStore from '../../lib/flowStore';
import BaseNode, { BaseNodeData } from './BaseNode';

interface FlowNodeProps {
    id: string;
    data: BaseNodeData;
}

// Simple node component that avoids type issues with React Flow
function FlowNode({ id, data }: FlowNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [label, setLabel] = useState(data?.label || 'Node');
    const [description, setDescription] = useState(data?.description || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const updateNode = useFlowStore(state => state.updateNode);
    const deleteNode = useFlowStore(state => state.deleteNode);

    // When entering edit mode, focus the input
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isEditingDescription && descriptionRef.current) {
            descriptionRef.current.focus();
        }
    }, [isEditingDescription]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle double click to start editing
    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    // Handle label change
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    // Handle description change
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        updateNode(id, { label, description });
        setIsEditing(false);
    };

    // Handle description form submission
    const handleDescriptionSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        updateNode(id, { label, description });
        setIsEditingDescription(false);
    };

    // Handle delete
    const handleDelete = () => {
        if (confirm(`Delete node "${data?.label || 'Node'}"?`)) {
            deleteNode(id);
        }
        setShowMenu(false);
    };

    // Toggle description editing
    const handleEditDescription = () => {
        setIsEditingDescription(true);
        setShowMenu(false);
    };

    // Render the node content
    const nodeContent = (
        <div className="flow-node-card">
            {/* Header with drag handle and actions */}
            <div className="flow-node-header">
                <div className="dragHandle">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                            fill="#9ca3af"
                            stroke="#9ca3af"
                            strokeWidth="1"
                            d="M15 5h2V3h-2v2zM7 5h2V3H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2zm8 8h2v-2h-2v2zm-8 0h2v-2H7v2z"
                        />
                    </svg>
                </div>

                <div className="flow-node-actions">
                    <button
                        className="flow-node-action more"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        title="More options"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    </button>

                    {showMenu && (
                        <div
                            ref={menuRef}
                            className="flow-node-menu"
                        >
                            <button
                                className="flow-node-menu-item"
                                onClick={handleEditDescription}
                            >
                                {description ? 'Edit description' : 'Add description'}
                            </button>
                            <button
                                className="flow-node-menu-item delete"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                            <div className="flow-node-menu-divider"></div>
                            <button
                                className="flow-node-menu-item cancel"
                                onClick={() => setShowMenu(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Title section */}
            <div className="flow-node-content">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="flow-node-title-form">
                        <input
                            ref={inputRef}
                            value={label}
                            onChange={handleLabelChange}
                            className="flow-node-title-input"
                            onBlur={handleSubmit}
                            autoFocus
                        />
                    </form>
                ) : (
                    <h3 className="flow-node-title">
                        {data?.label || 'Node'}
                    </h3>
                )}

                {/* Description section */}
                {isEditingDescription ? (
                    <form onSubmit={handleDescriptionSubmit} className="flow-node-description-form">
                        <textarea
                            ref={descriptionRef}
                            value={description}
                            onChange={handleDescriptionChange}
                            className="flow-node-description-input"
                            placeholder="Add a description..."
                            rows={2}
                            onBlur={handleDescriptionSubmit}
                            autoFocus
                        />
                    </form>
                ) : (
                    <p
                        className="flow-node-description"
                        onClick={() => setIsEditingDescription(true)}
                    >
                        {description || <span className="description-placeholder">Add a description...</span>}
                    </p>
                )}

                {/* Content section if it exists */}
                {data?.content && (
                    <div className="flow-node-custom-content">
                        {data.content}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <BaseNode
            id={id}
            data={data}
            onDoubleClick={handleDoubleClick}
        >
            {nodeContent}
        </BaseNode>
    );
}

export default FlowNode; 