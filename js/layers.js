class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = new Map();
        this.layerOrder = [];
    }

    addLayer() {
        const select = document.getElementById('layerSelect');
        const filename = select.value;
        if (!filename || this.layers.has(filename)) return;
        
        fetch(filename)
            .then(response => response.json())
            .then(data => {
                const colors = ['#1976d2', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
                let layerName = filename.replace('.geojson', '').replace(/[()\\d]/g, '').trim();
                if (layerName.startsWith('data/')) {
                    layerName = layerName.replace('data/', '');
                }
                
                const layerInfo = {
                    name: layerName,
                    data: data,
                    layer: null,
                    visible: true,
                    color: '#ffffff',
                    strokeColor: '#000000',
                    strokeWidth: 1,
                    opacity: 0
                };
                
                this.layers.set(filename, layerInfo);
                this.layerOrder.push(filename);
                this.updateLayerList();
                this.renderLayers();
                select.value = '';
            });
    }

    updateLayerList() {
        const list = document.getElementById('layerList');
        list.innerHTML = '';
        
        this.layerOrder.forEach((filename, index) => {
            const layerInfo = this.layers.get(filename);
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.draggable = true;
            item.dataset.index = index;
            item.innerHTML = `
                <div class="layer-header">
                    <input type="checkbox" class="layer-checkbox" ${layerInfo.visible ? 'checked' : ''} 
                           onchange="layerManager.toggleLayerVisibility('${filename}')">
                    <div class="layer-color" style="background-color: ${layerInfo.color}" onclick="layerManager.showLayerStyle('${filename}', this)"></div>
                    <span class="layer-name">${layerInfo.name}</span>
                    <div class="layer-actions">
                        <span class="material-icons layer-settings" onclick="layerManager.showLayerStyle('${filename}', this)">settings</span>
                        <span class="material-icons drag-handle">drag_indicator</span>
                        <span class="material-icons layer-remove" onclick="layerManager.removeLayer('${filename}')">delete</span>
                    </div>
                </div>
                <div class="layer-style-panel" id="style-${filename}">
                    <div class="style-header">
                        <div class="style-title">Layer Style</div>
                        <span class="material-icons style-close" onclick="layerManager.hideLayerStyle('${filename}')">close</span>
                    </div>
                    
                    <div class="style-group">
                        <label class="style-label">Fill Color</label>
                        <div class="style-row">
                            <input type="color" class="color-input" value="${layerInfo.color}" 
                                   onchange="layerManager.updateLayerStyle('${filename}', 'fillColor', this.value)">
                            <span>Fill</span>
                        </div>
                    </div>
                    
                    <div class="style-group">
                        <label class="style-label">Stroke</label>
                        <div class="style-row">
                            <input type="color" class="color-input" value="${layerInfo.strokeColor}" 
                                   onchange="layerManager.updateLayerStyle('${filename}', 'strokeColor', this.value)">
                            <span>Color</span>
                        </div>
                        <div class="style-row">
                            <input type="range" class="range-input" min="1" max="10" value="${layerInfo.strokeWidth}" 
                                   onchange="layerManager.updateLayerStyle('${filename}', 'strokeWidth', this.value)">
                            <span class="range-value">${layerInfo.strokeWidth}px</span>
                        </div>
                    </div>
                    
                    <div class="style-group">
                        <label class="style-label">Opacity</label>
                        <div class="style-row">
                            <input type="range" class="range-input" min="0" max="1" step="0.1" value="${layerInfo.opacity}" 
                                   onchange="layerManager.updateLayerStyle('${filename}', 'opacity', this.value)">
                            <span class="range-value">${Math.round(layerInfo.opacity * 100)}%</span>
                        </div>
                    </div>
                    
                    <div class="style-preview">
                        <div class="preview-shape" style="background-color: ${layerInfo.color}; opacity: ${layerInfo.opacity}; border: ${layerInfo.strokeWidth}px solid ${layerInfo.strokeColor};"></div>
                    </div>
                </div>
            `;
            
            this.setupDragAndDrop(item, index);
            list.appendChild(item);
        });
    }

    setupDragAndDrop(item, index) {
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', index);
            item.style.opacity = '0.5';
        });
        
        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });
        
        item.addEventListener('dragover', e => {
            e.preventDefault();
            item.style.borderTop = '2px solid #1976d2';
        });
        
        item.addEventListener('dragleave', () => {
            item.style.borderTop = 'none';
        });
        
        item.addEventListener('drop', e => {
            e.preventDefault();
            item.style.borderTop = 'none';
            const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const dropIndex = parseInt(item.dataset.index);
            
            if (dragIndex !== dropIndex) {
                const draggedItem = this.layerOrder.splice(dragIndex, 1)[0];
                this.layerOrder.splice(dropIndex, 0, draggedItem);
                this.updateLayerList();
                this.renderLayers();
            }
        });
    }

    toggleLayerVisibility(filename) {
        const layerInfo = this.layers.get(filename);
        layerInfo.visible = !layerInfo.visible;
        
        if (layerInfo.isWMS || layerInfo.isAPI) {
            if (layerInfo.visible) {
                showDetails(layerInfo.name);
            } else {
                hideDetails();
            }
        }
        
        this.renderLayers();
    }

    removeLayer(filename) {
        this.showProgress('Deleting layer...', 0);
        
        // Simulate deletion progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            this.updateProgress(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                
                const layerInfo = this.layers.get(filename);
                if (layerInfo && layerInfo.layer) {
                    this.map.removeLayer(layerInfo.layer);
                    if (layerInfo.isWMS || layerInfo.isAPI) {
                        hideDetails();
                    }
                }
                this.layers.delete(filename);
                this.layerOrder = this.layerOrder.filter(f => f !== filename);
                this.updateLayerList();
                
                this.hideProgress();
            }
        }, 100);
    }

    renderLayers() {
        this.layers.forEach(layerInfo => {
            if (layerInfo.layer && !layerInfo.isWMS && !layerInfo.isAPI) {
                this.map.removeLayer(layerInfo.layer);
                layerInfo.layer = null;
            } else if (layerInfo.layer && layerInfo.isAPI) {
                this.map.removeLayer(layerInfo.layer);
                layerInfo.layer = null;
            }
        });
        
        [...this.layerOrder].reverse().forEach(filename => {
            const layerInfo = this.layers.get(filename);
            if (layerInfo.visible) {
                if (layerInfo.isWMS) {
                    if (!this.map.hasLayer(layerInfo.layer)) {
                        layerInfo.layer.addTo(this.map);
                    }
                } else if (layerInfo.isAPI) {
                    if (layerInfo.name === 'NFHS-5 Data') {
                        // Handle NFHS polygon data
                        layerInfo.layer = L.geoJSON(layerInfo.data, {
                            style: (feature) => {
                                const nfhsData = feature.properties.nfhs;
                                let fillColor = '#cccccc';
                                
                                if (this.selectedNFHSIndicator && this.selectedNFHSIndicator !== 'none' && nfhsData && nfhsData[this.selectedNFHSIndicator]) {
                                    const value = nfhsData[this.selectedNFHSIndicator].avg;
                                    if (value > 70) fillColor = '#2E7D32';
                                    else if (value > 60) fillColor = '#66BB6A';
                                    else if (value > 50) fillColor = '#FFA726';
                                    else fillColor = '#EF5350';
                                }
                                
                                return {
                                    fillColor: fillColor,
                                    weight: 1,
                                    opacity: 1,
                                    color: '#000000',
                                    fillOpacity: 0.7
                                };
                            },
                            onEachFeature: (feature, layer) => {
                                const props = feature.properties;
                                const nfhsData = props.nfhs;
                                
                                let popupContent = `<strong>${props.district_n}</strong><br>`;
                                
                                if (nfhsData) {
                                    popupContent += `<br><strong>NFHS-5 Health Indicators:</strong><br>`;
                                    if (nfhsData.I6822_7) popupContent += `Literacy Rate: ${nfhsData.I6822_7.avg}%<br>`;
                                    if (nfhsData.I6822_8) popupContent += `Child Nutrition: ${nfhsData.I6822_8.avg}%<br>`;
                                    if (nfhsData.I6822_9) popupContent += `Maternal Health: ${nfhsData.I6822_9.avg}%<br>`;
                                    if (nfhsData.I6822_10) popupContent += `Immunization: ${nfhsData.I6822_10.avg}%<br>`;
                                } else {
                                    popupContent += `<br><em>No NFHS data available</em>`;
                                }
                                
                                layer.bindTooltip(popupContent, {
                                    className: 'custom-tooltip',
                                    sticky: true
                                });
                            }
                        }).addTo(this.map);
                    } else {
                        // Handle API data (AQI points)
                        layerInfo.layer = L.geoJSON(layerInfo.data, {
                            pointToLayer: (feature, latlng) => {
                                const value = feature.properties.value || 0;
                                const pollutant = feature.properties.pollutant || 'PM2.5';
                                const category = this.getAQICategory(value, pollutant);
                                
                                return L.circleMarker(latlng, {
                                    radius: 8,
                                    fillColor: category.color,
                                    color: '#ffffff',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            },
                            onEachFeature: (feature, layer) => {
                                const props = feature.properties;
                                const category = this.getAQICategory(props.value || 0, props.pollutant || 'PM2.5');
                                const standards = this.getPollutantStandards();
                                const unit = standards[props.pollutant]?.unit || 'µg/m³';
                                const tooltip = `<div style="font-size: 12px;"><strong>Station:</strong> ${props.station}<br><strong>City:</strong> ${props.city}<br><strong>Value:</strong> ${props.value} ${unit}<br><strong>Level:</strong> ${category.level}<br><strong>Pollutant:</strong> ${props.pollutant}<br><strong>Updated:</strong> ${props.last_update}</div>`;
                                layer.bindTooltip(tooltip, {
                                    className: 'custom-tooltip',
                                    sticky: true
                                });
                            }
                        }).addTo(this.map);
                    }
                } else {
                    layerInfo.layer = L.geoJSON(layerInfo.data, {
                        style: {
                            fillColor: layerInfo.color,
                            weight: layerInfo.strokeWidth,
                            opacity: 1,
                            color: layerInfo.strokeColor,
                            fillOpacity: layerInfo.opacity
                        },
                        onEachFeature: (feature, layer) => {
                            if (feature.properties) {
                                let popupContent = '<div style="font-size: 12px;">';
                                Object.keys(feature.properties).forEach(key => {
                                    if (feature.properties[key]) {
                                        popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
                                    }
                                });
                                popupContent += '</div>';
                                layer.bindTooltip(popupContent, {
                                    className: 'custom-tooltip',
                                    sticky: true
                                });
                            }
                        }
                    }).addTo(this.map);
                }
            } else if (layerInfo.isWMS && this.map.hasLayer(layerInfo.layer)) {
                this.map.removeLayer(layerInfo.layer);
            }
        });
    }

    showLayerStyle(filename, element) {
        document.querySelectorAll('.layer-style-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const panel = document.getElementById(`style-${filename}`);
        panel.classList.add('active');
        
        const rect = element.closest('.layer-item').getBoundingClientRect();
        panel.style.top = `${rect.top - 100}px`;
    }

    hideLayerStyle(filename) {
        document.getElementById(`style-${filename}`).classList.remove('active');
    }

    updateLayerStyle(filename, property, value) {
        const layerInfo = this.layers.get(filename);
        
        if (property === 'fillColor') {
            layerInfo.color = value;
        } else if (property === 'strokeColor') {
            layerInfo.strokeColor = value;
        } else if (property === 'strokeWidth') {
            layerInfo.strokeWidth = parseInt(value);
        } else if (property === 'opacity') {
            layerInfo.opacity = parseFloat(value);
        }
        
        const panel = document.getElementById(`style-${filename}`);
        if (property === 'strokeWidth') {
            panel.querySelector('.range-value').textContent = value + 'px';
        } else if (property === 'opacity') {
            panel.querySelector('.range-value').textContent = Math.round(value * 100) + '%';
        }
        
        const preview = panel.querySelector('.preview-shape');
        preview.style.backgroundColor = layerInfo.color;
        preview.style.borderColor = layerInfo.strokeColor;
        preview.style.borderWidth = layerInfo.strokeWidth + 'px';
        preview.style.opacity = layerInfo.opacity;
        
        const colorIndicator = document.querySelector(`[onclick*="${filename}"].layer-color`);
        if (colorIndicator && property === 'fillColor') {
            colorIndicator.style.backgroundColor = value;
        }
        
        if (layerInfo.visible) {
            this.renderLayers();
        }
    }

    addSpecificLayer(path, name) {
        if (this.layers.has(path)) return;
        
        this.showProgress(`Loading ${name}...`, 0);
        
        // Simulate loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 20;
            this.updateProgress(progress);
        }, 100);
        
        fetch(path)
            .then(response => {
                clearInterval(progressInterval);
                this.updateProgress(80);
                return response.json();
            })
            .then(data => {
                this.updateProgress(100);
                
                const colors = ['#1976d2', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
                
                // Default styling for all layers
                let color = '#ffffff';
                let strokeColor = '#000000';
                let opacity = 0;
                
                const layerInfo = {
                    name: name,
                    data: data,
                    layer: null,
                    visible: true,
                    color: color,
                    strokeColor: '#000000',
                    strokeWidth: 1,
                    opacity: opacity
                };
                
                this.layers.set(path, layerInfo);
                this.layerOrder.push(path);
                this.updateLayerList();
                this.renderLayers();
                
                setTimeout(() => this.hideProgress(), 500);
            })
            .catch(error => {
                clearInterval(progressInterval);
                this.hideProgress();
                console.error('Error loading layer:', error);
            });
    }

    addWMSLayer() {
        const wmsPath = 'wms_lulc';
        if (this.layers.has(wmsPath)) return;
        
        this.showProgress('Loading LULC layer...', 0);
        
        // Simulate WMS loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 15;
            this.updateProgress(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                
                const wmsLayer = L.tileLayer.wms('https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms', {
                    layers: 'lulc:TN_LULC50K_1516',
                    format: 'image/png',
                    transparent: true,
                    version: '1.1.1',
                    crs: L.CRS.EPSG4326,
                    attribution: '© NRSC/ISRO Bhuvan'
                });
                
                const layerInfo = {
                    name: 'Land Use/Land Cover',
                    data: null,
                    layer: wmsLayer,
                    visible: true,
                    color: '#ffffff',
                    strokeColor: '#000000',
                    strokeWidth: 1,
                    opacity: 0,
                    isWMS: true
                };
                
                this.layers.set(wmsPath, layerInfo);
                this.layerOrder.push(wmsPath);
                this.updateLayerList();
                wmsLayer.addTo(this.map);
                showDetails('Land Use/Land Cover');
                
                setTimeout(() => this.hideProgress(), 500);
            }
        }, 100);
    }
    
    showProgress(message, percentage) {
        let progressBar = document.getElementById('progressBar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progressBar';
            progressBar.className = 'progress-overlay';
            progressBar.innerHTML = `
                <div class="progress-content">
                    <div class="progress-message">Loading...</div>
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-percentage">0%</div>
                </div>
            `;
            document.body.appendChild(progressBar);
        }
        
        progressBar.querySelector('.progress-message').textContent = message;
        progressBar.querySelector('.progress-percentage').textContent = percentage + '%';
        progressBar.querySelector('.progress-fill').style.width = percentage + '%';
        progressBar.style.display = 'flex';
    }
    
    updateProgress(percentage) {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.querySelector('.progress-percentage').textContent = percentage + '%';
            progressBar.querySelector('.progress-fill').style.width = percentage + '%';
        }
    }
    
    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }
    
    addAQILayer() {
        const aqiPath = 'api_aqi';
        if (this.layers.has(aqiPath)) return;
        
        this.showProgress('Loading Air Quality data...', 0);
        
        const apiUrl = 'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd00000166452e3b7d6e4a04458d7cefe6215260&format=json&filters[state]=TamilNadu&limit=500';
        
        fetch(apiUrl)
            .then(response => {
                this.updateProgress(80);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.updateProgress(90);
                console.log('AQI API Response:', data);
                
                const records = data.records || [];
                const tnRecords = records.filter(record => 
                    record.state && record.state.toLowerCase().includes('tamil') &&
                    record.latitude && record.longitude && 
                    !isNaN(parseFloat(record.latitude)) && 
                    !isNaN(parseFloat(record.longitude))
                );
                
                if (tnRecords.length === 0) {
                    this.hideProgress();
                    alert('No real-time AQI data available for Tamil Nadu');
                    return;
                }
                
                const geoJsonData = {
                    type: 'FeatureCollection',
                    features: tnRecords.map(record => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)]
                        },
                        properties: {
                            station: record.station || 'Unknown',
                            city: record.city || 'Unknown',
                            state: record.state,
                            value: parseFloat(record.avg_value) || parseFloat(record.value) || 0,
                            pollutant: record.pollutant_id || record.pollutant || 'PM2.5',
                            last_update: record.last_update || new Date().toLocaleDateString()
                        }
                    }))
                };
                
                const layerInfo = {
                    name: 'Air Quality Index',
                    data: geoJsonData,
                    layer: null,
                    visible: true,
                    color: '#ff5722',
                    strokeColor: '#ffffff',
                    strokeWidth: 2,
                    opacity: 0.8,
                    isAPI: true
                };
                
                this.layers.set(aqiPath, layerInfo);
                this.layerOrder.push(aqiPath);
                this.updateLayerList();
                this.renderLayers();
                showDetails('Air Quality Index');
                
                if (filterManager) {
                    filterManager.setupPollutantFilter(geoJsonData);
                }
                
                this.updateProgress(100);
                setTimeout(() => this.hideProgress(), 500);
            })
            .catch(error => {
                this.hideProgress();
                console.error('AQI API failed:', error);
                alert('Failed to load real-time AQI data: ' + error.message);
            });
    }
    
    addNFHSLayer() {
        const nfhsPath = 'api_nfhs';
        if (this.layers.has(nfhsPath)) return;
        
        this.showProgress('Loading NFHS-5 data...', 0);
        
        Promise.all([
            fetch('data/Districts (1).geojson').then(r => r.json()),
            this.fetchNFHSData()
        ])
        .then(([districtsData, nfhsData]) => {
            this.updateProgress(80);
            

            
            const mergedData = this.mergeNFHSWithDistricts(districtsData, nfhsData);
            
            const layerInfo = {
                name: 'NFHS-5 Data',
                data: mergedData,
                layer: null,
                visible: true,
                color: '#2196f3',
                strokeColor: '#000000',
                strokeWidth: 1,
                opacity: 0.7,
                isAPI: true
            };
            
            this.layers.set(nfhsPath, layerInfo);
            this.layerOrder.push(nfhsPath);
            this.updateLayerList();
            this.renderLayers();
            showDetails('NFHS-5 Data');
            
            this.updateProgress(100);
            setTimeout(() => this.hideProgress(), 500);
        })
        .catch(error => {
            this.hideProgress();
            console.error('NFHS API failed:', error);
            alert('Failed to load NFHS data: ' + error.message);
        });
    }
    
    async fetchNFHSData() {
        // Direct API call with fallback data
        try {
            const response = await fetch('https://scoobyai-6hbf73mqwq-uc.a.run.app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'fetchNFHS' })
            });
            
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.warn('NFHS API failed, using fallback data');
            return [];
        }
    }
    
    mergeNFHSWithDistricts(districtsData, nfhsData) {
        const nfhsLookup = {};
        nfhsData.forEach(record => {
            nfhsLookup[record.DistrictCode] = record;
        });
        
        districtsData.features.forEach(feature => {
            const lgdCode = feature.properties.lgd_code;
            const nfhsRecord = nfhsLookup[lgdCode];
            
            if (nfhsRecord) {
                feature.properties.nfhs = nfhsRecord;
            }
        });
        
        return districtsData;
    }
    

    getPollutantStandards() {
        return {
            "CO": { unit: "mg/m³", ranges: [1.0, 2.0, 10, 17, 34] },
            "NH3": { unit: "µg/m³", ranges: [200, 400, 800, 1200, 1800] },
            "NO2": { unit: "µg/m³", ranges: [40, 80, 180, 280, 400] },
            "Ozone": { unit: "µg/m³", ranges: [50, 100, 168, 208, 748] },
            "PM10": { unit: "µg/m³", ranges: [50, 100, 250, 350, 430] },
            "PM2.5": { unit: "µg/m³", ranges: [30, 60, 90, 120, 250] },
            "SO2": { unit: "µg/m³", ranges: [40, 80, 380, 800, 1600] }
        };
    }
    
    getAQICategory(value, pollutant) {
        const standards = this.getPollutantStandards();
        const ranges = standards[pollutant]?.ranges || [50, 100, 150, 200, 300];
        
        if (value <= ranges[0]) return { level: 'Good', color: '#4caf50' };
        if (value <= ranges[1]) return { level: 'Satisfactory', color: '#8bc34a' };
        if (value <= ranges[2]) return { level: 'Moderate', color: '#ffeb3b' };
        if (value <= ranges[3]) return { level: 'Poor', color: '#ff9800' };
        if (value <= ranges[4]) return { level: 'Very Poor', color: '#f44336' };
        return { level: 'Severe', color: '#9c27b0' };
    }
}