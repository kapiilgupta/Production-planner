// Schedule Management

let currentSchedule = [];
let allMachines = [];

// Load machines
async function loadMachines() {
    try {
        const data = await api.get('/schedule/machines');
        allMachines = data.data;
        displayMachines(allMachines);
    } catch (error) {
        showToast('Failed to load machines', 'error');
        document.getElementById('machines-tbody').innerHTML = 
            '<tr><td colspan="6" class="loading">Failed to load machines</td></tr>';
    }
}

// Display machines in table
function displayMachines(machines) {
    const tbody = document.getElementById('machines-tbody');
    
    if (machines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No machines registered yet</td></tr>';
        return;
    }

    tbody.innerHTML = machines.map(machine => `
        <tr>
            <td><strong>${machine.name}</strong></td>
            <td><span class="badge badge-info">${machine.type}</span></td>
            <td>${machine.shiftStartTime} - ${machine.shiftEndTime}</td>
            <td>${machine.shiftMinutes} min</td>
            <td>
                <span class="badge ${machine.isOperational ? 'badge-success' : 'badge-danger'}">
                    ${machine.isOperational ? 'Operational' : 'Down'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="toggleMachineStatus('${machine._id}', ${!machine.isOperational})">
                    <i class="fas fa-power-off"></i> ${machine.isOperational ? 'Disable' : 'Enable'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Open machine modal
function openMachineModal() {
    document.getElementById('machine-form').reset();
    openModal('machine-modal');
}

// Submit machine form
async function submitMachine(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const machineData = {
        name: formData.get('name'),
        type: formData.get('type'),
        shiftStartTime: formData.get('shiftStartTime'),
        shiftEndTime: formData.get('shiftEndTime'),
        shiftMinutes: parseInt(formData.get('shiftMinutes')),
    };

    try {
        await api.post('/schedule/machines', machineData);
        showToast('Machine registered successfully!', 'success');
        closeModal('machine-modal');
        loadMachines();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Toggle machine operational status
async function toggleMachineStatus(machineId, newStatus) {
    try {
        await api.put(`/schedule/machines/${machineId}`, { isOperational: newStatus });
        showToast('Machine status updated', 'success');
        loadMachines();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Open schedule modal
function openScheduleModal() {
    document.getElementById('schedule-form').reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('schedule-date').value = today;
    
    openModal('schedule-modal');
}

// Submit schedule generation
async function submitSchedule(event) {
    event.preventDefault();
    
    const scheduleDate = document.getElementById('schedule-date').value;

    try {
        const result = await api.post('/schedule/generate', { scheduleDate });
        showToast(result.message, 'success');
        closeModal('schedule-modal');
        
        // Auto-load the generated schedule
        document.getElementById('schedule-date-filter').value = scheduleDate;
        filterSchedule();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Filter schedule by date
async function filterSchedule() {
    const dateInput = document.getElementById('schedule-date-filter');
    const date = dateInput.value;
    
    if (!date) {
        showToast('Please select a date', 'warning');
        return;
    }

    try {
        const data = await api.get(`/schedule?date=${date}`);
        currentSchedule = data.data;
        displaySchedule(currentSchedule);
        
        // Hide utilization report when viewing schedule
        document.getElementById('utilization-report').style.display = 'none';
    } catch (error) {
        showToast('Failed to load schedule', 'error');
        document.getElementById('schedule-tbody').innerHTML = 
            '<tr><td colspan="6" class="loading">Failed to load schedule</td></tr>';
    }
}

// Display schedule in table
function displaySchedule(schedule) {
    const tbody = document.getElementById('schedule-tbody');
    
    if (schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No schedule for this date</td></tr>';
        return;
    }

    tbody.innerHTML = schedule.map(slot => `
        <tr>
            <td><strong>${slot.orderNumber}</strong></td>
            <td>${slot.machineName}</td>
            <td>${formatDateTime(slot.startTime)}</td>
            <td>${formatDateTime(slot.endTime)}</td>
            <td>${slot.durationMinutes} min</td>
            <td>${getStatusBadge(slot.status)}</td>
        </tr>
    `).join('');
}

// View utilization report
async function viewUtilization() {
    const dateInput = document.getElementById('schedule-date-filter');
    const date = dateInput.value;
    
    if (!date) {
        showToast('Please select a date first', 'warning');
        return;
    }

    try {
        const data = await api.get(`/schedule/utilization?date=${date}`);
        displayUtilization(data.data, data.summary);
    } catch (error) {
        showToast('Failed to load utilization report', 'error');
    }
}

// Display utilization report
function displayUtilization(utilization, summary) {
    const report = document.getElementById('utilization-report');
    const content = document.getElementById('utilization-content');
    
    content.innerHTML = `
        <div style="background: var(--light); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4>Summary</h4>
            <div class="utilization-stats">
                <div class="utilization-stat">
                    <strong>${summary.totalMachines}</strong>
                    <span>Total Machines</span>
                </div>
                <div class="utilization-stat">
                    <strong>${summary.averageUtilization.toFixed(1)}%</strong>
                    <span>Avg Utilization</span>
                </div>
                <div class="utilization-stat">
                    <strong>${summary.fullyBooked}</strong>
                    <span>Fully Booked</span>
                </div>
            </div>
        </div>
        
        ${utilization.map(machine => `
            <div class="utilization-item">
                <h4>${machine.machineName}</h4>
                <div class="utilization-bar">
                    <div class="utilization-fill" style="width: ${machine.utilizationPercent}%">
                        ${machine.utilizationPercent}%
                    </div>
                </div>
                <div class="utilization-stats">
                    <div class="utilization-stat">
                        <strong>${machine.scheduledMinutes}</strong>
                        <span>Scheduled (min)</span>
                    </div>
                    <div class="utilization-stat">
                        <strong>${machine.idleMinutes}</strong>
                        <span>Idle (min)</span>
                    </div>
                    <div class="utilization-stat">
                        <strong>${machine.numberOfJobs}</strong>
                        <span>Jobs</span>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
    
    report.style.display = 'block';
    
    // Scroll to report
    report.scrollIntoView({ behavior: 'smooth' });
}