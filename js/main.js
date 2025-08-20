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



// Global variables
let mapManager;
let layerManager;
let filterManager;
let uiManager;


// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    mapManager = new MapManager();
    layerManager = new LayerManager(mapManager.getMap());
    filterManager = new FilterManager(mapManager.getMap());
    uiManager = new UIManager();

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

function setupNFHSFilters() {
    const radios = document.getElementById('pollutantRadios');
    radios.innerHTML = `
        <div class="nfhs-selector">
            <input type="text" id="nfhsSearch" placeholder="Search indicators..." readonly onclick="showNFHSModal()">
            <div class="selected-indicator" id="selectedIndicator">None selected</div>
        </div>
    `;
    
    // Setup legend
    const aqiLegend = document.getElementById('aqiLegend');
    aqiLegend.innerHTML = `
        <div class="aqi-item"><span class="aqi-color" style="background: #2E7D32;"></span>Excellent (>70%)</div>
        <div class="aqi-item"><span class="aqi-color" style="background: #66BB6A;"></span>Good (60-70%)</div>
        <div class="aqi-item"><span class="aqi-color" style="background: #FFA726;"></span>Fair (50-60%)</div>
        <div class="aqi-item"><span class="aqi-color" style="background: #EF5350;"></span>Poor (<50%)</div>
        <div class="aqi-item"><span class="aqi-color" style="background: #cccccc;"></span>No Data</div>
    `;
    
    createNFHSModal();
}

function createNFHSModal() {
    if (document.getElementById('nfhsModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'nfhsModal';
    modal.className = 'nfhs-modal';
    modal.innerHTML = `
        <div class="nfhs-modal-content">
            <div class="nfhs-modal-header">
                <h3>Select Health Indicator</h3>
                <span class="close" onclick="closeNFHSModal()">&times;</span>
            </div>
            <input type="text" id="indicatorSearch" placeholder="Search indicators..." oninput="searchIndicators()">
            <div class="indicator-groups" id="indicatorGroups"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    populateIndicators();
}

function populateIndicators() {
    const allIndicators = [
        {id: 'I6822_7', name: 'Women who are literate', group: 'Maternal Health'},
        {id: 'I6822_8', name: 'Women with 10 or more years of schooling', group: 'Maternal Health'},
        {id: 'I6822_9', name: 'Women who have ever used the internet', group: 'Maternal Health'},
        {id: 'I6822_10', name: 'Women who have a bank or savings account', group: 'Maternal Health'},
        {id: 'I6822_11', name: 'Women who have a mobile phone', group: 'Maternal Health'},
        {id: 'I6822_12', name: 'Women age 20-24 years married before age 18 years', group: 'Maternal Health'},
        {id: 'I6822_13', name: 'Women age 20-24 years married before age 21 years', group: 'Maternal Health'},
        {id: 'I6822_14', name: 'Women age 15-19 years who were already mothers or pregnant', group: 'Maternal Health'},
        {id: 'I6822_15', name: 'Total fertility rate', group: 'Maternal Health'},
        {id: 'I6822_16', name: 'Women whose demand for family planning is satisfied', group: 'Maternal Health'},
        {id: 'I6822_17', name: 'Current use of any contraceptive method', group: 'Maternal Health'},
        {id: 'I6822_18', name: 'Current use of any modern method', group: 'Maternal Health'},
        {id: 'I6822_19', name: 'Female sterilisation', group: 'Maternal Health'},
        {id: 'I6822_20', name: 'Male sterilisation', group: 'Maternal Health'},
        {id: 'I6822_21', name: 'Children under age 5 years who are stunted', group: 'Child Health'},
        {id: 'I6822_22', name: 'Children under age 5 years who are wasted', group: 'Child Health'},
        {id: 'I6822_23', name: 'Children under age 5 years who are severely wasted', group: 'Child Health'},
        {id: 'I6822_24', name: 'Children under age 5 years who are underweight', group: 'Child Health'},
        {id: 'I6822_25', name: 'Children age 6-59 months who are anaemic', group: 'Child Health'},
        {id: 'I6822_26', name: 'Children age 12-23 months fully immunized', group: 'Child Health'},
        {id: 'I6822_27', name: 'Children age 12-23 months who received BCG', group: 'Child Health'},
        {id: 'I6822_28', name: 'Children age 12-23 months who received 3 doses of Polio vaccine', group: 'Child Health'},
        {id: 'I6822_29', name: 'Children age 12-23 months who received 3 doses of DPT vaccine', group: 'Child Health'},
        {id: 'I6822_30', name: 'Children age 12-23 months who received measles vaccine', group: 'Child Health'},
        {id: 'I6822_31', name: 'Children age 6-8 months receiving solid or semi-solid food', group: 'Nutrition'},
        {id: 'I6822_32', name: 'Breastfeeding children age 6-23 months receiving adequate diet', group: 'Nutrition'},
        {id: 'I6822_33', name: 'Non-breastfeeding children age 6-23 months receiving adequate diet', group: 'Nutrition'},
        {id: 'I6822_34', name: 'Total children age 6-23 months receiving adequate diet', group: 'Nutrition'},
        {id: 'I6822_35', name: 'Children under 5 years taken to a health facility', group: 'Nutrition'},
        {id: 'I6822_36', name: 'Prevalence of diarrhoea in the 2 weeks preceding the survey', group: 'Nutrition'},
        {id: 'I6822_37', name: 'Children with diarrhoea who received ORS', group: 'Nutrition'},
        {id: 'I6822_38', name: 'Children with diarrhoea who received zinc', group: 'Nutrition'},
        {id: 'I6822_39', name: 'Children with diarrhoea who received ORS and zinc', group: 'Nutrition'},
        {id: 'I6822_40', name: 'Prevalence of symptoms of ARI in the 2 weeks preceding the survey', group: 'Nutrition'},
        {id: 'I6822_41', name: 'Women age 15-49 years who are anaemic', group: 'Women Health'},
        {id: 'I6822_42', name: 'Women who consumed iron folic acid for 100 days or more', group: 'Women Health'},
        {id: 'I6822_43', name: 'Women who had at least 4 antenatal care visits', group: 'Women Health'},
        {id: 'I6822_44', name: 'Mothers who consumed iron folic acid for 180 days or more', group: 'Women Health'},
        {id: 'I6822_45', name: 'Registered pregnancies for which the mother received Mother and Child Protection card', group: 'Women Health'},
        {id: 'I6822_46', name: 'Women who received postnatal care from a doctor/nurse/LHV/ANM/midwife/other health personnel within 2 days of delivery', group: 'Women Health'},
        {id: 'I6822_47', name: 'Women whose last birth was protected against neonatal tetanus', group: 'Women Health'},
        {id: 'I6822_48', name: 'Institutional births', group: 'Women Health'},
        {id: 'I6822_49', name: 'Institutional births in public facility', group: 'Women Health'},
        {id: 'I6822_50', name: 'Home delivery conducted by skilled health personnel', group: 'Women Health'}
    ];
    
    window.nfhsIndicators = allIndicators;
    
    const container = document.getElementById('indicatorGroups');
    const groups = {};
    
    allIndicators.forEach(ind => {
        if (!groups[ind.group]) groups[ind.group] = [];
        groups[ind.group].push(ind);
    });
    
    container.innerHTML = Object.keys(groups).map(group => `
        <div class="indicator-group">
            <h4>${group}</h4>
            ${groups[group].map(ind => 
                `<div class="indicator-item" onclick="selectIndicator('${ind.id}', '${ind.name}')">${ind.name}</div>`
            ).join('')}
        </div>
    `).join('');
}

function showNFHSModal() {
    document.getElementById('nfhsModal').style.display = 'block';
}

function closeNFHSModal() {
    document.getElementById('nfhsModal').style.display = 'none';
}

function searchIndicators() {
    const search = document.getElementById('indicatorSearch').value.toLowerCase();
    const groups = document.querySelectorAll('.indicator-group');
    
    groups.forEach(group => {
        const items = group.querySelectorAll('.indicator-item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(search)) {
                item.style.display = 'block';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        group.style.display = hasVisibleItems ? 'block' : 'none';
    });
}

function selectIndicator(id, name) {
    document.getElementById('selectedIndicator').textContent = name;
    document.getElementById('nfhsSearch').value = name;
    
    if (layerManager) {
        layerManager.selectedNFHSIndicator = id;
        layerManager.renderLayers();
    }
    
    closeNFHSModal();
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
        aqiLegend.style.display = 'none';
        pollutantSection.style.display = 'block';
        pollutantSection.querySelector('.filter-header span:nth-child(2)').textContent = 'Pollutant Filter';
    } else if (layerName === 'NFHS-5 Data') {
        legendImage.style.display = 'none';
        aqiLegend.style.display = 'block';
        pollutantSection.style.display = 'block';
        pollutantSection.querySelector('.filter-header span:nth-child(2)').textContent = 'Health Indicator';
        setupNFHSFilters();
    } else {
        legendImage.style.display = 'block';
        aqiLegend.style.display = 'none';
        pollutantSection.style.display = 'none';
    }
}

function hideDetails() {
    document.getElementById('detailsPanel').style.display = 'none';
}



// Click outside to close menus
document.addEventListener('click', function(event) {
    const headerDropdown = document.getElementById('headerMenuDropdown');
    const filterActionsDropdown = document.getElementById('filterActionsDropdown');
    const nfhsModal = document.getElementById('nfhsModal');
    
    if (headerDropdown && !event.target.closest('.floating-menu-btn') && !headerDropdown.contains(event.target)) {
        headerDropdown.style.display = 'none';
    }
    
    if (filterActionsDropdown && !event.target.closest('#filterActionsBtn') && !filterActionsDropdown.contains(event.target)) {
        filterActionsDropdown.style.display = 'none';
    }
    
    if (nfhsModal && event.target === nfhsModal) {
        closeNFHSModal();
    }
});