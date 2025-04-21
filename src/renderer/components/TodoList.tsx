import React, { useMemo } from 'react';
import TodoItem from './TodoItem';
import { Todo } from '../models/Todo';

interface TodoListProps {
    todos: Todo[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onFocus: (id: string) => void;
    onEdit: (id: string, text: string, deadline?: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({
    todos,
    onToggle,
    onDelete,
    onArchive,
    onUnarchive,
    onFocus,
    onEdit
}) => {
    // Use useMemo to avoid recomputing this on every render
    const orderedTodos = useMemo(() => {
        // Separate focused and non-focused todos
        const focusedTodos = todos.filter(todo => todo.focused);
        const nonFocusedTodos = todos.filter(todo => !todo.focused);

        // Return with focused ones first
        return [...focusedTodos, ...nonFocusedTodos];
    }, [todos]);

    if (todos.length === 0) {
        return <div className="empty-list">No tasks yet. Add one above!</div>;
    }

    return (
        <div className="todo-list">
            {orderedTodos.map(todo => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onUnarchive={onUnarchive}
                    onFocus={onFocus}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
};

export default TodoList; 