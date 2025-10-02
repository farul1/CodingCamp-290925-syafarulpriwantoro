let todoTasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
let currentEditId = null;
let currentDeleteId = null;
const addTodoForm = document.getElementById('add-todo-form');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date');
const statusSelect = document.getElementById('status');
const todoList = document.getElementById('todo-list');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const sortTasks = document.getElementById('sort-tasks');
const deleteAllBtn = document.getElementById('delete-all');
const themeSelect = document.getElementById('theme-select');
const totalTasksElement = document.getElementById('total-tasks');
const completedTasksElement = document.getElementById('completed-tasks');
const pendingTasksElement = document.getElementById('pending-tasks');
const progressTasksElement = document.getElementById('progress-tasks');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const editTodoForm = document.getElementById('edit-todo-form');
const editTaskInput = document.getElementById('edit-task-input');
const editDueDateInput = document.getElementById('edit-due-date');
const editStatusSelect = document.getElementById('edit-status');
const closeModal = document.querySelector('.close');
const cancelEditBtn = document.getElementById('cancel-edit');
const deleteMessage = document.getElementById('delete-message');
const deleteWarning = document.getElementById('delete-warning');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const today = new Date().toISOString().split('T')[0];
dueDateInput.min = today;
editDueDateInput.min = today;

function initTodoApp() {
    renderTodoTasks();
    updateTodoStats();
    setupTodoEventListeners();
    loadSavedTheme();
}

function setupTodoEventListeners() {
    addTodoForm.addEventListener('submit', handleAddTask);
    searchInput.addEventListener('input', renderTodoTasks);
    filterStatus.addEventListener('change', renderTodoTasks);
    sortTasks.addEventListener('change', renderTodoTasks);
    deleteAllBtn.addEventListener('click', showDeleteAllConfirmation);  
    editTodoForm.addEventListener('submit', handleSaveEditedTask);
    closeModal.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', executeDeleteAction);
    if (themeSelect) {
        themeSelect.addEventListener('change', handleThemeChange);
    }
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    if (e.key === 'Escape') {
        if (editModal.style.display === 'block') {
            closeEditModal();
        }
        if (deleteModal.style.display === 'block') {
            closeDeleteModal();
        }
    }
}

function handleAddTask(e) {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const status = statusSelect.value;
    
    if (!taskText) {
        showTodoNotification('Please enter a task!', 'warning');
        return;
    }
    
    if (!dueDate) {
        showTodoNotification('Please select a due date!', 'warning');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        dueDate: dueDate,
        status: status,
        createdAt: new Date().toISOString()
    };
    
    todoTasks.push(newTask);
    saveTodoTasks();
    renderTodoTasks();
    updateTodoStats();
    addTodoForm.reset();
    dueDateInput.min = today;
    showTodoNotification('Task added successfully!', 'success');
}

function editTodoTask(id) {
    const task = todoTasks.find(task => task.id === id);
    if (!task) return;    
    currentEditId = id;
    editTaskInput.value = task.text;
    editDueDateInput.value = task.dueDate;
    editStatusSelect.value = task.status;
    editModal.style.display = 'block';
}

function handleSaveEditedTask(e) {
    e.preventDefault();
    
    const taskText = editTaskInput.value.trim();
    const dueDate = editDueDateInput.value;
    const status = editStatusSelect.value;
    
    if (!taskText) {
        showTodoNotification('Please enter a task!', 'warning');
        return;
    }
    
    if (!dueDate) {
        showTodoNotification('Please select a due date!', 'warning');
        return;
    }
    
    todoTasks = todoTasks.map(task => {
        if (task.id === currentEditId) {
            return {
                ...task,
                text: taskText,
                dueDate: dueDate,
                status: status
            };
        }
        return task;
    });
    saveTodoTasks();
    renderTodoTasks();
    updateTodoStats();
    closeEditModal();
    showTodoNotification('Task updated successfully!', 'success');
}

function closeEditModal() {
    editModal.style.display = 'none';
    currentEditId = null;
}

function showDeleteConfirmation(id) {
    const task = todoTasks.find(task => task.id === id);
    if (!task) return;
    currentDeleteId = id;
    deleteMessage.textContent = `Are you sure you want to delete the task "${task.text}"?`;
    deleteWarning.textContent = "This action cannot be undone.";
    deleteModal.classList.add('single-delete-modal');
    confirmDeleteBtn.innerHTML = '<span>🗑️</span> Delete Task';
    deleteModal.style.display = 'block';
}

function showDeleteAllConfirmation() {
    if (todoTasks.length === 0) {
        showTodoNotification('No tasks to delete!', 'warning');
        return;
    }
    currentDeleteId = null;
    const taskCount = todoTasks.length;
    deleteMessage.textContent = `Are you sure you want to delete all ${taskCount} tasks?`;
    deleteWarning.textContent = "This action cannot be undone and all your tasks will be permanently lost.";
    deleteModal.classList.remove('single-delete-modal');
    confirmDeleteBtn.innerHTML = '<span>🔥</span> Delete All';
    deleteModal.style.display = 'block';
}

function executeDeleteAction() {
    if (currentDeleteId === null) {
        todoTasks = [];
        showTodoNotification(`All tasks deleted successfully!`, 'warning');
    } else {
        const task = todoTasks.find(task => task.id === currentDeleteId);
        todoTasks = todoTasks.filter(task => task.id !== currentDeleteId);
        showTodoNotification(`Task "${task.text}" deleted successfully!`, 'warning');
    }
    saveTodoTasks();
    renderTodoTasks();
    updateTodoStats();
    closeDeleteModal();
    animateStatsUpdate();
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    currentDeleteId = null;
}

function updateTodoTaskStatus(id, newStatus) {
    todoTasks = todoTasks.map(task => {
        if (task.id === id) {
            return { ...task, status: newStatus };
        }
        return task;
    });
    
    saveTodoTasks();
    renderTodoTasks();
    updateTodoStats();
    const statusMessages = {
        'pending': 'Task marked as Pending',
        'progress': 'Task marked as In Progress', 
        'completed': 'Task marked as Completed'
    };
    showTodoNotification(statusMessages[newStatus], 'info');
}

function saveTodoTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(todoTasks));
}

function renderTodoTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterStatus.value;
    const sortValue = sortTasks.value;
    
    let filteredTasks = todoTasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || task.status === filterValue;
        return matchesSearch && matchesFilter;
    });
    
    filteredTasks.sort((a, b) => {
        switch (sortValue) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'due-date':
                return new Date(a.dueDate) - new Date(b.dueDate);
            default:
                return 0;
        }
    });
    
    if (filteredTasks.length === 0) {
        todoList.innerHTML = '<div class="empty-state">No tasks found. Add your first task above! 📝</div>';
        return;
    }
    
    todoList.innerHTML = filteredTasks.map(task => `
        <div class="todo-item">
            <div class="task-title">${task.text}</div>
            <div class="due-date">${formatTodoDate(task.dueDate)}</div>
            <div class="status-container">
                <select class="status-select" data-id="${task.id}">
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>🚀 In Progress</option>
                    <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                </select>
            </div>
            <div class="actions">
                <button class="action-btn edit-btn" onclick="editTodoTask(${task.id})" title="Edit task">✏️</button>
                <button class="action-btn delete-btn" onclick="showDeleteConfirmation(${task.id})" title="Delete task">🗑️</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            const newStatus = e.target.value;
            updateTodoTaskStatus(id, newStatus);
        });
    });
}

function updateTodoStats() {
    const total = todoTasks.length;
    const completed = todoTasks.filter(task => task.status === 'completed').length;
    const pending = todoTasks.filter(task => task.status === 'pending').length;
    const progress = todoTasks.filter(task => task.status === 'progress').length;
    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    pendingTasksElement.textContent = pending;
    progressTasksElement.textContent = progress;
}

function formatTodoDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function handleThemeChange(e) {
    const theme = e.target.value;
    switchTodoTheme(theme);
    localStorage.setItem('todoTheme', theme);
}

function switchTodoTheme(theme) {
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('todoTheme') || 'light';
    switchTodoTheme(savedTheme);
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function showTodoNotification(message, type) {
    const existingNotifications = document.querySelectorAll('.todo-notification');
    existingNotifications.forEach(notification => notification.remove());
    const notification = document.createElement('div');
    notification.className = `todo-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    const bgColors = {
        'success': '#28a745',
        'warning': '#dc3545', 
        'info': '#17a2b8'
    };
    notification.style.backgroundColor = bgColors[type];
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function animateStatsUpdate() {
    const counts = document.querySelectorAll('.stat-card .count');
    counts.forEach(count => {
        count.classList.add('updated');
        setTimeout(() => {
            count.classList.remove('updated');
        }, 500);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    initTodoApp();
});