document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const btnLogout = document.getElementById('btnLogout');

    // Check if already authenticated (simple cookie check for prototype)
    if (document.cookie.includes('admin_token=')) {
        loginOverlay.style.display = 'none';
        fetchDashboardData();
        setupRealtimeUpdates();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                loginOverlay.style.display = 'none';
                fetchDashboardData();
                setupRealtimeUpdates();
            } else {
                loginError.style.display = 'block';
            }
        } catch(err) {
            console.error(err);
        }
    });

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        location.reload();
    });

    function fetchDashboardData() {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                document.getElementById('kpiUsers').textContent = data.users;
                document.getElementById('kpiOnline').textContent = data.online;
                document.getElementById('kpiIncidents').textContent = data.incidents.length;
                document.getElementById('kpiSos').textContent = data.sos;
                document.getElementById('kpiMissions').textContent = data.missions.length;
                
                renderIncidents(data.incidents);
            });
    }

    function renderIncidents(incidents) {
        const tbody = document.getElementById('incidentsTableBody');
        tbody.innerHTML = '';
        incidents.forEach(inc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inc.id || 'N/A'}</td>
                <td>Flood Victim Detection</td>
                <td>${inc.location ? inc.location.lat.toFixed(4) + ', ' + inc.location.lng.toFixed(4) : 'Unknown'}</td>
                <td><span class="badge badge-danger">CRITICAL</span></td>
                <td><span class="badge badge-success">${inc.status || 'ACTIVE'}</span></td>
                <td><button class="btn btn-sm" style="background:#3b82f6;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">View</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function setupRealtimeUpdates() {
        const source = new EventSource('/api/state/stream');
        source.onmessage = (e) => {
            const state = JSON.parse(e.data);
            if (state.type === 'alert_added' || state.type === 'mission_updated') {
                fetchDashboardData(); // Refresh on changes
            }
        };
    }
});
