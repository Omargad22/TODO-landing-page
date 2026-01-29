const TODO_API_URL = '/api/todos';
let allTodos = [];
let weeklyChart = null;
let statusChart = null;
let priorityChart = null;

async function loadAnalyticsPage() {
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
        updateStats();
        renderCharts();
    } catch (error) {
        console.error('Error fetching todos:', error);
    }
}

function updateStats() {
    const total = allTodos.length;
    const completed = allTodos.filter(t => t.completed).length;

    const now = new Date();
    const overdue = allTodos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now).length;
    // Pending includes tasks that are not completed and not overdue yet
    const pending = allTodos.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= now)).length;

    const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('overdueTasks').textContent = overdue;
    document.getElementById('productivityRate').textContent = productivity + '%';
}

function renderCharts() {
    renderWeeklyChart();
    renderStatusChart();
    renderPriorityChart();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');

    // Get the current week's dates
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        date.setHours(0, 0, 0, 0);
        weekDates.push(date);
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Calculate tasks with deadlines for each day of the week
    const tasksPerDay = weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return allTodos.filter(todo => {
            if (!todo.deadline) return false;
            // Compare date part only
            return todo.deadline.startsWith(dateStr);
        }).length;
    });

    // Calculate completed tasks per day (based on deadline date)
    const completedPerDay = weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return allTodos.filter(todo => {
            if (!todo.deadline) return false;
            return todo.deadline.startsWith(dateStr) && todo.completed;
        }).length;
    });

    // Calculate overdue tasks per day
    const now = new Date();
    const overduePerDay = weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return allTodos.filter(todo => {
            if (!todo.deadline || todo.completed) return false;
            const deadlineDate = new Date(todo.deadline);
            return todo.deadline.startsWith(dateStr) && deadlineDate < now;
        }).length;
    });

    // Pending = total - completed - overdue
    const pendingPerDay = tasksPerDay.map((total, i) => Math.max(0, total - completedPerDay[i] - overduePerDay[i]));

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Completed',
                    data: completedPerDay,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 6,
                },
                {
                    label: 'Pending',
                    data: pendingPerDay,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 6,
                },
                {
                    label: 'Overdue',
                    data: overduePerDay,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94A3B8',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#0F172A',
                    bodyColor: '#475569',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94A3B8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94A3B8',
                        stepSize: 1
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');

    // Calculate stats again for chart
    const completed = allTodos.filter(t => t.completed).length;
    const now = new Date();
    const overdue = allTodos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now).length;
    const pending = allTodos.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= now)).length;

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
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
            cutout: '70%'
        }
    });
}

function renderPriorityChart() {
    const ctx = document.getElementById('priorityChart').getContext('2d');

    const high = allTodos.filter(t => t.priority === 'high').length;
    const medium = allTodos.filter(t => t.priority === 'medium' || !t.priority).length;
    const low = allTodos.filter(t => t.priority === 'low').length;

    if (priorityChart) {
        priorityChart.destroy();
    }

    priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [high, medium, low],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(16, 185, 129, 1)'
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
            cutout: '70%'
        }
    });
}
