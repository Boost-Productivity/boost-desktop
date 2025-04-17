import React, { useEffect, useState } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { Todo } from '../models/Todo';
import { todoController } from '../controllers/TodoController';

const App: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            setLoading(true);
            const loadedTodos = await todoController.getTodos();
            setTodos(loadedTodos);
            setError(null);
        } catch (err) {
            setError('Failed to load todos. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTodo = async (text: string) => {
        try {
            const newTodo = await todoController.addTodo(text);
            if (newTodo) {
                setTodos([...todos, newTodo]);
            }
        } catch (err) {
            setError('Failed to add todo. Please try again.');
            console.error(err);
        }
    };

    const handleToggleTodo = async (id: string) => {
        try {
            const updatedTodo = await todoController.toggleTodo(id);
            if (updatedTodo) {
                setTodos(todos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            setError('Failed to update todo. Please try again.');
            console.error(err);
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            const success = await todoController.deleteTodo(id);
            if (success) {
                setTodos(todos.filter(todo => todo.id !== id));
            }
        } catch (err) {
            setError('Failed to delete todo. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="container">
            <h1>Boost Todo App</h1>

            <TodoForm onAddTodo={handleAddTodo} />

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div className="loading">Loading todos...</div>
            ) : (
                <TodoList
                    todos={todos}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                />
            )}
        </div>
    );
};

export default App; 