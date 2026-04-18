'use strict';

// ── Highlight current nav link ──────────────────────────────
document.querySelectorAll('.nav-link').forEach((link) => {
  if (link.href === window.location.href || window.location.pathname.startsWith(new URL(link.href).pathname) && new URL(link.href).pathname !== '/') {
    link.style.color = '#e2e8f0';
    link.style.background = 'rgba(79,142,247,0.15)';
  }
});

// ── Auto-dismiss alerts after 4 seconds ────────────────────
document.querySelectorAll('.alert').forEach((alert) => {
  setTimeout(() => {
    alert.style.transition = 'opacity 0.4s ease';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 400);
  }, 4000);
});

// ── Date validation: end date >= start date ─────────────────
const startDate = document.getElementById('plannedStartDate');
const endDate   = document.getElementById('plannedEndDate');
if (startDate && endDate) {
  startDate.addEventListener('change', () => {
    endDate.min = startDate.value;
  });
}

const startTime = document.getElementById('startTime');
const endTime   = document.getElementById('endTime');
if (startTime && endTime) {
  startTime.addEventListener('change', () => {
    endTime.min = startTime.value;
  });
}
