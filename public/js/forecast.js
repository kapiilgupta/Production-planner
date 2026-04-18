// Forecast Management

let currentProducts = [];

// Load forecasts
async function loadForecasts(period = '') {
    try {
        const endpoint = period ? `/forecast?period=${period}` : '/forecast';
        const data = await api.get(endpoint);
        displayForecasts(data.data);
    } catch (error) {
        showToast('Failed to load forecasts', 'error');
        document.getElementById('forecast-tbody').innerHTML = 
            '<tr><td colspan="7" class="loading">Failed to load forecasts</td></tr>';
    }
}

// Display forecasts in table
function displayForecasts(forecasts) {
    const tbody = document.getElementById('forecast-tbody');
    
    if (forecasts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No forecasts generated yet</td></tr>';
        return;
    }

    tbody.innerHTML = forecasts.map(forecast => `
        <tr>
            <td><strong>${forecast.sku}</strong></td>
            <td>${forecast.productId ? forecast.productId.name : 'N/A'}</td>
            <td>${forecast.forecastPeriod}</td>
            <td><strong>${forecast.forecastQty}</strong> units</td>
            <td><span class="badge badge-info">${forecast.algorithm}</span></td>
            <td>${formatDate(forecast.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick='viewForecastDetails(${JSON.stringify(forecast)})'>
                    <i class="fas fa-eye"></i> Details
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteForecast('${forecast._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter forecasts by period
function filterForecasts() {
    const periodInput = document.getElementById('forecast-period-filter');
    const period = periodInput.value; // Format: YYYY-MM
    
    if (!period) {
        showToast('Please select a period', 'warning');
        return;
    }

    loadForecasts(period);
}

// Open forecast modal
async function openForecastModal() {
    try {
        // Load products for forecast input
        const data = await api.get('/products?isActive=true');
        currentProducts = data.data;
        
        // Set default period to next month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const periodValue = nextMonth.toISOString().slice(0, 7);
        document.getElementById('forecast-period').value = periodValue;
        
        // Build forecast input form
        buildForecastInputs(currentProducts);
        
        openModal('forecast-modal');
    } catch (error) {
        showToast('Failed to load products', 'error');
    }
}

// Build forecast input fields
function buildForecastInputs(products) {
    const container = document.getElementById('forecast-data-container');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="loading">No active products found. Create products first.</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        return `
            <div class="forecast-sku-group">
                <h5>${product.name}</h5>
                ${product.sizes.map(size => `
                    <div style="margin-bottom: 1rem;">
                        <strong>${size.sizeLabel} (${size.sku})</strong>
                        <div class="forecast-months">
                            <div class="forecast-month">
                                <label>Month 1 (oldest)</label>
                                <input type="number" 
                                    class="input-field" 
                                    placeholder="Sold Qty"
                                    data-sku="${size.sku}"
                                    data-period="1"
                                    min="0">
                            </div>
                            <div class="forecast-month">
                                <label>Month 2</label>
                                <input type="number" 
                                    class="input-field" 
                                    placeholder="Sold Qty"
                                    data-sku="${size.sku}"
                                    data-period="2"
                                    min="0">
                            </div>
                            <div class="forecast-month">
                                <label>Month 3 (latest)</label>
                                <input type="number" 
                                    class="input-field" 
                                    placeholder="Sold Qty"
                                    data-sku="${size.sku}"
                                    data-period="3"
                                    min="0">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// Submit forecast generation
async function submitForecast(event) {
    event.preventDefault();
    
    const forecastPeriod = document.getElementById('forecast-period').value;
    const inputs = document.querySelectorAll('#forecast-data-container input[data-sku]');
    
    // Organize data by SKU
    const historicalData = {};
    
    inputs.forEach(input => {
        const sku = input.dataset.sku;
        const period = input.dataset.period;
        const soldQty = parseInt(input.value) || 0;
        
        if (!historicalData[sku]) {
            historicalData[sku] = [];
        }
        
        // Create period string (3 months back from forecast period)
        const forecastDate = new Date(forecastPeriod + '-01');
        const dataDate = new Date(forecastDate);
        dataDate.setMonth(dataDate.getMonth() - (4 - parseInt(period)));
        const periodStr = dataDate.toISOString().slice(0, 7);
        
        historicalData[sku].push({
            period: periodStr,
            soldQty: soldQty
        });
    });

    // Filter out SKUs with no data
    const filteredData = {};
    for (const [sku, data] of Object.entries(historicalData)) {
        const hasData = data.some(d => d.soldQty > 0);
        if (hasData) {
            filteredData[sku] = data;
        }
    }

    if (Object.keys(filteredData).length === 0) {
        showToast('Please enter sales data for at least one SKU', 'warning');
        return;
    }

    const requestData = {
        forecastPeriod: forecastPeriod,
        historicalData: filteredData
    };

    try {
        const result = await api.post('/forecast/generate', requestData);
        showToast(`Generated ${result.data.length} forecasts successfully!`, 'success');
        closeModal('forecast-modal');
        loadForecasts(forecastPeriod);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View forecast details
function viewForecastDetails(forecast) {
    const details = `
Forecast Details:
━━━━━━━━━━━━━━━━━
SKU: ${forecast.sku}
Period: ${forecast.forecastPeriod}
Forecasted Quantity: ${forecast.forecastQty} units
Algorithm: ${forecast.algorithm}

Historical Data:
${forecast.historicalData.map(h => `  ${h.period}: ${h.soldQty} units`).join('\n')}

Moving Average Calculation:
(${forecast.historicalData.map(h => h.soldQty).join(' + ')}) / ${forecast.historicalData.length} = ${forecast.forecastQty}
    `;
    
    alert(details);
}

// Delete forecast
async function deleteForecast(forecastId) {
    if (!confirm('Are you sure you want to delete this forecast?')) return;
    
    try {
        await api.delete(`/forecast/${forecastId}`);
        showToast('Forecast deleted successfully', 'success');
        loadForecasts();
    } catch (error) {
        showToast(error.message, 'error');
    }
}