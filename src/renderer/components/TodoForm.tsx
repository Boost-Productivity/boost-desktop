import React, { useState } from 'react';

interface TodoFormProps {
    onAddTodo: (text: string) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onAddTodo(text);
            setText('');
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
            <button className="todo-button" type="submit">Add</button>
        </form>
    );
};

export default TodoForm; 