// Production Planning Management

let allOrders = [];

// Load production orders
async function loadProductionOrders(status = '') {
    try {
        const endpoint = status ? `/production-orders?status=${status}` : '/production-orders';
        const data = await api.get(endpoint);
        allOrders = data.data;
        displayOrders(allOrders);
    } catch (error) {
        showToast('Failed to load production orders', 'error');
        document.getElementById('orders-tbody').innerHTML = 
            '<tr><td colspan="7" class="loading">Failed to load orders</td></tr>';
    }
}

// Display orders in table
function displayOrders(orders) {
    const tbody = document.getElementById('orders-tbody');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No production orders yet</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.orderNumber}</strong></td>
            <td>${order.productName}</td>
            <td>
                ${order.items.length} items
                <br>
                <small style="color: var(--text-light);">
                    ${order.items.map(i => `${i.sizeLabel}: ${i.plannedQty}`).join(', ')}
                </small>
            </td>
            <td>${formatDate(order.dueDate)}</td>
            <td>${order.totalDurationMinutes} min</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick='viewOrder(${JSON.stringify(order)})'>
                    <i class="fas fa-eye"></i> View
                </button>
                ${order.status === 'pending' ? `
                    <button class="btn btn-sm btn-warning" onclick="updateOrderStatus('${order._id}', 'cancelled')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: 'badge-warning',
        scheduled: 'badge-info',
        'in-progress': 'badge-primary',
        completed: 'badge-success',
        cancelled: 'badge-danger'
    };
    
    return `<span class="badge ${badges[status] || 'badge-secondary'}">${status.toUpperCase()}</span>`;
}

// Filter orders by status
function filterOrders() {
    const status = document.getElementById('order-status-filter').value;
    loadProductionOrders(status);
}

// Open planning modal
function openPlanningModal() {
    document.getElementById('planning-form').reset();
    
    // Set default period to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const periodValue = nextMonth.toISOString().slice(0, 7);
    document.getElementById('planning-period').value = periodValue;
    
    openModal('planning-modal');
}

// Submit planning generation
async function submitPlanning(event) {
    event.preventDefault();
    
    const forecastPeriod = document.getElementById('planning-period').value;

    try {
        const result = await api.post('/planning/generate', { forecastPeriod });
        showToast(result.message, 'success');
        closeModal('planning-modal');
        loadProductionOrders();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View order details
function viewOrder(order) {
    const details = `
Production Order: ${order.orderNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product: ${order.productName}
Status: ${order.status.toUpperCase()}
Due Date: ${formatDate(order.dueDate)}
Total Duration: ${order.totalDurationMinutes} minutes

Items to Produce:
${order.items.map(item => `
  Size ${item.sizeLabel} (${item.sku})
  - Quantity: ${item.plannedQty} units
  - Time per unit: ${item.machineMinutesPerUnit} min
  - Total time: ${item.totalMinutes} min
`).join('\n')}

Forecast Period: ${order.forecastPeriod}
Created: ${formatDateTime(order.createdAt)}
    `;
    
    alert(details);
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Change order status to ${newStatus}?`)) return;
    
    try {
        await api.patch(`/production-orders/${orderId}/status`, { status: newStatus });
        showToast('Order status updated successfully', 'success');
        loadProductionOrders();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Load recent orders for dashboard
async function loadRecentOrders() {
    try {
        const data = await api.get('/production-orders?status=pending');
        const container = document.getElementById('recent-orders');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">No pending orders</p>';
            return;
        }

        container.innerHTML = data.data.slice(0, 5).map(order => `
            <div class="order-item">
                <strong>${order.orderNumber}</strong> - ${order.productName}
                <br>
                <small>Due: ${formatDate(order.dueDate)} | ${order.items.length} items | ${order.totalDurationMinutes} min</small>
            </div>
        `).join('');
        
        if (data.data.length > 5) {
            container.innerHTML += `<p style="margin-top: 0.5rem; color: var(--text-light);">
                +${data.data.length - 5} more pending orders
            </p>`;
        }
    } catch (error) {
        console.error('Failed to load recent orders:', error);
    }
}