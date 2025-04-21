import React, { useEffect, useState, useCallback, useRef } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { Todo } from '../models/Todo';
import { todoController } from '../controllers/TodoController';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSortUp,
    faSortDown,
    faClock,
    faCalendarAlt,
    faFont,
    faCheckCircle,
    faExpandAlt,
    faCompressAlt
} from '@fortawesome/free-solid-svg-icons';

// Define sorting options
type SortOption = 'deadline' | 'created' | 'text' | 'completed';
// Define view filter options
type ViewOption = 'active' | 'archived' | 'all';

const App: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('deadline');
    const [sortAscending, setSortAscending] = useState<boolean>(true);
    const [viewOption, setViewOption] = useState<ViewOption>('active');
    const [focusMode, setFocusMode] = useState<boolean>(false);

    // Create refs for container and content
    const containerRef = useRef<HTMLDivElement>(null);
    const focusedContentRef = useRef<HTMLDivElement>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);

    // Load todos on component mount
    useEffect(() => {
        loadTodos();

        // Setup resize observer for accurate measurements
        const observer = new ResizeObserver(debounce((entries: ResizeObserverEntry[]) => {
            if (focusMode && entries.length > 0) {
                const contentRect = entries[0].contentRect;
                // Add a small buffer for borders and potential scrollbar
                const height = contentRect.height + 10;
                todoController.updateFocusModeSize(height);
            }
        }, 100));

        resizeObserver.current = observer;

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
            }
        };
    }, []);

    // Debounce function to prevent too many resize calculations
    const debounce = <F extends (...args: any[]) => void>(fn: F, delay: number) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return function (this: any, ...args: Parameters<F>) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
                timeoutId = null;
            }, delay);
        };
    };

    // Update observer when focused content changes
    useEffect(() => {
        if (focusMode && focusedContentRef.current && resizeObserver.current) {
            resizeObserver.current.observe(focusedContentRef.current);
        }

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
            }
        };
    }, [focusMode]);

    // Memoized function to get active (non-archived) todos
    const getActiveTodos = useCallback(() => {
        return todos.filter(todo => !todo.archived);
    }, [todos]);

    // Memoized function to get focused todos
    const getFocusedTodos = useCallback(() => {
        return todos.filter(todo => todo.focused && !todo.archived);
    }, [todos]);

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

    const handleAddTodo = async (text: string, deadline?: string) => {
        try {
            const newTodo = await todoController.addTodo(text, deadline);
            if (newTodo) {
                // Use functional update to ensure we're using the latest state
                setTodos(prevTodos => [...prevTodos, newTodo]);
            }
        } catch (err) {
            setError('Failed to add todo. Please try again.');
            console.error(err);
        }
    };

    const handleToggleTodo = async (id: string) => {
        try {
            // Find the todo to toggle in current state
            const todoToToggle = todos.find(todo => todo.id === id);
            if (!todoToToggle) return;

            // Optimistically update UI
            const optimisticTodos = todos.map(todo =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            );
            setTodos(optimisticTodos);

            // Make the actual API call
            const updatedTodo = await todoController.toggleTodo(id);

            // Update with the server response
            if (updatedTodo) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to update todo. Please try again.');
            console.error(err);
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            // Optimistically update UI
            setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));

            // Make the actual API call
            const success = await todoController.deleteTodo(id);

            // If it failed, reload todos
            if (!success) {
                loadTodos();
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to delete todo. Please try again.');
            console.error(err);
        }
    };

    const handleArchiveTodo = async (id: string) => {
        try {
            // Optimistically update UI
            const optimisticTodos = todos.map(todo =>
                todo.id === id ? { ...todo, archived: true } : todo
            );
            setTodos(optimisticTodos);

            // Make the actual API call
            const updatedTodo = await todoController.archiveTodo(id);

            // Update with the server response
            if (updatedTodo) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to archive todo. Please try again.');
            console.error(err);
        }
    };

    const handleUnarchiveTodo = async (id: string) => {
        try {
            // Optimistically update UI
            const optimisticTodos = todos.map(todo =>
                todo.id === id ? { ...todo, archived: false } : todo
            );
            setTodos(optimisticTodos);

            // Make the actual API call
            const updatedTodo = await todoController.unarchiveTodo(id);

            // Update with the server response
            if (updatedTodo) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to unarchive todo. Please try again.');
            console.error(err);
        }
    };

    const handleFocusTodo = async (id: string) => {
        try {
            // Find the todo to toggle focus
            const todoToFocus = todos.find(todo => todo.id === id);
            if (!todoToFocus) return;

            // Determine if we're focusing or unfocusing
            const willFocus = !todoToFocus.focused;

            // Optimistically update UI - only toggle this specific todo
            const optimisticTodos = todos.map(todo =>
                todo.id === id ? { ...todo, focused: willFocus } : todo
            );
            setTodos(optimisticTodos);

            // Make the actual API call
            const updatedTodo = await todoController.toggleFocus(id);

            // Update the specific todo with server state
            if (updatedTodo) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to toggle focus for todo. Please try again.');
            console.error(err);
        }
    };

    const handleEditTodo = async (id: string, text: string, deadline?: string) => {
        try {
            if (!text.trim()) return;

            // Find the todo to edit
            const todoToEdit = todos.find(todo => todo.id === id);
            if (!todoToEdit) return;

            // Optimistically update UI
            const optimisticTodos = todos.map(todo =>
                todo.id === id ? { ...todo, text, deadline } : todo
            );
            setTodos(optimisticTodos);

            // Make the actual API call
            const updatedTodo = await todoController.editTodo(id, text, deadline);

            // Update with the server response
            if (updatedTodo) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === id ? updatedTodo : todo
                ));
            }
        } catch (err) {
            // Reload the todos in case of error
            loadTodos();
            setError('Failed to edit todo. Please try again.');
            console.error(err);
        }
    };

    const handleSortChange = (option: SortOption) => {
        if (sortBy === option) {
            // If clicking the same option, toggle direction
            setSortAscending(!sortAscending);
        } else {
            // If clicking a different option, set it and default to ascending
            setSortBy(option);
            setSortAscending(true);
        }
    };

    const handleViewChange = (option: ViewOption) => {
        setViewOption(option);
    };

    const toggleFocusMode = async () => {
        try {
            // Check if we're entering or exiting focus mode
            const isEntering = !focusMode;

            if (isEntering) {
                // Get focused todos
                let focusedTodos = getFocusedTodos();
                let todoWasAutomaticallyFocused = false;

                // If no todos are focused, let's focus the first visible todo in the current view
                if (focusedTodos.length === 0) {
                    // Get the current filtered and sorted todos as the user sees them
                    const currentVisibleTodos = getFilteredAndSortedTodos();

                    // If we have any todos to focus
                    if (currentVisibleTodos.length > 0) {
                        // Use setFocus for the first visible todo
                        const updatedTodo = await todoController.setFocus(currentVisibleTodos[0].id);

                        if (updatedTodo) {
                            // Refresh all todos to get correct state
                            const updatedTodos = await todoController.getTodos();
                            setTodos(updatedTodos);

                            // Get the updated focused todos count for height calculation
                            focusedTodos = updatedTodos.filter(todo => todo.focused && !todo.archived);
                            todoWasAutomaticallyFocused = true;
                        }
                    }
                }

                // Add focus-mode class to body and html elements
                document.body.classList.add('focus-mode');
                document.documentElement.classList.add('focus-mode');

                // Set focus mode state
                setFocusMode(true);

                // Calculate initial height with guaranteed count of focused todos
                // Use a higher estimate if we just auto-focused a todo to ensure it's visible
                const baseHeight = todoWasAutomaticallyFocused ? 150 : 80; // Extra space when auto-focusing
                const estimatedHeight = (focusedTodos.length * 50) + baseHeight;

                // Enter focus mode with calculated height
                await todoController.enterFocusMode(estimatedHeight);

                // ResizeObserver will handle precise adjustments after render
            } else {
                // Disconnect observer when exiting focus mode
                if (resizeObserver.current) {
                    resizeObserver.current.disconnect();
                }

                // Remove focus-mode class from body and html elements
                document.body.classList.remove('focus-mode');
                document.documentElement.classList.remove('focus-mode');

                // Exit focus mode - restore the window size
                await todoController.exitFocusMode();

                // Update state
                setFocusMode(false);
            }
        } catch (err) {
            setError('Failed to enter focus mode. Please try again.');
            console.error(err);
        }
    };

    const getFilteredAndSortedTodos = useCallback(() => {
        // Define the sort function first
        const sortFn = (a: Todo, b: Todo) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'deadline':
                    // Handle missing deadlines (null or undefined values)
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return sortAscending ? 1 : -1;
                    if (!b.deadline) return sortAscending ? -1 : 1;

                    valueA = new Date(a.deadline).getTime();
                    valueB = new Date(b.deadline).getTime();
                    break;

                case 'created':
                    valueA = new Date(a.createdAt).getTime();
                    valueB = new Date(b.createdAt).getTime();
                    break;

                case 'text':
                    valueA = a.text.toLowerCase();
                    valueB = b.text.toLowerCase();
                    return sortAscending
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);

                case 'completed':
                    valueA = a.completed ? 1 : 0;
                    valueB = b.completed ? 1 : 0;
                    break;

                default:
                    return 0;
            }

            return sortAscending ? valueA - valueB : valueB - valueA;
        };

        // If in focus mode, only show focused todos (already sorted by the sortFn)
        if (focusMode) {
            return getFocusedTodos().sort(sortFn);
        }

        // Regular filtering by view option
        const filteredTodos = todos.filter(todo => {
            if (viewOption === 'active') return !todo.archived;
            if (viewOption === 'archived') return todo.archived;
            return true; // 'all' option
        });

        // First, separate focused and non-focused todos
        const focusedTodos = filteredTodos.filter(todo => todo.focused);
        const nonFocusedTodos = filteredTodos.filter(todo => !todo.focused);

        // Sort each group separately
        const sortedFocusedTodos = focusedTodos.sort(sortFn);
        const sortedNonFocusedTodos = nonFocusedTodos.sort(sortFn);

        // Combine the sorted groups with focused todos always at the top
        return [...sortedFocusedTodos, ...sortedNonFocusedTodos];
    }, [todos, focusMode, viewOption, sortBy, sortAscending, getFocusedTodos]);

    const getViewStats = useCallback(() => {
        const active = todos.filter(todo => !todo.archived).length;
        const archived = todos.filter(todo => todo.archived).length;
        const total = todos.length;

        return { active, archived, total };
    }, [todos]);

    const { active, archived, total } = getViewStats();

    return (
        <div
            ref={containerRef}
            className={`container ${focusMode ? 'focus-mode' : ''}`}
        >
            <div className="app-header">
                <h1 className="app-title">Boost Focus</h1>
                <button
                    className="focus-mode-toggle"
                    onClick={toggleFocusMode}
                    title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                >
                    <FontAwesomeIcon icon={focusMode ? faCompressAlt : faExpandAlt} />
                </button>
            </div>

            {!focusMode && <TodoForm onAddTodo={handleAddTodo} />}

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div className="loading">Loading todos...</div>
            ) : (
                <>
                    {!focusMode && (
                        <div className="list-controls">
                            <div className="view-controls">
                                <span className="view-label">View:</span>
                                <div className="view-buttons">
                                    <button
                                        className={`view-button ${viewOption === 'active' ? 'active' : ''}`}
                                        onClick={() => handleViewChange('active')}
                                        title="Show active todos"
                                    >
                                        Active{active > 0 && ` (${active})`}
                                    </button>
                                    <button
                                        className={`view-button ${viewOption === 'archived' ? 'active' : ''}`}
                                        onClick={() => handleViewChange('archived')}
                                        title="Show archived todos"
                                    >
                                        Archived{archived > 0 && ` (${archived})`}
                                    </button>
                                    <button
                                        className={`view-button ${viewOption === 'all' ? 'active' : ''}`}
                                        onClick={() => handleViewChange('all')}
                                        title="Show all todos"
                                    >
                                        All{total > 0 && ` (${total})`}
                                    </button>
                                </div>
                            </div>

                            <div className="sort-controls">
                                <span className="sort-label">Sort:</span>
                                <div className="sort-buttons">
                                    <button
                                        className={`sort-button ${sortBy === 'deadline' ? 'active' : ''}`}
                                        onClick={() => handleSortChange('deadline')}
                                        title={`Sort by deadline ${sortBy === 'deadline' && sortAscending ? '(earliest first)' : '(latest first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faClock} />
                                        {sortBy === 'deadline' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'created' ? 'active' : ''}`}
                                        onClick={() => handleSortChange('created')}
                                        title={`Sort by creation date ${sortBy === 'created' && sortAscending ? '(oldest first)' : '(newest first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        {sortBy === 'created' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'text' ? 'active' : ''}`}
                                        onClick={() => handleSortChange('text')}
                                        title={`Sort alphabetically ${sortBy === 'text' && sortAscending ? '(A-Z)' : '(Z-A)'}`}
                                    >
                                        <FontAwesomeIcon icon={faFont} />
                                        {sortBy === 'text' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'completed' ? 'active' : ''}`}
                                        onClick={() => handleSortChange('completed')}
                                        title={`Sort by completion status ${sortBy === 'completed' && sortAscending ? '(incomplete first)' : '(complete first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {sortBy === 'completed' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={focusMode ? focusedContentRef : null}>
                        <TodoList
                            todos={getFilteredAndSortedTodos()}
                            onToggle={handleToggleTodo}
                            onDelete={handleDeleteTodo}
                            onArchive={handleArchiveTodo}
                            onUnarchive={handleUnarchiveTodo}
                            onFocus={handleFocusTodo}
                            onEdit={handleEditTodo}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default App; 