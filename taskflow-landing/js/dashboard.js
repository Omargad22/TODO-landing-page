const TODO_API_URL = '/api/todos';

async function loadDashboard() {
    const user = getUser();
    if (user) {
        document.getElementById('welcomeMsg').textContent = `Welcome, ${user.username}!`;
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
        renderTodos(data.data);
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function renderTodos(todos) {
    const list = document.getElementById('todoList');
    list.innerHTML = '';

    if (todos.length === 0) {
        list.innerHTML = '<li class="empty-state">No tasks yet. Add one above!</li>';
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''} 
                onchange="toggleTodo(${todo.id}, this.checked)">
            <span class="todo-text">${escapeHtml(todo.task)}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">🗑️</button>
        `;
        list.appendChild(li);
    });
}

async function addTodo() {
    const input = document.getElementById('newTodoInput');
    const task = input.value.trim();
    if (!task) return;

    const token = getToken();
    try {
        const response = await fetch(TODO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task })
        });

        if (response.ok) {
            input.value = '';
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
    if (!confirm('Are you sure you want to delete this task?')) return;

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
