const TODO_API_URL = '/api/todos';
let allTodos = [];
let currentDate = new Date();
let selectedDate = new Date();

async function loadCalendarPage() {
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
        renderCalendar();
        showTasksForDate(selectedDate);
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get task dates for this month
    const taskDates = {};
    allTodos.forEach(todo => {
        if (todo.deadline) {
            const deadlineDate = new Date(todo.deadline);
            if (deadlineDate.getFullYear() === year && deadlineDate.getMonth() === month) {
                const day = deadlineDate.getDate();
                if (!taskDates[day]) taskDates[day] = [];
                taskDates[day].push(todo);
            }
        }
    });

    let html = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const isToday = dateObj.toDateString() === today.toDateString();
        const isSelected = dateObj.toDateString() === selectedDate.toDateString();
        const tasksForDay = taskDates[day] || [];

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (tasksForDay.length > 0) classes += ' has-tasks';

        html += `
            <div class="${classes}" onclick="selectDate(${year}, ${month}, ${day})">
                <span class="day-number">${day}</span>
                ${tasksForDay.length > 0 ? `<span class="task-indicator">${tasksForDay.length}</span>` : ''}
            </div>
        `;
    }

    document.getElementById('calendarDays').innerHTML = html;
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar();
    showTasksForDate(selectedDate);
}

function showTasksForDate(date) {
    const dateStr = date.toDateString();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('selectedDateTitle').innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        ${date.toLocaleDateString('en-US', options)}
    `;

    const tasksForDate = allTodos.filter(todo => {
        if (!todo.deadline) return false;
        // Compare date part only
        return new Date(todo.deadline).toDateString() === dateStr;
    });

    const list = document.getElementById('dayTasksList');

    if (tasksForDate.length === 0) {
        list.innerHTML = `
            <div class="empty-state-pro" style="padding: 24px;">
                <p>No tasks scheduled for this day</p>
            </div>
        `;
        return;
    }

    const now = new Date();

    list.innerHTML = tasksForDate.map(todo => {
        const priority = todo.priority || 'medium';
        const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
        const isOverdue = deadlineDate && deadlineDate < now && !todo.completed;
        const formattedTime = deadlineDate ? deadlineDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

        return `
            <div class="task-item-pro ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <div class="priority-dot ${priority}"></div>
                <input type="checkbox" class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    ${isOverdue ? 'disabled' : ''}
                    onchange="toggleTodo(${todo.id}, this.checked)">
                <div class="task-content">
                    <div class="task-title">${escapeHtml(todo.task)}</div>
                    <div class="task-meta">
                        ${formattedTime ? `
                            <div class="task-deadline ${isOverdue ? 'text-red' : ''}">
                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                ${formattedTime}
                            </div>
                        ` : ''}
                        <span class="priority-label">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                        ${isOverdue ? '<span class="status-badge overdue">Overdue</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
