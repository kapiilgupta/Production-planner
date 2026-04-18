// Inventory Management

let allInventory = [];

// Load inventory
async function loadInventory() {
    try {
        const data = await api.get('/inventory');
        allInventory = data.data;
        displayInventory(allInventory);
    } catch (error) {
        showToast('Failed to load inventory', 'error');
        document.getElementById('inventory-tbody').innerHTML = 
            '<tr><td colspan="7" class="loading">Failed to load inventory</td></tr>';
    }
}

// Display inventory in table
function displayInventory(inventory) {
    const tbody = document.getElementById('inventory-tbody');
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No inventory records found</td></tr>';
        return;
    }

    tbody.innerHTML = inventory.map(item => {
        const isLowStock = item.quantityOnHand <= item.reorderPoint;
        return `
            <tr>
                <td><strong>${item.sku}</strong></td>
                <td>${item.productId ? item.productId.name : 'N/A'}</td>
                <td>${getSizeLabel(item)}</td>
                <td>${item.quantityOnHand}</td>
                <td>${item.reorderPoint}</td>
                <td>
                    <span class="badge ${isLowStock ? 'badge-danger' : 'badge-success'}">
                        ${isLowStock ? '⚠️ Low Stock' : '✓ Sufficient'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick='openInventoryModal(${JSON.stringify(item)})'>
                        <i class="fas fa-edit"></i> Update
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get size label helper
function getSizeLabel(item) {
    if (item.productId && item.productId.sizes) {
        const size = item.productId.sizes.find(s => s._id === item.sizeId);
        return size ? size.sizeLabel : 'N/A';
    }
    return 'N/A';
}

// Refresh inventory
async function refreshInventory() {
    showToast('Refreshing inventory...', 'info');
    await loadInventory();
    showToast('Inventory refreshed', 'success');
}

// Show low stock only
function showLowStockOnly() {
    const lowStock = allInventory.filter(item => item.quantityOnHand <= item.reorderPoint);
    displayInventory(lowStock);
    showToast(`Showing ${lowStock.length} low stock items`, 'info');
}

// Search inventory
document.getElementById('inventory-search')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allInventory.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        (item.productId && item.productId.name.toLowerCase().includes(searchTerm))
    );
    displayInventory(filtered);
});

// Open inventory update modal
function openInventoryModal(item) {
    document.getElementById('inventory-sku').value = item.sku;
    document.getElementById('inventory-sku-display').value = item.sku;
    document.getElementById('inventory-qty').value = item.quantityOnHand;
    openModal('inventory-modal');
}

// Submit inventory update
async function submitInventoryUpdate(event) {
    event.preventDefault();
    
    const sku = document.getElementById('inventory-sku').value;
    const quantityOnHand = parseInt(document.getElementById('inventory-qty').value);

    try {
        await api.put(`/inventory/${sku}`, { quantityOnHand });
        showToast('Inventory updated successfully!', 'success');
        closeModal('inventory-modal');
        loadInventory();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Load low stock alerts for dashboard
async function loadLowStockAlerts() {
    try {
        const data = await api.get('/inventory/alerts');
        const container = document.getElementById('low-stock-alerts');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="color: var(--success);">✓ All items have sufficient stock</p>';
            return;
        }

        container.innerHTML = data.data.slice(0, 5).map(item => `
            <div class="alert-item">
                <strong>${item.sku}</strong> - ${item.productId ? item.productId.name : 'Unknown'}
                <br>
                <small>On Hand: ${item.quantityOnHand} | Reorder Point: ${item.reorderPoint}</small>
            </div>
        `).join('');
        
        if (data.data.length > 5) {
            container.innerHTML += `<p style="margin-top: 0.5rem; color: var(--text-light);">
                +${data.data.length - 5} more items need attention
            </p>`;
        }
    } catch (error) {
        console.error('Failed to load alerts:', error);
    }
}