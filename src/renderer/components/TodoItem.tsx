import React, { useState, useEffect } from 'react';
import { Todo } from '../models/Todo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faUndo,
    faTrash,
    faArchive,
    faBoxOpen,
    faStar,
    faPencil,
    faSave,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { playAudio } from '../utils/audio';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onFocus: (id: string) => void;
    onEdit: (id: string, text: string, deadline?: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
    todo,
    onToggle,
    onDelete,
    onArchive,
    onUnarchive,
    onFocus,
    onEdit
}) => {
    const [countdown, setCountdown] = useState<string>('');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editText, setEditText] = useState<string>(todo.text);
    const [editDeadline, setEditDeadline] = useState<string>(todo.deadline || '');

    // Track if the todo was already overdue to prevent playing sound on initial render
    const [wasOverdue, setWasOverdue] = useState<boolean>(() => {
        if (todo.deadline) {
            return new Date(todo.deadline) < new Date();
        }
        return false;
    });

    // Check if we're in focus mode by looking at the body class
    const isInFocusMode = document.body.classList.contains('focus-mode');

    // Update countdown every second
    useEffect(() => {
        if (!todo.deadline || todo.completed) return;

        const updateCountdown = () => {
            const now = new Date();
            const deadlineDate = new Date(todo.deadline as string);
            const diff = deadlineDate.getTime() - now.getTime();

            // Check if deadline just passed
            const isCurrentlyOverdue = diff < 0;

            // Play sound if the todo just became overdue (transition from not overdue to overdue)
            if (isCurrentlyOverdue && !wasOverdue && !todo.completed) {
                playAudio('ding.mp3');
            }

            // Update overdue state
            setWasOverdue(isCurrentlyOverdue);

            // Set countdown display text
            setCountdown(formatCountdown(todo.deadline));
        };

        // Initial update
        updateCountdown();

        // Set interval to update countdown
        const intervalId = setInterval(updateCountdown, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [todo.deadline, todo.completed, wasOverdue]);

    // Reset edit state when todo changes
    useEffect(() => {
        setEditText(todo.text);
        setEditDeadline(todo.deadline || '');

        // Reset wasOverdue if deadline changes
        if (todo.deadline) {
            setWasOverdue(new Date(todo.deadline) < new Date());
        } else {
            setWasOverdue(false);
        }
    }, [todo]);

    const formatCountdown = (deadline?: string): string => {
        if (!deadline) return '';

        const now = new Date();
        const deadlineDate = new Date(deadline);
        let diff = deadlineDate.getTime() - now.getTime();

        // If deadline has passed, show overdue
        if (diff < 0) {
            return 'Overdue';
        }

        // Convert time difference to readable format
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        const minutes = Math.floor(diff / (1000 * 60));
        diff -= minutes * (1000 * 60);

        const seconds = Math.floor(diff / 1000);

        // Format based on time remaining
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes >= 5) {
            // Don't show seconds if more than 5 minutes remaining
            return `${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const formatDeadline = (deadline?: string): string => {
        if (!deadline) return '';

        const deadlineDate = new Date(deadline);
        const now = new Date();

        // In focus mode, use a more compact format
        if (isInFocusMode) {
            // If deadline is today
            if (deadlineDate.toDateString() === now.toDateString()) {
                return deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            // If deadline is this week
            const weekFromNow = new Date(now);
            weekFromNow.setDate(now.getDate() + 7);
            if (deadlineDate < weekFromNow) {
                const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
                return deadlineDate.toLocaleString([], options);
            }

            // Otherwise show abbreviated date
            return deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        // Regular format for non-focus mode
        // If deadline has passed
        if (deadlineDate < now && !todo.completed) {
            return `Overdue: ${deadlineDate.toLocaleString()}`;
        }

        // If deadline is today
        if (deadlineDate.toDateString() === now.toDateString()) {
            return `Today: ${deadlineDate.toLocaleTimeString()}`;
        }

        // All other cases
        return deadlineDate.toLocaleString();
    };

    const isOverdue = (): boolean => {
        if (!todo.deadline || todo.completed) return false;
        return new Date(todo.deadline) < new Date();
    };

    const handleSaveEdit = () => {
        if (editText.trim()) {
            onEdit(todo.id, editText, editDeadline || undefined);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditText(todo.text);
        setEditDeadline(todo.deadline || '');
        setIsEditing(false);
    };

    return (
        <div className={`todo-item ${todo.completed ? 'completed' : ''} ${isOverdue() ? 'overdue' : ''} ${todo.archived ? 'archived' : ''} ${todo.focused ? 'focused' : ''}`}>
            {isEditing ? (
                <div className="todo-edit-form">
                    <input
                        type="text"
                        className="todo-edit-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Task description"
                        autoFocus
                    />
                    <input
                        type="datetime-local"
                        className="todo-edit-deadline"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <div className="todo-edit-actions">
                        <button
                            className="todo-save"
                            onClick={handleSaveEdit}
                            title="Save changes"
                        >
                            <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button
                            className="todo-cancel"
                            onClick={handleCancelEdit}
                            title="Cancel"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="todo-content">
                        <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                            {todo.text}
                        </span>
                        {todo.deadline && (
                            <div className="todo-deadline-container">
                                <span className="todo-deadline">
                                    {formatDeadline(todo.deadline)}
                                </span>
                                {!todo.completed && countdown && (
                                    <span className="todo-countdown">
                                        {countdown}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="todo-actions">
                        <button
                            className={`todo-focus ${todo.focused ? 'active' : ''}`}
                            onClick={() => onFocus(todo.id)}
                            title={todo.focused ? "Remove from focus" : "Focus on this task"}
                        >
                            <FontAwesomeIcon icon={faStar} />
                        </button>

                        <button
                            className="todo-edit"
                            onClick={() => setIsEditing(true)}
                            title="Edit todo"
                        >
                            <FontAwesomeIcon icon={faPencil} />
                        </button>

                        <button
                            className="todo-toggle"
                            onClick={() => onToggle(todo.id)}
                            title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                            <FontAwesomeIcon icon={todo.completed ? faUndo : faCheck} />
                        </button>

                        {todo.archived ? (
                            <button
                                className="todo-unarchive"
                                onClick={() => onUnarchive(todo.id)}
                                title="Restore from archive"
                            >
                                <FontAwesomeIcon icon={faBoxOpen} />
                            </button>
                        ) : (
                            <button
                                className="todo-archive"
                                onClick={() => onArchive(todo.id)}
                                title="Archive todo"
                            >
                                <FontAwesomeIcon icon={faArchive} />
                            </button>
                        )}

                        <button
                            className="todo-delete"
                            onClick={() => onDelete(todo.id)}
                            title="Delete todo"
                        >
                            <FontAwesomeIcon icon={faTrash} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TodoItem; 