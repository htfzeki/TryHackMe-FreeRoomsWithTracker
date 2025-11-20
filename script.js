document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initModal(); // Initialize Modal
    fetchRooms();
});

/* --- MODAL LOGIC --- */
function initModal() {
    const modal = document.getElementById('about-modal');
    const btn = document.getElementById('about-btn');
    const close = document.querySelector('.close-btn');

    // Open
    btn.addEventListener('click', () => {
        modal.style.display = "block";
    });

    // Close on X click
    close.addEventListener('click', () => {
        modal.style.display = "none";
    });

    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}

/* --- THEME LOGIC --- */
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const icon = toggleBtn.querySelector('i');
    const html = document.documentElement;
    
    // Load Saved Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateIcon(icon, savedTheme);

    toggleBtn.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(icon, newTheme);
    });
}

function updateIcon(iconElement, theme) {
    if (theme === 'dark') {
        iconElement.className = 'fas fa-sun'; // Show sun in dark mode
    } else {
        iconElement.className = 'fas fa-moon'; // Show moon in light mode
    }
}

/* --- DATA HANDLING --- */
async function fetchRooms() {
    try {
        const response = await fetch('./rooms.json');
        const data = await response.json();
        renderRoadmap(data);
        loadState();
    } catch (error) {
        document.getElementById('dynamic-content').innerHTML = 
            `<div style="text-align:center; color:var(--text-secondary); padding: 20px;">
                <i class="fas fa-exclamation-triangle fa-2x" style="color:#e74c3c"></i>
                <p style="margin-top:10px">Unable to load roadmap data.</p>
            </div>`;
    }
}

function renderRoadmap(data) {
    const container = document.getElementById('dynamic-content');
    
    data.forEach(section => {
        // Clean text logic
        const cleanTitle = section.category.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
        
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.id = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'section-title';
        titleEl.textContent = cleanTitle;
        sectionDiv.appendChild(titleEl);

        section.rooms.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-card';
            
            // Badge Logic
            let badgeClass = 'free';
            let badgeText = 'FREE';
            if (room.type && room.type.includes('💸')) {
                badgeClass = 'premium';
                badgeText = 'PREMIUM';
            }

            const cleanRoomTitle = room.title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

            // Button Generation (Embedded look)
            let linksHtml = `
                <a href="${room.url}" target="_blank" class="action-btn primary" title="Go to Room">
                    <i class="fas fa-external-link-alt"></i> Room
                </a>`;
            
            if (room.walkthrough) {
                linksHtml = `
                    <a href="${room.walkthrough}" target="_blank" class="action-btn video" title="Watch Walkthrough">
                        <i class="fab fa-youtube"></i> Video
                    </a>` + linksHtml;
            }

            roomDiv.innerHTML = `
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="${room.id}" data-category="${cleanTitle}">
                    <div class="room-info">
                        <span class="badge ${badgeClass}">${badgeText}</span>
                        <span class="room-name">${cleanRoomTitle}</span>
                    </div>
                </div>
                <div class="actions">
                    ${linksHtml}
                </div>
            `;
            sectionDiv.appendChild(roomDiv);
        });

        container.appendChild(sectionDiv);
    });

    attachListeners();
}

function attachListeners() {
    document.querySelectorAll('input[type="checkbox"]').forEach(box => {
        box.addEventListener('change', () => {
            updateProgress();
            saveState();
        });
    });
}

/* --- PROGRESS LOGIC --- */
function updateProgress() {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = ''; 
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const categories = {};
    let total = 0;
    let completed = 0;

    checkboxes.forEach(box => {
        const cat = box.getAttribute('data-category');
        if (!categories[cat]) categories[cat] = { total: 0, completed: 0 };
        
        categories[cat].total++;
        total++;
        
        const card = box.closest('.room-card');
        if (box.checked) {
            categories[cat].completed++;
            completed++;
            card.classList.add('checked');
        } else {
            card.classList.remove('checked');
        }
    });

    // Update Sidebar
    for (const [name, data] of Object.entries(categories)) {
        const row = document.createElement('div');
        row.className = 'stat-item';
        row.innerHTML = `
            <span>${name}</span>
            <span class="stat-count ${data.completed === data.total ? 'completed' : ''}">
                ${data.completed}/${data.total}
            </span>
        `;
        row.onclick = () => {
            const target = document.getElementById(name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            if (target) {
                // Smooth scroll with offset for header
                const y = target.getBoundingClientRect().top + window.scrollY - 20;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        };
        statsContainer.appendChild(row);
    }
    
    // Update Header Summary
    const percent = Math.round((completed / total) * 100) || 0;
    document.getElementById('progress-summary').innerHTML = 
        `<strong>${percent}%</strong> Complete`;
}

function saveState() {
    const state = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(box => {
        state[box.id] = box.checked;
    });
    localStorage.setItem('roadmapProgress', JSON.stringify(state));
}

function loadState() {
    const saved = JSON.parse(localStorage.getItem('roadmapProgress'));
    if (saved) {
        for (const [id, isChecked] of Object.entries(saved)) {
            const box = document.getElementById(id);
            if (box) box.checked = isChecked;
        }
    }
    updateProgress();
}