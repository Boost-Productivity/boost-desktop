import React from 'react';
import { Todo } from '../models/Todo';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
    return (
        <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                {todo.text}
            </span>
            <div className="todo-actions">
                <button
                    className="todo-toggle"
                    onClick={() => onToggle(todo.id)}
                    title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {todo.completed ? '↩️' : '✅'}
                </button>
                <button
                    className="todo-delete"
                    onClick={() => onDelete(todo.id)}
                    title="Delete todo"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

export default TodoItem; 