// --- 1. Cloud Configuration ---
// REPLACE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzgj4pdw4_jTitQyOWcbRBNCVW2vlBr9rHu1Dg6EGRC7d-t2lLB8c-CigXgHEq6vqwdg/exec';

// Global State
let state = {
    teachers: [],
    logs: []
};


// --- 2. DOM Elements & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Clock Elements
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    const dayEl = document.getElementById('current-day');
    
    // Forms
    const teacherForm = document.getElementById('teacher-form');
    const logForm = document.getElementById('log-form');
    
    // Inputs
    const teacherNameInput = document.getElementById('teacher-name');
    const teacherSelect = document.getElementById('teacher-select');
    const logDateInput = document.getElementById('log-date');
    
    // Table & Filters
    const logsTableBody = document.getElementById('logs-table-body');
    const totalLogsEl = document.getElementById('total-logs');
    const emptyState = document.getElementById('empty-state');
    const filterTeacherSelect = document.getElementById('filter-teacher');
    const teacherSummaryEl = document.getElementById('teacher-summary');
    const summaryDaysEl = document.getElementById('summary-days');
    const summaryHoursEl = document.getElementById('summary-hours');

    // Initialize UI
    startClock(timeEl, dateEl, dayEl);
    setDefaultDate(logDateInput);
    
    // Load Data from Cloud
    loadData();

    // --- 3. Event Listeners ---

    // Set Time to Now Buttons
    function getCurrentTimeStr() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    document.getElementById('btn-start-now').addEventListener('click', () => {
        document.getElementById('start-time').value = getCurrentTimeStr();
    });

    document.getElementById('btn-end-now').addEventListener('click', () => {
        document.getElementById('end-time').value = getCurrentTimeStr();
    });

    // Add Teacher
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = teacherNameInput.value.trim();
        if (!name) return;
        
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showToast("Setup Required", "Please configure the SCRIPT_URL in app.js first.", "warning");
            return;
        }

        const btn = teacherForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const formData = new URLSearchParams();
            formData.append('action', 'addTeacher');
            formData.append('name', name);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                state.teachers.push({ id: result.id, name: name });
                renderTeachers();
                teacherNameInput.value = '';
                showToast("Success", "Teacher added to cloud.", "success");
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error(err);
            showToast("Error", "Failed to add teacher to cloud.", "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // Log Session
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showToast("Setup Required", "Please configure the SCRIPT_URL in app.js first.", "warning");
            return;
        }

        const teacherId = parseInt(teacherSelect.value) || teacherSelect.value;
        const date = document.getElementById('log-date').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;

        if (!teacherId || teacherId === "Choose a teacher...") {
            showToast("Warning", "Please select a teacher.", "warning");
            return;
        }
        
        if (!startTime || !endTime) {
            showToast("Warning", "Please enter both start and end times.", "warning");
            return;
        }

        const btn = logForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Syncing...';
        btn.disabled = true;

        try {
            const teacher = state.teachers.find(t => t.id.toString() === teacherId.toString());
            if (!teacher) throw new Error("Teacher not found");

            const durationStr = calculateDuration(startTime, endTime);

            const formData = new URLSearchParams();
            formData.append('action', 'addLog');
            formData.append('teacherId', teacher.id);
            formData.append('teacherName', teacher.name);
            formData.append('date', date);
            formData.append('startTime', startTime);
            formData.append('endTime', endTime);
            formData.append('duration', durationStr);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                state.logs.push({
                    id: result.id,
                    teacherId: teacher.id,
                    teacherName: teacher.name,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    duration: durationStr
                });
                
                document.getElementById('start-time').value = '';
                document.getElementById('end-time').value = '';
                
                showToast("Session Saved", "Log synced to Google Sheets.", "success");
                renderLogs();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error(err);
            showToast("Error", "Failed to save log to cloud.", "error");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // Filter Logs by Teacher
    filterTeacherSelect.addEventListener('change', renderLogs);

    // --- 4. Core Functions ---

    async function loadData() {
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showToast("Setup Needed", "Configure SCRIPT_URL to load cloud data.", "warning");
            return;
        }

        try {
            showToast("Syncing", "Fetching data from Google Sheets...", "info");
            const response = await fetch(SCRIPT_URL + "?action=getData");
            const data = await response.json();
            
            state.teachers = data.teachers || [];
            state.logs = data.logs || [];
            
            renderTeachers();
            renderLogs();
            showToast("Online", "Cloud synchronization complete.", "success");
        } catch (err) {
            console.error("Fetch Error:", err);
            showToast("Offline", "Could not reach cloud. Please check connection.", "error");
        }
    }

    function renderTeachers() {
        teacherSelect.innerHTML = '<option value="" disabled selected>Choose a teacher...</option>';
        filterTeacherSelect.innerHTML = '<option value="all">All Teachers</option>';
        
        state.teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);

            const filterOption = document.createElement('option');
            filterOption.value = teacher.id;
            filterOption.textContent = teacher.name;
            filterTeacherSelect.appendChild(filterOption);
        });
    }

    function renderLogs() {
        // Sort logs by date descending (newest first)
        let displayLogs = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const filterValue = filterTeacherSelect.value;
        
        if (filterValue !== 'all') {
            displayLogs = displayLogs.filter(log => log.teacherId.toString() === filterValue.toString());
            
            // Calculate total days and hours
            const uniqueDays = new Set(displayLogs.map(log => log.date));
            const totalDays = uniqueDays.size;
            
            let totalMinutes = 0;
            displayLogs.forEach(log => {
                const start = new Date(`1970-01-01T${log.startTime}:00`);
                const end = new Date(`1970-01-01T${log.endTime}:00`);
                let diffMs = end - start;
                if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
                totalMinutes += Math.floor(diffMs / (1000 * 60));
            });
            
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            summaryDaysEl.textContent = totalDays;
            summaryHoursEl.textContent = `${hours}h ${minutes}m`;
            
            teacherSummaryEl.classList.remove('hidden');
            teacherSummaryEl.classList.add('flex');
        } else {
            teacherSummaryEl.classList.add('hidden');
            teacherSummaryEl.classList.remove('flex');
        }
        
        logsTableBody.innerHTML = '';
        totalLogsEl.textContent = displayLogs.length;

        if (displayLogs.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        } else {
            emptyState.classList.add('hidden');
            emptyState.classList.remove('flex');
            
            displayLogs.forEach(log => {
                const row = document.createElement('tr');
                
                const dateObj = new Date(log.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                const formattedStart = formatTime12Hr(log.startTime);
                const formattedEnd = formatTime12Hr(log.endTime);

                row.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-300">${formattedDate}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-studio-700 flex items-center justify-center text-xs font-bold text-indigo-400 border border-gray-600">
                                ${log.teacherName.charAt(0).toUpperCase()}
                            </div>
                            <span>${log.teacherName}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-400">
                        <span class="inline-block bg-studio-950 px-2 py-1 rounded border border-gray-800 text-xs">${formattedStart}</span>
                        <span class="mx-1 opacity-50">-</span>
                        <span class="inline-block bg-studio-950 px-2 py-1 rounded border border-gray-800 text-xs">${formattedEnd}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            <i class="ph-fill ph-timer"></i> ${log.duration}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="deleteLog('${log.id}')" class="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10" title="Delete Entry">
                            <i class="ph-bold ph-trash text-lg"></i>
                        </button>
                    </td>
                `;
                logsTableBody.appendChild(row);
            });
        }
    }

    // Make deleteLog globally available
    window.deleteLog = async function(id) {
        if (!confirm('Are you sure you want to delete this log from the cloud?')) return;
        
        // Optimistic UI delete
        const originalLogs = [...state.logs];
        state.logs = state.logs.filter(log => log.id.toString() !== id.toString());
        renderLogs();
        
        try {
            const formData = new URLSearchParams();
            formData.append('action', 'deleteLog');
            formData.append('id', id);

            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                showToast("Deleted", "Log removed from cloud.", "info");
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            console.error(err);
            // Revert state if error
            state.logs = originalLogs;
            renderLogs();
            showToast("Error", "Could not delete log from cloud.", "error");
        }
    };

    // Calculate duration logic
    function calculateDuration(start, end) {
        const startTime = new Date(`1970-01-01T${start}:00`);
        const endTime = new Date(`1970-01-01T${end}:00`);
        
        let diffMs = endTime - startTime;
        if (diffMs < 0) {
            diffMs += 24 * 60 * 60 * 1000;
        }
        
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
        return `${hours}h ${minutes}m`;
    }

    // --- 5. Helper Utilities ---

    function startClock(timeEl, dateEl, dayEl) {
        function update() {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            dayEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
        }
        update();
        setInterval(update, 1000);
    }

    function setDefaultDate(input) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        input.value = `${yyyy}-${mm}-${dd}`;
    }

    function formatTime12Hr(timeStr) {
        const [hourStr, minute] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${minute} ${ampm}`;
    }

    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        let bgClass, iconClass, iconName;
        switch (type) {
            case 'success':
                bgClass = 'bg-emerald-500/10 border-emerald-500/20';
                iconClass = 'text-emerald-400 bg-emerald-500/10';
                iconName = 'ph-check-circle';
                break;
            case 'error':
                bgClass = 'bg-red-500/10 border-red-500/20';
                iconClass = 'text-red-400 bg-red-500/10';
                iconName = 'ph-x-circle';
                break;
            case 'warning':
                bgClass = 'bg-amber-500/10 border-amber-500/20';
                iconClass = 'text-amber-400 bg-amber-500/10';
                iconName = 'ph-warning';
                break;
            default:
                bgClass = 'bg-indigo-500/10 border-indigo-500/20';
                iconClass = 'text-indigo-400 bg-indigo-500/10';
                iconName = 'ph-info';
        }

        toast.className = `toast-enter flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg w-80 ${bgClass} bg-studio-900/90`;
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}">
                <i class="ph-fill ${iconName} text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-semibold text-white truncate">${title}</h4>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">${message}</p>
            </div>
            <button class="text-gray-500 hover:text-white transition-colors">
                <i class="ph ph-x"></i>
            </button>
        `;

        container.appendChild(toast);

        const removeToast = () => {
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('button').addEventListener('click', removeToast);
        setTimeout(removeToast, 4000);
    }
});
