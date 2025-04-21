import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

interface TodoFormProps {
    onAddTodo: (text: string, deadline?: string) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo }) => {
    const [text, setText] = useState('');
    const [isDateTimeMode, setIsDateTimeMode] = useState(false);
    const [dateTime, setDateTime] = useState('');
    const [minutes, setMinutes] = useState('25');

    // Set default dateTime to 5PM today or tomorrow if already past 5PM
    const getDefault5PM = (): string => {
        const now = new Date();
        const target = new Date(now);

        // Set time to 5PM
        target.setHours(17, 0, 0, 0);

        // If it's already past 5PM, set to tomorrow
        if (now.getHours() >= 17) {
            target.setDate(target.getDate() + 1);
        }

        // Format for datetime-local input
        const year = target.getFullYear();
        const month = String(target.getMonth() + 1).padStart(2, '0');
        const day = String(target.getDate()).padStart(2, '0');
        const hours = String(target.getHours()).padStart(2, '0');
        const mins = String(target.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${mins}`;
    };

    // Initialize dateTime value with default 5PM when toggling to datetime mode
    const handleModeToggle = () => {
        if (!isDateTimeMode && !dateTime) {
            setDateTime(getDefault5PM());
        }
        setIsDateTimeMode(!isDateTimeMode);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            let deadline: string | undefined;

            if (isDateTimeMode && dateTime) {
                deadline = new Date(dateTime).toISOString();
            } else {
                // Using minutes (default mode)
                const minutesValue = parseInt(minutes, 10);
                if (!isNaN(minutesValue) && minutesValue > 0) {
                    const deadlineDate = new Date();
                    deadlineDate.setMinutes(deadlineDate.getMinutes() + minutesValue);
                    deadline = deadlineDate.toISOString();
                }
            }

            onAddTodo(text, deadline);
            setText('');
            // Keep the deadline settings for next todo
        }
    };

    return (
        <form className="todo-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="todo-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a new task..."
            />

            <div className="deadline-wrapper">
                <div className="deadline-toggle" onClick={handleModeToggle} title={isDateTimeMode ? "Switch to minutes mode" : "Switch to date/time mode"}>
                    <FontAwesomeIcon icon={isDateTimeMode ? faCalendarAlt : faClock} />
                </div>

                {isDateTimeMode ? (
                    <input
                        type="datetime-local"
                        className="deadline-input datetime-input"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        title="Set specific date and time"
                    />
                ) : (
                    <div className="minutes-input-wrapper">
                        <input
                            type="number"
                            className="deadline-input minutes-input"
                            min="1"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            title="Minutes from now"
                        />
                        <span className="minutes-label">min</span>
                    </div>
                )}
            </div>

            <button className="todo-button" type="submit">Add</button>
        </form>
    );
};

export default TodoForm; 