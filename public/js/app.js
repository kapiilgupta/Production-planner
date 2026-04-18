// Main App Logic

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboard();
    
    // Set current date on date inputs
    setDefaultDates();
});

// Initialize navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and pages
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding page
            const pageId = link.dataset.page;
            const page = document.getElementById(pageId);
            if (page) {
                page.classList.add('active');
                loadPageData(pageId);
            }
        });
    });
}

// Load data for specific page
function loadPageData(pageId) {
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'forecast':
            loadForecasts();
            break;
        case 'planning':
            loadProductionOrders();
            break;
        case 'schedule':
            // Schedule loads on date selection
            break;
        case 'machines':
            loadMachines();
            break;
    }
}

// Load dashboard stats and data
async function loadDashboard() {
    try {
        // Load all stats in parallel
        const [products, inventory, orders] = await Promise.all([
            api.get('/products'),
            api.get('/inventory'),
            api.get('/production-orders?status=pending')
        ]);

        // Update stats
        document.getElementById('total-products').textContent = products.count || 0;
        document.getElementById('total-inventory').textContent = inventory.count || 0;
        document.getElementById('pending-orders').textContent = orders.count || 0;

        // Load low stock alerts
        await loadLowStockAlerts();
        
        // Calculate low stock count
        const alerts = await api.get('/inventory/alerts');
        document.getElementById('low-stock-count').textContent = alerts.count || 0;

        // Load recent orders
        await loadRecentOrders();

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

// Set default dates on inputs
function setDefaultDates() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Set today on schedule date filter
    const scheduleDateFilter = document.getElementById('schedule-date-filter');
    if (scheduleDateFilter) {
        scheduleDateFilter.value = todayStr;
    }
    
    // Set next month on forecast period filter
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);
    
    const forecastPeriodFilter = document.getElementById('forecast-period-filter');
    if (forecastPeriodFilter) {
        forecastPeriodFilter.value = nextMonthStr;
    }
}

// Auto-refresh dashboard every 30 seconds
setInterval(() => {
    const dashboardPage = document.getElementById('dashboard');
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        loadDashboard();
    }
}, 30000);

// Welcome message
console.log(`
╔═══════════════════════════════════════════════════════╗
║  🏭 Production Planning & Scheduling System          ║
║  📊 Frontend v1.0.0                                   ║
║  ✨ Ready to manage your production!                  ║
╚═══════════════════════════════════════════════════════╝
`);