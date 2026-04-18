// Products Management

// Load all products
async function loadProducts() {
    try {
        const data = await api.get('/products');
        displayProducts(data.data);
    } catch (error) {
        showToast('Failed to load products', 'error');
        document.getElementById('products-tbody').innerHTML = 
            '<tr><td colspan="5" class="loading">Failed to load products</td></tr>';
    }
}

// Display products in table
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><strong>${product.name}</strong></td>
            <td><span class="badge badge-info">${product.category}</span></td>
            <td>${product.sizes.length} sizes (${product.sizes.map(s => s.sizeLabel).join(', ')})</td>
            <td>
                <span class="badge ${product.isActive ? 'badge-success' : 'badge-secondary'}">
                    ${product.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info" onclick='viewProduct(${JSON.stringify(product)})'>
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Open product modal
function openProductModal() {
    document.getElementById('product-form').reset();
    document.getElementById('sizes-container').innerHTML = `
        <div class="size-row">
            <input type="text" placeholder="Size Label (e.g., S)" class="input-field size-label" required>
            <input type="text" placeholder="SKU" class="input-field size-sku" required>
            <input type="number" placeholder="Minutes/Unit" class="input-field size-minutes" step="0.1" required>
            <input type="number" placeholder="Material/Unit" class="input-field size-material" step="0.1" required>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeSizeRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    openModal('product-modal');
}

// Add size row
function addSizeRow() {
    const container = document.getElementById('sizes-container');
    const row = document.createElement('div');
    row.className = 'size-row';
    row.innerHTML = `
        <input type="text" placeholder="Size Label (e.g., M)" class="input-field size-label" required>
        <input type="text" placeholder="SKU" class="input-field size-sku" required>
        <input type="number" placeholder="Minutes/Unit" class="input-field size-minutes" step="0.1" required>
        <input type="number" placeholder="Material/Unit" class="input-field size-material" step="0.1" required>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeSizeRow(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);
}

// Remove size row
function removeSizeRow(button) {
    const container = document.getElementById('sizes-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        showToast('At least one size is required', 'warning');
    }
}

// Submit product form
async function submitProduct(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Collect sizes data
    const sizeRows = document.querySelectorAll('.size-row');
    const sizes = Array.from(sizeRows).map(row => ({
        sizeLabel: row.querySelector('.size-label').value,
        sku: row.querySelector('.size-sku').value.toUpperCase(),
        machineMinutesPerUnit: parseFloat(row.querySelector('.size-minutes').value),
        materialQtyPerUnit: parseFloat(row.querySelector('.size-material').value),
    }));

    const productData = {
        name: formData.get('name'),
        category: formData.get('category'),
        sizes: sizes,
    };

    try {
        await api.post('/products', productData);
        showToast('Product created successfully!', 'success');
        closeModal('product-modal');
        loadProducts();
        loadDashboard(); // Refresh dashboard stats
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View product details
function viewProduct(product) {
    const details = `
        <div style="padding: 1rem;">
            <h3>${product.name}</h3>
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Status:</strong> ${product.isActive ? 'Active' : 'Inactive'}</p>
            <h4 style="margin-top: 1rem;">Sizes:</h4>
            <table class="data-table" style="margin-top: 0.5rem;">
                <thead>
                    <tr>
                        <th>Size</th>
                        <th>SKU</th>
                        <th>Minutes/Unit</th>
                        <th>Material/Unit</th>
                    </tr>
                </thead>
                <tbody>
                    ${product.sizes.map(size => `
                        <tr>
                            <td>${size.sizeLabel}</td>
                            <td>${size.sku}</td>
                            <td>${size.machineMinutesPerUnit}</td>
                            <td>${size.materialQtyPerUnit}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    showToast('Product details loaded', 'info');
    // You can create a separate modal for viewing if needed
    alert('Product: ' + product.name + '\nSizes: ' + product.sizes.map(s => s.sizeLabel).join(', '));
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    
    try {
        await api.delete(`/products/${productId}`);
        showToast('Product deactivated successfully', 'success');
        loadProducts();
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'error');
    }
}