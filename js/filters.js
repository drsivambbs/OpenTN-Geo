class FilterManager {
    constructor(map) {
        this.map = map;
        this.selectedDistricts = new Set();
        this.selectedHuds = new Set();
        this.selectedBlocks = new Set();
        this.selectedPollutants = new Set();
        this.allPollutants = [];
        this.healthDistrictsData = null;
        this.blocksData = null;
        this.filteredData = null;
        this.allDistricts = [];
        this.allHuds = [];
        this.allBlocks = [];
        this.filterStyle = {
            fillColor: '#ff0000',
            strokeColor: '#000000',
            strokeWidth: 1,
            opacity: 0.2
        };
        this.loadDefaultData();
    }

    loadDefaultData() {
        fetch('data/Health_Districts.geojson')
            .then(response => response.json())
            .then(data => {
                this.healthDistrictsData = data;
                this.setupDistrictFilter(data);
            });
        
        fetch('data/Block.geojson')
            .then(response => response.json())
            .then(data => {
                this.blocksData = data;
                this.setupBlockData(data);
            });
    }

    setupDistrictFilter(data) {
        this.allDistricts = [...new Set(data.features.map(f => f.properties.dist_name))].sort();
        this.populateDistrictOptions(this.allDistricts);
        this.populateDistrictDatalist(this.allDistricts);
    }

    setupBlockData(data) {
        // Store all blocks for filtering
        this.allBlocksData = [...new Set(data.features.map(f => f.properties.Block_Name))].sort();
    }

    populateDistrictOptions(districts) {
        const select = document.getElementById('districtFilter');
        const selectedValues = Array.from(select.selectedOptions).map(o => o.value);
        select.innerHTML = '';
        
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            if (selectedValues.includes(district)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    populateDistrictDatalist(districts) {
        const datalist = document.getElementById('districtList');
        datalist.innerHTML = '';
        
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            datalist.appendChild(option);
        });
    }

    populateHudOptions(huds) {
        const select = document.getElementById('hudFilter');
        const selectedHudValues = Array.from(select.selectedOptions).map(o => o.value);
        select.innerHTML = '';
        
        huds.forEach(hud => {
            const option = document.createElement('option');
            option.value = hud;
            option.textContent = hud;
            if (selectedHudValues.includes(hud)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    populateHudDatalist(huds) {
        const datalist = document.getElementById('hudList');
        datalist.innerHTML = '';
        
        huds.forEach(hud => {
            const option = document.createElement('option');
            option.value = hud;
            datalist.appendChild(option);
        });
    }

    searchDistricts(query) {
        if (!query.trim()) {
            this.populateDistrictOptions(this.allDistricts);
            return;
        }
        
        // Filter options based on search
        const filtered = this.allDistricts.filter(district => 
            district.toLowerCase().includes(query.toLowerCase())
        );
        this.populateDistrictOptions(filtered);
    }

    selectDistrict(value) {
        if (this.allDistricts.includes(value)) {
            const select = document.getElementById('districtFilter');
            Array.from(select.options).forEach(option => {
                if (option.value === value) {
                    option.selected = true;
                }
            });
            this.updateFilter();
            document.getElementById('districtSearch').value = '';
        }
    }

    searchHuds(query) {
        if (!query.trim()) {
            this.populateHudOptions(this.allHuds);
            return;
        }
        
        // Filter options based on search
        const filtered = this.allHuds.filter(hud => 
            hud.toLowerCase().includes(query.toLowerCase())
        );
        this.populateHudOptions(filtered);
    }

    selectHud(value) {
        if (this.allHuds.includes(value)) {
            const select = document.getElementById('hudFilter');
            Array.from(select.options).forEach(option => {
                if (option.value === value) {
                    option.selected = true;
                }
            });
            this.updateFilter();
            document.getElementById('hudSearch').value = '';
        }
    }

    populateBlockOptions(blocks) {
        const select = document.getElementById('blockFilter');
        const selectedValues = Array.from(select.selectedOptions).map(o => o.value);
        select.innerHTML = '';
        
        blocks.forEach(block => {
            const option = document.createElement('option');
            option.value = block;
            option.textContent = block;
            if (selectedValues.includes(block)) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    populateBlockDatalist(blocks) {
        const datalist = document.getElementById('blockList');
        datalist.innerHTML = '';
        
        blocks.forEach(block => {
            const option = document.createElement('option');
            option.value = block;
            datalist.appendChild(option);
        });
    }

    searchBlocks(query) {
        if (!query.trim()) {
            this.populateBlockOptions(this.allBlocks);
            return;
        }
        
        const filtered = this.allBlocks.filter(block => 
            block.toLowerCase().includes(query.toLowerCase())
        );
        this.populateBlockOptions(filtered);
    }

    selectBlock(value) {
        if (this.allBlocks.includes(value)) {
            const select = document.getElementById('blockFilter');
            Array.from(select.options).forEach(option => {
                if (option.value === value) {
                    option.selected = true;
                }
            });
            this.updateFilter();
            document.getElementById('blockSearch').value = '';
        }
    }

    selectAllBlocks() {
        const select = document.getElementById('blockFilter');
        Array.from(select.options).forEach(option => option.selected = true);
        this.updateFilter();
    }

    clearAllBlocks() {
        const select = document.getElementById('blockFilter');
        Array.from(select.options).forEach(option => option.selected = false);
        this.updateFilter();
    }
    
    setupPollutantFilter(aqiData) {
        if (!aqiData || !aqiData.features) return;
        
        this.allPollutants = [...new Set(aqiData.features.map(f => f.properties.pollutant))].sort();
        this.selectedPollutant = 'PM2.5';
        
        const section = document.getElementById('pollutantFilterSection');
        const radios = document.getElementById('pollutantRadios');
        
        radios.innerHTML = '';
        
        this.allPollutants.forEach(pollutant => {
            const div = document.createElement('div');
            div.className = 'pollutant-option';
            const checked = pollutant === 'PM2.5' ? 'checked' : '';
            div.innerHTML = `
                <input type="radio" name="pollutant" id="poll_${pollutant}" value="${pollutant}" ${checked} onchange="filterPollutants()">
                <label for="poll_${pollutant}">${pollutant}</label>
            `;
            radios.appendChild(div);
        });
        
        section.style.display = 'block';
        this.filterByPollutant();
    }
    
    filterByPollutant() {
        const aqiLayer = layerManager.layers.get('api_aqi');
        if (!aqiLayer || !aqiLayer.layer) return;
        
        layerManager.map.removeLayer(aqiLayer.layer);
        
        const filteredData = {
            ...aqiLayer.data,
            features: aqiLayer.data.features.filter(f => 
                f.properties.pollutant === this.selectedPollutant
            )
        };
        
        aqiLayer.layer = L.geoJSON(filteredData, {
            pointToLayer: (feature, latlng) => {
                const value = feature.properties.value || 0;
                const pollutant = feature.properties.pollutant;
                const category = layerManager.getAQICategory(value, pollutant);
                
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
                const category = layerManager.getAQICategory(props.value, props.pollutant);
                const standards = layerManager.getPollutantStandards();
                const unit = standards[props.pollutant]?.unit || 'µg/m³';
                const tooltip = `<div style="font-size: 12px;"><strong>Station:</strong> ${props.station}<br><strong>City:</strong> ${props.city}<br><strong>Value:</strong> ${props.value} ${unit}<br><strong>Level:</strong> ${category.level}<br><strong>Pollutant:</strong> ${props.pollutant}<br><strong>Updated:</strong> ${props.last_update}</div>`;
                layer.bindTooltip(tooltip, {
                    className: 'custom-tooltip',
                    sticky: true
                });
            }
        }).addTo(layerManager.map);
    }

    updateFilter() {
        const districtSelect = document.getElementById('districtFilter');
        const hudSelect = document.getElementById('hudFilter');
        
        this.selectedDistricts = new Set(Array.from(districtSelect.selectedOptions).map(o => o.value));
        
        if (this.selectedDistricts.size > 0) {
            hudSelect.disabled = false;
            document.getElementById('hudSearch').disabled = false;
            this.allHuds = [...new Set(this.healthDistrictsData.features
                .filter(f => this.selectedDistricts.has(f.properties.dist_name))
                .map(f => f.properties.hud_name))].sort();
            
            this.populateHudOptions(this.allHuds);
            this.populateHudDatalist(this.allHuds);
            
            // Enable blocks filter for selected districts
            const blockSelect = document.getElementById('blockFilter');
            blockSelect.disabled = false;
            document.getElementById('blockSearch').disabled = false;
            
            if (this.blocksData) {
                this.allBlocks = [...new Set(this.blocksData.features
                    .filter(f => this.selectedDistricts.has(f.properties.dist_name))
                    .map(f => f.properties.Block_Name))].sort();
                
                this.populateBlockOptions(this.allBlocks);
                this.populateBlockDatalist(this.allBlocks);
            }
        } else {
            hudSelect.disabled = true;
            document.getElementById('hudSearch').disabled = true;
            hudSelect.innerHTML = '';
            this.allHuds = [];
            
            // Disable blocks filter
            const blockSelect = document.getElementById('blockFilter');
            blockSelect.disabled = true;
            document.getElementById('blockSearch').disabled = true;
            blockSelect.innerHTML = '';
            this.allBlocks = [];
        }
        
        this.selectedHuds = new Set(Array.from(hudSelect.selectedOptions).map(o => o.value));
        
        const blockSelect = document.getElementById('blockFilter');
        this.selectedBlocks = new Set(Array.from(blockSelect.selectedOptions).map(o => o.value));
        
        const pollutantSelect = document.getElementById('pollutantFilter');
        this.selectedPollutants = new Set(Array.from(pollutantSelect.selectedOptions).map(o => o.value));
        
        this.applyFilter();
    }

    applyFilter() {
        this.map.eachLayer(layer => {
            if (layer.options && layer.options.isFilter) {
                this.map.removeLayer(layer);
            }
        });
        
        let hasData = false;
        
        // Always show Health Districts if districts are selected
        if (this.healthDistrictsData && this.selectedDistricts.size > 0) {
            const filtered = this.healthDistrictsData.features.filter(f => {
                const distMatch = this.selectedDistricts.has(f.properties.dist_name);
                const hudMatch = this.selectedHuds.size === 0 || this.selectedHuds.has(f.properties.hud_name);
                return distMatch && hudMatch;
            });
            
            if (filtered.length > 0) {
                const filterLayer = L.geoJSON({...this.healthDistrictsData, features: filtered}, {
                    style: {
                        fillColor: this.filterStyle.fillColor,
                        weight: this.filterStyle.strokeWidth,
                        opacity: 1,
                        color: this.filterStyle.strokeColor,
                        fillOpacity: this.filterStyle.opacity
                    },
                    onEachFeature: (feature, layer) => {
                        const props = feature.properties;
                        const tooltip = `<strong>District:</strong> ${props.dist_name}<br><strong>HUD:</strong> ${props.hud_name}<br><strong>HUD Code:</strong> ${props.hud_code}`;
                        layer.bindTooltip(tooltip, {
                            permanent: false,
                            direction: 'top',
                            className: 'custom-tooltip'
                        });
                    },
                    isFilter: true
                }).addTo(this.map);
                
                filterLayer.on('contextmenu', (e) => {
                    this.showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, filterLayer);
                    e.originalEvent.preventDefault();
                });
                
                this.filteredData = {...this.healthDistrictsData, features: filtered};
                hasData = true;
            }
        }
        
        // Show Blocks data when blocks are selected
        if (this.blocksData && this.selectedDistricts.size > 0 && this.selectedBlocks.size > 0) {
            const filteredBlocks = this.blocksData.features.filter(f => {
                const distMatch = this.selectedDistricts.has(f.properties.dist_name);
                const blockMatch = this.selectedBlocks.has(f.properties.Block_Name);
                return distMatch && blockMatch;
            });
            
            if (filteredBlocks.length > 0) {
                const blockLayer = L.geoJSON({...this.blocksData, features: filteredBlocks}, {
                    style: {
                        fillColor: '#2196f3',
                        weight: 1,
                        opacity: 1,
                        color: '#000000',
                        fillOpacity: 0.1
                    },
                    onEachFeature: (feature, layer) => {
                        const props = feature.properties;
                        const tooltip = `<strong>District:</strong> ${props.dist_name}<br><strong>Block:</strong> ${props.Block_Name}`;
                        layer.bindTooltip(tooltip, {
                            permanent: false,
                            direction: 'top',
                            className: 'custom-tooltip'
                        });
                    },
                    isFilter: true
                }).addTo(this.map);
                
                blockLayer.on('contextmenu', (e) => {
                    this.showContextMenu(e.originalEvent.pageX, e.originalEvent.pageY, filterLayer);
                    e.originalEvent.preventDefault();
                });
                
                hasData = true;
            }
        }
        
        document.getElementById('exportBtn').disabled = !hasData;
        document.getElementById('filterActionsBtn').disabled = !hasData;
    }

    selectAllDistricts() {
        const select = document.getElementById('districtFilter');
        Array.from(select.options).forEach(option => option.selected = true);
        this.updateFilter();
    }

    clearAllDistricts() {
        const select = document.getElementById('districtFilter');
        Array.from(select.options).forEach(option => option.selected = false);
        this.updateFilter();
    }

    selectAllHuds() {
        const select = document.getElementById('hudFilter');
        Array.from(select.options).forEach(option => option.selected = true);
        this.updateFilter();
    }

    clearAllHuds() {
        const select = document.getElementById('hudFilter');
        Array.from(select.options).forEach(option => option.selected = false);
        this.updateFilter();
    }

    showFilterStyle(type) {
        document.querySelectorAll('.layer-style-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const panel = document.getElementById('filterStylePanel');
        panel.classList.add('active');
        panel.style.top = '100px';
        panel.style.left = '340px';
    }

    hideFilterStyle() {
        document.getElementById('filterStylePanel').classList.remove('active');
    }

    updateFilterStyle(property, value) {
        if (property === 'fillColor') {
            this.filterStyle.fillColor = value;
        } else if (property === 'strokeColor') {
            this.filterStyle.strokeColor = value;
        } else if (property === 'strokeWidth') {
            this.filterStyle.strokeWidth = parseInt(value);
            document.getElementById('filterStrokeValue').textContent = value + 'px';
        } else if (property === 'opacity') {
            this.filterStyle.opacity = parseFloat(value);
            document.getElementById('filterOpacityValue').textContent = Math.round(value * 100) + '%';
        }
        
        const preview = document.getElementById('filterPreview');
        preview.style.backgroundColor = this.filterStyle.fillColor;
        preview.style.borderColor = this.filterStyle.strokeColor;
        preview.style.borderWidth = this.filterStyle.strokeWidth + 'px';
        preview.style.opacity = this.filterStyle.opacity;
        
        this.applyFilter();
    }

    showContextMenu(x, y, layer) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'contextMenu';
        menu.innerHTML = `
            <div class="context-menu-item" onclick="filterManager.zoomToLayer()">
                <span class="material-icons">zoom_in</span>
                Zoom to
            </div>
        `;
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
        
        document.body.appendChild(menu);
        window.contextLayer = layer;
    }

    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        if (menu) {
            menu.remove();
        }
    }

    zoomToLayer() {
        if (window.contextLayer) {
            this.map.fitBounds(window.contextLayer.getBounds(), {padding: [20, 20]});
        }
        this.hideContextMenu();
    }

    getFilteredData() {
        // Return combined filtered data for export
        if (!this.filteredData && this.selectedBlocks.size === 0) return null;
        
        let combinedFeatures = [];
        
        if (this.filteredData) {
            combinedFeatures = [...this.filteredData.features];
        }
        
        if (this.blocksData && this.selectedDistricts.size > 0 && this.selectedBlocks.size > 0) {
            const filteredBlocks = this.blocksData.features.filter(f => {
                const distMatch = this.selectedDistricts.has(f.properties.dist_name);
                const blockMatch = this.selectedBlocks.has(f.properties.Block_Name);
                return distMatch && blockMatch;
            });
            combinedFeatures = [...combinedFeatures, ...filteredBlocks];
        }
        
        if (combinedFeatures.length === 0) return null;
        
        return {
            type: 'FeatureCollection',
            features: combinedFeatures
        };
    }
    
    zoomToFiltered() {
        const filteredLayers = [];
        this.map.eachLayer(layer => {
            if (layer.options && layer.options.isFilter) {
                filteredLayers.push(layer);
            }
        });
        
        if (filteredLayers.length > 0) {
            const group = new L.featureGroup(filteredLayers);
            this.map.fitBounds(group.getBounds(), {padding: [20, 20]});
        }
    }
    
    cropToFiltered() {
        const filteredLayers = [];
        this.map.eachLayer(layer => {
            if (layer.options && layer.options.isFilter) {
                filteredLayers.push(layer);
            }
        });
        
        if (filteredLayers.length > 0) {
            const group = new L.featureGroup(filteredLayers);
            this.map.fitBounds(group.getBounds(), {padding: [10, 10]});
            this.map.setMaxBounds(group.getBounds());
        }
    }
    
    revertToOriginal() {
        this.map.setMaxBounds(null);
        mapManager.homeView();
    }
}