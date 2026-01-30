const TODO_API_URL = '/api/todos';

async function loadDashboard() {
    const user = getUser();
    if (user) {
        document.getElementById('welcomeMsg').textContent = `Welcome back, ${user.username}!`;
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
        const todos = data.data || [];
        renderTodos(todos);
        updateStats(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function updateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;

    const now = new Date();
    const overdue = todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now).length;
    const pending = todos.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= now)).length;

    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Animate counters
    animateCounter('totalTasks', total);
    animateCounter('completedTasks', completed);
    animateCounter('pendingTasks', pending);
    animateCounter('overdueTasks', overdue);
    document.getElementById('productivityRate').textContent = productivity + '%';
    document.getElementById('taskCount').textContent = `${total} task${total !== 1 ? 's' : ''}`;

    updateChart(completed, pending, overdue);
}

function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    // Simple fast animation
    const steps = 10;
    const increment = (target - current) / steps;
    let count = current;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        count += increment;
        element.textContent = Math.round(count);
        if (step >= steps) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, 30);
}

let productivityChart = null;

function updateChart(completed, pending, overdue) {
    const ctx = document.getElementById('productivityChart').getContext('2d');

    if (productivityChart) {
        productivityChart.data.datasets[0].data = [completed, pending, overdue];
        productivityChart.update();
    } else {
        productivityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending', 'Overdue'],
                datasets: [{
                    data: [completed, pending, overdue],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0F172A',
                        bodyColor: '#475569',
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        borderWidth: 1
                    }
                },
                cutout: '75%',
            }
        });
    }
}

function renderTodos(todos) {
    const list = document.getElementById('todoList');

    if (todos.length === 0) {
        list.innerHTML = `
            <div class="empty-state-pro">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <p>No tasks yet. Create your first task above!</p>
            </div>
        `;
        renderCalendar(todos);
        return;
    }

    // Sort: by priority (high first), then pending first, then by ID desc
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedTodos = [...todos].sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.id - a.id;
    });

    // Use DocumentFragment for batch DOM insertion
    const fragment = document.createDocumentFragment();
    const now = new Date();

    sortedTodos.forEach((todo, index) => {
        const div = document.createElement('div');
        const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
        const isOverdue = deadlineDate && deadlineDate < now && !todo.completed;

        div.className = `task-item-pro ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
        div.style.animationDelay = `${index * 0.03}s`; // Faster stagger

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
    renderCalendar(todos);
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

// Calendar state
let calendarDate = new Date();
let allTodosCache = [];

function changeCalendarMonth(delta) {
    calendarDate.setMonth(calendarDate.getMonth() + delta);
    renderCalendar(allTodosCache);
}

function renderCalendar(todos) {
    allTodosCache = todos;
    const calendarEl = document.getElementById('miniCalendar');
    const titleEl = document.getElementById('calMonthTitle');
    const today = new Date();
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Update month title
    if (titleEl) {
        titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    // Get task dates with counts and overdue status
    const taskDates = {};
    const todayStr = today.toDateString();

    todos.filter(t => t.deadline).forEach(t => {
        const d = new Date(t.deadline);
        const dateStr = d.toDateString();

        if (!taskDates[dateStr]) {
            taskDates[dateStr] = { count: 0, hasOverdue: false };
        }

        taskDates[dateStr].count++;
        // Check if overdue: deadline < now && not completed
        if (!t.completed && d < today && dateStr !== todayStr) {
            taskDates[dateStr].hasOverdue = true;
        }
    });

    let html = '';

    // Empty days before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toDateString();
        const isToday = dateStr === today.toDateString();
        const dateInfo = taskDates[dateStr];
        const taskCount = dateInfo ? dateInfo.count : 0;
        const hasOverdue = dateInfo ? dateInfo.hasOverdue : false;

        let classes = 'cal-day';
        if (isToday) classes += ' today';
        if (taskCount > 0) classes += ' has-task';

        html += `<div class="${classes}">
            <span class="day-num">${day}</span>
            ${taskCount > 0 ? `<span class="task-dot ${hasOverdue ? 'red' : ''}">${taskCount}</span>` : ''}
        </div>`;
    }

    calendarEl.innerHTML = html;
}
