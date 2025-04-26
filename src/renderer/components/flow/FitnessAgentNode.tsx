import React, { useState, useRef, useEffect } from 'react';
import useFlowStore from '../../lib/flowStore';
import BaseNode from './BaseNode';
import { FitnessAgentNodeData } from './nodeTypes';

interface FitnessAgentNodeProps {
    id: string;
    data: FitnessAgentNodeData;
}

function FitnessAgentNode({ id, data }: FitnessAgentNodeProps) {
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [isEditingExercise, setIsEditingExercise] = useState<number | null>(null);
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [label, setLabel] = useState(data?.label || 'Fitness Plan');
    const [exercises, setExercises] = useState(data?.exercises || []);
    const [notes, setNotes] = useState(data?.notes || '');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // New exercise form fields
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseSets, setNewExerciseSets] = useState(3);
    const [newExerciseReps, setNewExerciseReps] = useState(10);

    const labelInputRef = useRef<HTMLInputElement>(null);
    const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updateNode = useFlowStore(state => state.updateNode);
    const deleteNode = useFlowStore(state => state.deleteNode);

    // Handle edit mode focus
    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
        }
    }, [isEditingLabel]);

    useEffect(() => {
        if (isEditingNotes && notesTextareaRef.current) {
            notesTextareaRef.current.focus();
        }
    }, [isEditingNotes]);

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

    // Handle label change
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    // Handle label submit
    const handleLabelSubmit = () => {
        updateNode(id, { ...data, label });
        setIsEditingLabel(false);
    };

    // Handle notes change
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
    };

    // Handle notes submit
    const handleNotesSubmit = () => {
        updateNode(id, { ...data, notes });
        setIsEditingNotes(false);
    };

    // Handle add exercise
    const handleAddExercise = () => {
        if (!newExerciseName.trim()) return;

        const newExercise = {
            name: newExerciseName,
            sets: newExerciseSets,
            reps: newExerciseReps,
            completed: false
        };

        const updatedExercises = [...exercises, newExercise];
        setExercises(updatedExercises);
        updateNode(id, { ...data, exercises: updatedExercises });

        // Reset form
        setNewExerciseName('');
        setNewExerciseSets(3);
        setNewExerciseReps(10);
        setIsAddingExercise(false);
    };

    // Handle exercise toggle
    const handleToggleExercise = (index: number) => {
        const updatedExercises = [...exercises];
        updatedExercises[index].completed = !updatedExercises[index].completed;
        setExercises(updatedExercises);
        updateNode(id, { ...data, exercises: updatedExercises });
    };

    // Handle delete exercise
    const handleDeleteExercise = (index: number) => {
        const updatedExercises = exercises.filter((_, i) => i !== index);
        setExercises(updatedExercises);
        updateNode(id, { ...data, exercises: updatedExercises });
    };

    // Handle delete node
    const handleDelete = () => {
        if (confirm(`Delete "${data?.label || 'Fitness Plan'}"?`)) {
            deleteNode(id);
        }
        setShowMenu(false);
    };

    // Node content UI
    const nodeContent = (
        <div className="flow-node-card fitness-agent-node">
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
                                className="flow-node-menu-item"
                                onClick={() => {
                                    setIsEditingNotes(!isEditingNotes);
                                    setShowMenu(false);
                                }}
                            >
                                {notes ? 'Edit notes' : 'Add notes'}
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
                        {label || 'Fitness Plan'}
                    </h3>
                )}

                {/* Exercise list */}
                <div className="fitness-exercise-list">
                    {exercises.length === 0 ? (
                        <div className="fitness-no-exercises">
                            No exercises added yet
                        </div>
                    ) : (
                        <ul className="fitness-exercises">
                            {exercises.map((exercise, index) => (
                                <li
                                    key={index}
                                    className={`fitness-exercise-item ${exercise.completed ? 'completed' : ''}`}
                                >
                                    <div className="fitness-exercise-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={exercise.completed}
                                            onChange={() => handleToggleExercise(index)}
                                        />
                                    </div>
                                    <div className="fitness-exercise-details">
                                        <div className="fitness-exercise-name">
                                            {exercise.name}
                                        </div>
                                        <div className="fitness-exercise-meta">
                                            {exercise.sets} sets × {exercise.reps} reps
                                        </div>
                                    </div>
                                    <button
                                        className="fitness-exercise-delete"
                                        onClick={() => handleDeleteExercise(index)}
                                        title="Delete exercise"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Add exercise form */}
                    {isAddingExercise ? (
                        <div className="fitness-add-exercise-form">
                            <input
                                type="text"
                                placeholder="Exercise name"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                className="fitness-exercise-name-input"
                                autoFocus
                            />
                            <div className="fitness-exercise-params">
                                <div className="fitness-param-group">
                                    <label>Sets:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newExerciseSets}
                                        onChange={(e) => setNewExerciseSets(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="fitness-param-input"
                                    />
                                </div>
                                <div className="fitness-param-group">
                                    <label>Reps:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newExerciseReps}
                                        onChange={(e) => setNewExerciseReps(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="fitness-param-input"
                                    />
                                </div>
                            </div>
                            <div className="fitness-form-actions">
                                <button
                                    className="todo-button fitness-add-button"
                                    onClick={handleAddExercise}
                                    disabled={!newExerciseName.trim()}
                                >
                                    Add
                                </button>
                                <button
                                    className="todo-button fitness-cancel-button"
                                    onClick={() => setIsAddingExercise(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="fitness-add-exercise-button"
                            onClick={() => setIsAddingExercise(true)}
                        >
                            + Add Exercise
                        </button>
                    )}
                </div>

                {/* Notes section */}
                {isEditingNotes ? (
                    <div className="fitness-notes-edit">
                        <textarea
                            ref={notesTextareaRef}
                            value={notes}
                            onChange={handleNotesChange}
                            className="fitness-notes-textarea"
                            placeholder="Add notes about your fitness plan..."
                            rows={3}
                            onBlur={handleNotesSubmit}
                        />
                        <div className="fitness-notes-actions">
                            <button onClick={handleNotesSubmit} className="todo-button fitness-save-button">Save</button>
                            <button onClick={() => setIsEditingNotes(false)} className="todo-button fitness-cancel-button">Cancel</button>
                        </div>
                    </div>
                ) : notes ? (
                    <div
                        className="fitness-notes-display"
                        onClick={() => setIsEditingNotes(true)}
                    >
                        <div className="fitness-notes-label">Notes:</div>
                        <p className="fitness-notes-text">{notes}</p>
                    </div>
                ) : null}

                {/* Add notes button if no notes yet */}
                {!isEditingNotes && !notes && (
                    <button
                        className="fitness-add-notes-button"
                        onClick={() => setIsEditingNotes(true)}
                    >
                        + Add Notes
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <BaseNode
            id={id}
            data={data}
        >
            {nodeContent}
        </BaseNode>
    );
}

export default FitnessAgentNode; 