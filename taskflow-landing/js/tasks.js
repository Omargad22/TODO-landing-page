const TODO_API_URL = '/api/todos';
let allTodos = [];
let currentFilter = 'all';

async function loadTasksPage() {
    const user = getUser();
    if (user) {
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
    }
    fetchTodos();
}

async function fetchTodos() {
    const token = getToken();
    try {
        const response = await fetch(TODO_API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const data = await response.json();
        allTodos = data.data || [];
        renderTodos(filterTodosByStatus(allTodos, currentFilter));
        updateTaskCount();
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function filterTasks(filterType) {
    currentFilter = filterType;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    renderTodos(filterTodosByStatus(allTodos, filterType));
}

function filterTodosByStatus(todos, filter) {
    const now = new Date();
    switch (filter) {
        case 'pending':
            return todos.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= now));
        case 'completed':
            return todos.filter(t => t.completed);
        case 'overdue':
            return todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now);
        default:
            return todos;
    }
}

function sortTasks(sortBy) {
    let sorted = [...filterTodosByStatus(allTodos, currentFilter)];

    switch (sortBy) {
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
            break;
        case 'name':
            sorted.sort((a, b) => a.task.localeCompare(b.task));
            break;
        case 'date':
        default:
            sorted.sort((a, b) => b.id - a.id);
            break;
    }

    renderTodos(sorted);
}

function updateTaskCount() {
    const total = allTodos.length;
    const completed = allTodos.filter(t => t.completed).length;
    const now = new Date();
    const overdue = allTodos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now).length;
    const pending = allTodos.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= now)).length;

    document.getElementById('taskCount').textContent = `${total} task${total !== 1 ? 's' : ''}`;
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('overdueTasks').textContent = overdue;
}

function renderTodos(todos) {
    const list = document.getElementById('todoList');

    if (todos.length === 0) {
        list.innerHTML = `
            <div class="empty-state-pro">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <p>No tasks found</p>
            </div>
        `;
        return;
    }

    const now = new Date();
    const fragment = document.createDocumentFragment();

    todos.forEach((todo, index) => {
        const div = document.createElement('div');
        const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
        const isOverdue = deadlineDate && deadlineDate < now && !todo.completed;

        div.className = `task-item-pro ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
        div.style.animationDelay = `${index * 0.02}s`; // Faster stagger

        const priority = todo.priority || 'medium';
        const deadlineHtml = todo.deadline
            ? `<div class="task-deadline ${isOverdue ? 'text-red' : ''}">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                ${formatDate(todo.deadline)}
               </div>`
            : '';

        div.innerHTML = `
            <div class="priority-dot ${priority}"></div>
            <input type="checkbox" class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''} 
                ${isOverdue ? 'disabled' : ''}
                onchange="toggleTodo(${todo.id}, this.checked)">
            <div class="task-content">
                <div class="task-title">${escapeHtml(todo.task)}</div>
                <div class="task-meta">
                    ${deadlineHtml}
                    <span class="priority-label">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                    ${isOverdue ? '<span class="status-badge overdue">Overdue</span>' : ''}
                </div>
            </div>
            <div class="todo-actions">
                <button class="icon-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        `;
        fragment.appendChild(div);
    });

    list.innerHTML = '';
    list.appendChild(fragment);
}

function formatDate(dateString) {
    const options = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

async function addTodo() {
    const input = document.getElementById('newTodoInput');
    const deadlineInput = document.getElementById('newTodoDeadline');
    const priorityInput = document.getElementById('newTodoPriority');
    const task = input.value.trim();
    const deadline = deadlineInput.value;
    const priority = priorityInput.value || 'medium';

    if (!task) {
        alert('Please enter a task description');
        return;
    }

    if (!deadline) {
        alert('Please select a date and time for the task');
        return;
    }

    const token = getToken();
    try {
        const response = await fetch(TODO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task, deadline, priority })
        });

        if (response.ok) {
            input.value = '';
            deadlineInput.value = '';
            priorityInput.value = 'medium';
            fetchTodos();
        }
    } catch (error) {
        console.error('Error adding todo:', error);
    }
}

async function toggleTodo(id, completed) {
    const token = getToken();
    try {
        await fetch(`${TODO_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed: completed ? 1 : 0 })
        });
        fetchTodos();
    } catch (error) {
        console.error('Error updating todo:', error);
    }
}

async function deleteTodo(id) {
    const token = getToken();
    try {
        await fetch(`${TODO_API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
