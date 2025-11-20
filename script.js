document.addEventListener('DOMContentLoaded', () => {
    fetchRooms();
});

async function fetchRooms() {
    try {
        const response = await fetch('rooms.json');
        const data = await response.json();
        renderRoadmap(data);
        loadState(); // Load checked boxes after rendering
    } catch (error) {
        console.error('Error loading roadmap:', error);
        document.getElementById('dynamic-content').innerHTML = '<p>Error loading data. If you are opening this file directly, you must use a local server (like VS Code Live Server) due to browser security restrictions.</p>';
    }
}

function renderRoadmap(data) {
    const container = document.getElementById('dynamic-content');
    
    data.forEach(section => {
        // 1. Create Section Header
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.id = section.category.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Create ID from title
        
        const title = document.createElement('h2');
        title.textContent = section.category;
        sectionDiv.appendChild(title);

        // 2. Create Room Items
        section.rooms.forEach(room => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item';
            
            // Generate Walkthrough Link HTML if it exists
            const walkthroughHtml = room.walkthrough 
                ? `<a href="${room.walkthrough}" target="_blank" class="icon-link" title="Watch Walkthrough">🎬</a>` 
                : '';

            itemDiv.innerHTML = `
                <div style="display:flex; align-items:center; width:100%">
                    <input type="checkbox" id="${room.id}" data-category="${section.category}">
                    <label for="${room.id}">
                        <span class="room-type">${room.type}</span> 
                        ${room.title}
                    </label>
                    <div class="links">
                        ${walkthroughHtml}
                        <a href="${room.url}" target="_blank" class="icon-link" title="Go to Room">🔗</a>
                    </div>
                </div>
            `;
            sectionDiv.appendChild(itemDiv);
        });

        container.appendChild(sectionDiv);
    });

    // Attach event listeners to the new checkboxes
    attachListeners();
}

function attachListeners() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(box => {
        box.addEventListener('change', () => {
            updateProgress();
            saveState();
        });
    });
}

function updateProgress() {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = ''; 
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const categories = {};

    checkboxes.forEach(box => {
        const cat = box.getAttribute('data-category');
        if (!categories[cat]) {
            categories[cat] = { total: 0, completed: 0 };
        }
        categories[cat].total++;
        
        const parentItem = box.closest('.checklist-item');
        if (box.checked) {
            categories[cat].completed++;
            parentItem.classList.add('checked');
        } else {
            parentItem.classList.remove('checked');
        }
    });

    for (const [name, data] of Object.entries(categories)) {
        const statRow = document.createElement('div');
        statRow.classList.add('stat-item');
        statRow.innerHTML = `
            <span class="stat-name">${name}</span>
            <div>
                <span class="stat-count completed">${data.completed}</span>
                <span class="stat-count">/ ${data.total}</span>
            </div>
        `;
        
        statRow.onclick = () => {
            const sectionId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const element = document.getElementById(sectionId);
            if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        statsContainer.appendChild(statRow);
    }
}

function saveState() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const state = {};
    checkboxes.forEach(box => {
        state[box.id] = box.checked;
    });
    localStorage.setItem('roadmapProgress', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('roadmapProgress');
    if (saved) {
        const state = JSON.parse(saved);
        for (const [id, isChecked] of Object.entries(state)) {
            const box = document.getElementById(id);
            if (box) box.checked = isChecked;
        }
    }
    updateProgress();
}