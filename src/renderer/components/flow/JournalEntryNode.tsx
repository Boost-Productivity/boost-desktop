import React, { useState, useRef, useEffect } from 'react';
import useFlowStore from '../../lib/flowStore';
import BaseNode from './BaseNode';
import { JournalEntryNodeData } from './nodeTypes';

interface JournalEntryNodeProps {
    id: string;
    data: JournalEntryNodeData;
}

function JournalEntryNode({ id, data }: JournalEntryNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [journalText, setJournalText] = useState(data?.journalText || '');
    const [label, setLabel] = useState(data?.label || 'Journal Entry');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const updateNode = useFlowStore(state => state.updateNode);
    const deleteNode = useFlowStore(state => state.deleteNode);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Handle edit mode focus
    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
        }
    }, [isEditingLabel]);

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

    // Handle submit
    const handleSubmit = () => {
        updateNode(id, {
            ...data,
            journalText,
            label,
            date: new Date().toISOString()
        });
        setIsEditing(false);
    };

    // Handle label change
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    // Handle label submit
    const handleLabelSubmit = () => {
        updateNode(id, { ...data, label });
        setIsEditingLabel(false);
    };

    // Handle delete
    const handleDelete = () => {
        if (confirm(`Delete "${data?.label || 'Journal Entry'}"?`)) {
            deleteNode(id);
        }
        setShowMenu(false);
    };

    // Node content UI
    const nodeContent = (
        <div className="flow-node-card journal-entry-node">
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
                                onClick={() => {
                                    setIsEditingLabel(true);
                                    setShowMenu(false);
                                }}
                            >
                                Edit title
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

            <div className="flow-node-content">
                {/* Title section */}
                {isEditingLabel ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleLabelSubmit(); }} className="flow-node-title-form">
                        <input
                            ref={labelInputRef}
                            value={label}
                            onChange={handleLabelChange}
                            className="flow-node-title-input"
                            onBlur={handleLabelSubmit}
                            autoFocus
                        />
                    </form>
                ) : (
                    <h3 className="flow-node-title">
                        {label || 'Journal Entry'}
                    </h3>
                )}

                {/* Journal content section */}
                {isEditing ? (
                    <div className="journal-entry-edit">
                        <textarea
                            ref={textAreaRef}
                            value={journalText}
                            onChange={(e) => setJournalText(e.target.value)}
                            className="journal-entry-textarea"
                            placeholder="Write your journal entry..."
                            rows={4}
                            onBlur={handleSubmit}
                        />
                        <div className="journal-entry-actions">
                            <button onClick={handleSubmit} className="todo-button journal-save-button">Save</button>
                            <button onClick={() => setIsEditing(false)} className="todo-button journal-cancel-button">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="journal-entry-display"
                        onClick={() => setIsEditing(true)}
                    >
                        {journalText ? (
                            <p className="journal-text">{journalText}</p>
                        ) : (
                            <p className="journal-placeholder">Click to add a journal entry...</p>
                        )}
                        {data.date && (
                            <div className="journal-date">
                                Last updated: {new Date(data.date).toLocaleString()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <BaseNode
            id={id}
            data={data}
            onDoubleClick={() => setIsEditing(true)}
        >
            {nodeContent}
        </BaseNode>
    );
}

export default JournalEntryNode; 