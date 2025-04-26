import React, { useState, useRef, useEffect } from 'react';
import useFlowStore from '../../lib/flowStore';
import BaseNode from './BaseNode';
import { MeditationTimerNodeData } from './nodeTypes';

interface MeditationTimerNodeProps {
    id: string;
    data: MeditationTimerNodeData;
}

function MeditationTimerNode({ id, data }: MeditationTimerNodeProps) {
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [label, setLabel] = useState(data?.label || 'Meditation Timer');
    const [duration, setDuration] = useState(data?.duration || 5);
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [showMenu, setShowMenu] = useState(false);

    const labelInputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const updateNode = useFlowStore(state => state.updateNode);
    const deleteNode = useFlowStore(state => state.deleteNode);

    // Handle edit mode focus
    useEffect(() => {
        if (isEditingLabel && labelInputRef.current) {
            labelInputRef.current.focus();
        }
    }, [isEditingLabel]);

    useEffect(() => {
        if (isEditingDuration && durationInputRef.current) {
            durationInputRef.current.focus();
        }
    }, [isEditingDuration]);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        // Timer complete
                        clearInterval(timerRef.current as NodeJS.Timeout);
                        setIsTimerRunning(false);

                        // Mark as completed and save
                        updateNode(id, {
                            ...data,
                            completed: true,
                            lastSessionDate: new Date().toISOString()
                        });

                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isTimerRunning, id, data, updateNode]);

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

    // Handle duration change
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDuration = Math.max(1, parseInt(e.target.value) || 1);
        setDuration(newDuration);
    };

    // Handle duration submit
    const handleDurationSubmit = () => {
        updateNode(id, { ...data, duration });
        setTimeLeft(duration * 60);
        setIsEditingDuration(false);
    };

    // Handle delete
    const handleDelete = () => {
        if (confirm(`Delete "${data?.label || 'Meditation Timer'}"?`)) {
            deleteNode(id);
        }
        setShowMenu(false);
    };

    // Start timer
    const handleStartTimer = () => {
        setTimeLeft(duration * 60);
        setIsTimerRunning(true);
    };

    // Stop timer
    const handleStopTimer = () => {
        setIsTimerRunning(false);
    };

    // Reset timer
    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(duration * 60);
        updateNode(id, { ...data, completed: false });
    };

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Node content UI
    const nodeContent = (
        <div className="flow-node-card meditation-timer-node">
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
                                    setIsEditingDuration(true);
                                    setShowMenu(false);
                                }}
                            >
                                Change duration
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
                        {label || 'Meditation Timer'}
                    </h3>
                )}

                {/* Timer display section */}
                <div className="meditation-timer-display">
                    {isEditingDuration ? (
                        <div className="meditation-duration-edit">
                            <input
                                ref={durationInputRef}
                                type="number"
                                min="1"
                                value={duration}
                                onChange={handleDurationChange}
                                className="meditation-duration-input"
                                onBlur={handleDurationSubmit}
                                autoFocus
                            />
                            <span className="meditation-duration-unit">minutes</span>
                        </div>
                    ) : (
                        <div className="meditation-time">
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <div className="meditation-duration">
                        {!isEditingDuration && (
                            <div
                                className="meditation-duration-label"
                                onClick={() => !isTimerRunning && setIsEditingDuration(true)}
                            >
                                {duration} {duration === 1 ? 'minute' : 'minutes'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="meditation-controls">
                    {!isTimerRunning ? (
                        <button
                            className="todo-button meditation-start-button"
                            onClick={handleStartTimer}
                            disabled={isEditingDuration}
                        >
                            Start
                        </button>
                    ) : (
                        <button
                            className="todo-button meditation-stop-button"
                            onClick={handleStopTimer}
                        >
                            Pause
                        </button>
                    )}

                    <button
                        className="todo-button meditation-reset-button"
                        onClick={handleResetTimer}
                        disabled={isTimerRunning || timeLeft === duration * 60}
                    >
                        Reset
                    </button>
                </div>

                {/* Status */}
                {data.completed && data.lastSessionDate && (
                    <div className="meditation-status">
                        Last completed: {new Date(data.lastSessionDate).toLocaleString()}
                    </div>
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

export default MeditationTimerNode; 