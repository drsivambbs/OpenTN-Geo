// OpenTN Geo - Main Application
// Consolidated JavaScript for GIS Web Application

// Map Manager Class
class MapManager {
    constructor() {
        this.map = L.map('map').setView([11.0, 77.0], 7);
        this.map.getContainer().style.backgroundColor = '#ffffff';
        this.initBaseLayers();
        this.initEventListeners();
    }

    initBaseLayers() {
        const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });
        
        const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });
        
        streetMap.addTo(this.map);
        
        const baseLayers = {
            "Street": streetMap,
            "Satellite": satelliteMap,
            "None": L.layerGroup()
        };
        
        L.control.layers(baseLayers).addTo(this.map);
    }

    initEventListeners() {
        this.map.on('mousemove', (e) => {
            document.getElementById('coordsDisplay').textContent = 
                `Coordinates: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
        });
        
        this.map.on('zoomend', () => {
            const scale = Math.round(591657527.591555 / Math.pow(2, this.map.getZoom()));
            document.getElementById('scaleDisplay').textContent = `Scale: 1:${scale.toLocaleString()}`;
        });
    }

    homeView() {
        this.map.setView([11.0, 77.0], 7);
    }

    getMap() {
        return this.map;
    }
}

// UI Manager Class
class UIManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-style-panel') && !e.target.closest('.layer-color') && !e.target.closest('.layer-settings')) {
                document.querySelectorAll('.layer-style-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
            }
            
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeExportModal();
            }
        });

        document.getElementById('filenameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.exportData();
            }
        });
    }

    togglePanel(panelId) {
        const content = document.getElementById(panelId + 'Content');
        const toggle = document.getElementById(panelId + 'Toggle');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            toggle.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            toggle.classList.add('expanded');
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const map = document.getElementById('map');
        const statusBar = document.getElementById('statusBar');
        const homeControls = document.querySelectorAll('.home-control');
        const toggle = document.getElementById('sidebarToggle');
        
        sidebar.classList.toggle('collapsed');
        map.classList.toggle('sidebar-collapsed');
        statusBar.classList.toggle('sidebar-collapsed');
        homeControls.forEach(control => control.classList.toggle('collapsed'));
        toggle.classList.toggle('collapsed');
        
        updateFilterActionsPosition();
        
        setTimeout(() => {
            window.mapManager.getMap().invalidateSize();
        }, 300);
    }

    showExportModal() {
        if (!filterManager.getFilteredData()) {
            alert('No layer selected. Please select districts and HUDs to export data.');
            return;
        }
        document.getElementById('exportModal').classList.add('active');
        document.getElementById('filenameInput').focus();
    }

    closeExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    }

    exportData() {
        const filename = document.getElementById('filenameInput').value.trim();
        const filteredData = filterManager.getFilteredData();
        if (!filename || !filteredData) return;
        
        const finalFilename = filename.endsWith('.geojson') ? filename : filename + '.geojson';
        
        const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.closeExportModal();
    }

    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.remove();
        }
    }
}

// AI Assistant Class
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
    }

    async callGenkitFunction(functionName, data) {
        try {
            const response = await fetch('https://scoobyai-6hbf73mqwq-uc.a.run.app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: data.query })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Genkit AI failed:`, error);
            throw error;
        }
    }

    async sendQuery(query) {
        const mapData = this.getMapContext();
        
        try {
            const result = await this.callGenkitFunction('gisAssistant', {
                query: query,
                mapData: mapData
            });
            
            return result.result;
        } catch (error) {
            return "I'm having trouble connecting to the AI service. Please try again later.";
        }
    }

    getMapContext() {
        return {
            center: mapManager ? mapManager.map.getCenter() : null,
            zoom: mapManager ? mapManager.map.getZoom() : null,
            bounds: mapManager ? mapManager.map.getBounds() : null,
            activeLayers: layerManager ? Array.from(layerManager.layers.keys()) : []
        };
    }
}

// Global variables
let mapManager;
let layerManager;
let filterManager;
let uiManager;
let aiAssistant;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    mapManager = new MapManager();
    layerManager = new LayerManager(mapManager.getMap());
    filterManager = new FilterManager(mapManager.getMap());
    uiManager = new UIManager();
    aiAssistant = new AIAssistant();
});

// Global functions for HTML onclick handlers
function toggleSidebar() {
    uiManager.toggleSidebar();
}

function togglePanel(panelId) {
    uiManager.togglePanel(panelId);
}

function toggleCategory(categoryId) {
    const content = document.getElementById(categoryId + 'Content');
    const toggle = document.getElementById(categoryId + 'Toggle');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
    } else {
        content.classList.add('expanded');
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
    }
}

function addSpecificLayer(url, name) {
    layerManager.addSpecificLayer(url, name);
}

function addWMSLayer() {
    layerManager.addWMSLayer();
}

function addAQILayer() {
    layerManager.addAQILayer();
}

function addNFHSLayer() {
    layerManager.addNFHSLayer();
}

function homeView() {
    mapManager.homeView();
}

function showExportModal() {
    uiManager.showExportModal();
}

function closeExportModal() {
    uiManager.closeExportModal();
}

function exportData() {
    uiManager.exportData();
}

function toggleFilterActions() {
    const dropdown = document.getElementById('filterActionsDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function zoomToFiltered() {
    filterManager.zoomToFiltered();
    document.getElementById('filterActionsDropdown').style.display = 'none';
}

function cropToFiltered() {
    filterManager.cropToFiltered();
    document.getElementById('filterActionsDropdown').style.display = 'none';
}

function revertToOriginal() {
    filterManager.revertToOriginal();
    document.getElementById('filterActionsDropdown').style.display = 'none';
}

function updateFilterActionsPosition() {
    const dropdown = document.getElementById('filterActionsDropdown');
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('collapsed')) {
        dropdown.classList.add('collapsed');
    } else {
        dropdown.classList.remove('collapsed');
    }
}

function toggleHeaderMenu() {
    const dropdown = document.getElementById('headerMenuDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleFilterPopup() {
    const popup = document.getElementById('filterPopup');
    const headerDropdown = document.getElementById('headerMenuDropdown');
    const isVisible = popup.style.display === 'block';
    
    headerDropdown.style.display = 'none';
    popup.style.display = isVisible ? 'none' : 'block';
}

// Filter functions
function searchDistricts(value) {
    if (filterManager) {
        filterManager.searchDistricts(value);
    }
}

function selectDistrict(value) {
    if (filterManager) {
        filterManager.selectDistrict(value);
    }
}

function updateFilter() {
    if (filterManager) {
        filterManager.updateFilter();
    }
}

function selectAllDistricts() {
    if (filterManager) {
        filterManager.selectAllDistricts();
    }
}

function clearAllDistricts() {
    if (filterManager) {
        filterManager.clearAllDistricts();
    }
}

function selectAllHuds() {
    if (filterManager) {
        filterManager.selectAllHuds();
    }
}

function clearAllHuds() {
    if (filterManager) {
        filterManager.clearAllHuds();
    }
}

function selectAllBlocks() {
    if (filterManager) {
        filterManager.selectAllBlocks();
    }
}

function clearAllBlocks() {
    if (filterManager) {
        filterManager.clearAllBlocks();
    }
}

function toggleDetails() {
    const content = document.getElementById('detailsContent');
    const toggle = document.getElementById('detailsToggle');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.classList.add('collapsed');
    } else {
        content.classList.add('expanded');
        toggle.classList.remove('collapsed');
    }
}

function filterPollutants() {
    const selected = document.querySelector('input[name="pollutant"]:checked');
    if (selected && filterManager) {
        filterManager.selectedPollutant = selected.value;
        filterManager.filterByPollutant();
    }
}

function showDetails(layerName) {
    const panel = document.getElementById('detailsPanel');
    const layerNameEl = document.getElementById('detailsLayerName');
    const legendSection = document.getElementById('legendSection');
    const pollutantSection = document.getElementById('pollutantFilterSection');
    const aqiLegend = document.getElementById('aqiLegend');
    const legendImage = document.getElementById('legendImage');
    
    panel.style.display = 'block';
    layerNameEl.textContent = layerName;
    
    if (layerName === 'Air Quality Index') {
        legendImage.style.display = 'none';
        aqiLegend.style.display = 'block';
        pollutantSection.style.display = 'block';
    } else {
        legendImage.style.display = 'block';
        aqiLegend.style.display = 'none';
        pollutantSection.style.display = 'none';
    }
}

function hideDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
}

// AI Chat functions
function toggleAIChat() {
    const chat = document.getElementById('aiChat');
    const headerDropdown = document.getElementById('headerMenuDropdown');
    const isVisible = chat.style.display === 'flex';
    
    headerDropdown.style.display = 'none';
    chat.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible) {
        document.getElementById('chatInput').focus();
        if (document.getElementById('chatMessages').children.length === 0) {
            addMessage('ai', 'Rello! I\'m Scooby AI! I can help you with layers, air quality, districts, and more! What would you like to know?');
        }
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const query = input.value.trim();
    
    if (!query) return;
    
    addMessage('user', query);
    input.value = '';
    
    const loadingMsg = addMessage('ai', 'Thinking...', true);
    
    try {
        const response = await aiAssistant.sendQuery(query);
        removeMessage(loadingMsg);
        addMessage('ai', response);
    } catch (error) {
        removeMessage(loadingMsg);
        addMessage('ai', 'Sorry, I encountered an error. Please try again.');
    }
}

function quickQuery(query) {
    document.getElementById('chatInput').value = query;
    sendMessage();
}

function addMessage(type, content, isLoading = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}${isLoading ? ' loading' : ''}`;
    messageDiv.textContent = content;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

function removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
    }
}

// Click outside to close menus
document.addEventListener('click', function(event) {
    const headerDropdown = document.getElementById('headerMenuDropdown');
    const filterActionsDropdown = document.getElementById('filterActionsDropdown');
    
    if (headerDropdown && !event.target.closest('.floating-menu-btn') && !headerDropdown.contains(event.target)) {
        headerDropdown.style.display = 'none';
    }
    
    if (filterActionsDropdown && !event.target.closest('#filterActionsBtn') && !filterActionsDropdown.contains(event.target)) {
        filterActionsDropdown.style.display = 'none';
    }
});