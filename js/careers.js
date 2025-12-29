class CareersManager {
    constructor() {
        this.careers = [];
        this.filteredCareers = [];
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.currentFilters = {};
        
        this.init();
    }
    
    async init() {
        await this.loadCareers();
        this.initEventListeners();
        this.renderCareers();
        this.initMap();
    }
    
    async loadCareers() {
        try {
            const careersSnapshot = await FirebaseServices.db
                .collection('careers')
                .orderBy('title')
                .get();
            
            this.careers = careersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filteredCareers = [...this.careers];
            
            // Cache careers in localStorage
            localStorage.setItem('cached_careers', JSON.stringify(this.careers));
            localStorage.setItem('careers_cache_timestamp', Date.now().toString());
            
        } catch (error) {
            console.error('Error loading careers:', error);
            
            // Try to load from cache
            const cachedCareers = localStorage.getItem('cached_careers');
            if (cachedCareers) {
                this.careers = JSON.parse(cachedCareers);
                this.filteredCareers = [...this.careers];
            }
        }
    }
    
    initEventListeners() {
        // Search input
        const searchInput = document.getElementById('career-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.target.dataset.filter;
                const filterValue = e.target.dataset.value;
                this.handleFilter(filterType, filterValue);
            });
        });
        
        // Clear filters
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Pagination
        document.getElementById('prev-page')?.addEventListener('click', () => this.prevPage());
        document.getElementById('next-page')?.addEventListener('click', () => this.nextPage());
    }
    
    handleSearch(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredCareers = [...this.careers];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredCareers = this.careers.filter(career => 
                career.title.toLowerCase().includes(term) ||
                career.description?.toLowerCase().includes(term) ||
                career.skills?.some(skill => skill.toLowerCase().includes(term))
            );
        }
        
        this.currentPage = 1;
        this.renderCareers();
    }
    
    handleFilter(type, value) {
        if (!value) {
            delete this.currentFilters[type];
        } else {
            this.currentFilters[type] = value;
        }
        
        this.applyFilters();
    }
    
    applyFilters() {
        this.filteredCareers = this.careers.filter(career => {
            return Object.entries(this.currentFilters).every(([key, value]) => {
                if (key === 'category') {
                    return career.category === value;
                }
                if (key === 'salary') {
                    const salary = career.salaryRange?.avg || 0;
                    if (value === 'low') return salary < 40000;
                    if (value === 'medium') return salary >= 40000 && salary < 80000;
                    if (value === 'high') return salary >= 80000;
                }
                if (key === 'education') {
                    return career.educationLevel === value;
                }
                return true;
            });
        });
        
        this.currentPage = 1;
        this.renderCareers();
        this.updateActiveFilters();
    }
    
    clearFilters() {
        this.currentFilters = {};
        this.filteredCareers = [...this.careers];
        this.currentPage = 1;
        this.renderCareers();
        this.updateActiveFilters();
        
        // Clear UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    updateActiveFilters() {
        const filtersContainer = document.getElementById('active-filters');
        if (!filtersContainer) return;
        
        if (Object.keys(this.currentFilters).length === 0) {
            filtersContainer.innerHTML = '';
            return;
        }
        
        filtersContainer.innerHTML = Object.entries(this.currentFilters)
            .map(([key, value]) => `
                <span class="badge bg-primary me-2">
                    ${this.getFilterLabel(key, value)}
                    <button class="btn-close btn-close-white btn-close-sm ms-1" 
                            onclick="careersManager.removeFilter('${key}')"></button>
                </span>
            `).join('');
    }
    
    removeFilter(key) {
        delete this.currentFilters[key];
        this.applyFilters();
    }
    
    getFilterLabel(key, value) {
        const labels = {
            'category': `Category: ${value}`,
            'salary': `Salary: ${value}`,
            'education': `Education: ${value}`
        };
        return labels[key] || `${key}: ${value}`;
    }
    
    renderCareers() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const careersToShow = this.filteredCareers.slice(startIndex, endIndex);
        
        const careersContainer = document.getElementById('careers-container');
        if (!careersContainer) return;
        
        if (careersToShow.length === 0) {
            careersContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search display-1 text-muted"></i>
                    <h4 class="mt-3">No careers found</h4>
                    <p class="text-muted">Try adjusting your search or filters</p>
                    <button class="btn btn-primary" onclick="careersManager.clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }
        
        careersContainer.innerHTML = careersToShow.map(career => `
            <div class="col-md-6 col-lg-4">
                <div class="card career-card h-100 shadow-sm">
                    <div class="card-img-top bg-light text-center py-4">
                        <i class="bi bi-${this.getCareerIcon(career.category)} display-4 text-primary"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${career.title}</h5>
                        <p class="card-text text-muted small">${career.description?.substring(0, 120)}...</p>
                        
                        <div class="mb-3">
                            ${career.skills?.slice(0, 3).map(skill => `
                                <span class="badge bg-light text-dark border me-1 mb-1">${skill}</span>
                            `).join('')}
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-success">$${this.formatSalary(career.salaryRange?.avg || 0)}/yr</span>
                                <span class="badge bg-info ms-1">${career.educationLevel || 'Varies'}</span>
                            </div>
                            <a href="career-detail.html?id=${career.id}" class="btn btn-sm btn-outline-primary">
                                Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.updatePagination();
    }
    
    getCareerIcon(category) {
        const icons = {
            'Technology': 'laptop',
            'Healthcare': 'heart-pulse',
            'Business': 'graph-up',
            'Engineering': 'gear',
            'Education': 'book',
            'Arts': 'palette'
        };
        return icons[category] || 'briefcase';
    }
    
    formatSalary(salary) {
        if (salary >= 1000) {
            return (salary / 1000).toFixed(1) + 'k';
        }
        return salary.toString();
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.filteredCareers.length / this.itemsPerPage);
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
    }
    
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderCareers();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.filteredCareers.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderCareers();
        }
    }
    
    async loadCareerDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const careerId = urlParams.get('id');
        
        if (!careerId) return;
        
        try {
            const careerDoc = await FirebaseServices.db
                .collection('careers')
                .doc(careerId)
                .get();
            
            if (careerDoc.exists) {
                this.displayCareerDetail(careerDoc.data());
                this.loadRelatedInstitutions(careerDoc.data().relatedInstitutions || []);
            }
        } catch (error) {
            console.error('Error loading career detail:', error);
        }
    }
    
    displayCareerDetail(career) {
        const detailContainer = document.getElementById('career-detail');
        if (!detailContainer) return;
        
        detailContainer.innerHTML = `
            <div class="card shadow-lg">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">${career.title}</h4>
                        <span class="badge bg-light text-primary fs-6">${career.category}</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-8">
                            <h5>Description</h5>
                            <p class="mb-4">${career.description || 'No description available.'}</p>
                            
                            <h5>Required Skills</h5>
                            <div class="mb-4">
                                ${(career.skills || []).map(skill => `
                                    <span class="badge bg-primary me-2 mb-2 p-2">${skill}</span>
                                `).join('')}
                            </div>
                            
                            <h5>Education Requirements</h5>
                            <p>${career.educationRequirements || 'Varies by position'}</p>
                            
                            <h5>Career Pathway</h5>
                            <ul class="list-group list-group-flush mb-4">
                                ${(career.careerPathway || []).map(step => `
                                    <li class="list-group-item">
                                        <i class="bi bi-check-circle text-success me-2"></i>
                                        ${step}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <div class="col-lg-4">
                            <div class="card bg-light">
                                <div class="card-body">
                                    <h6>Quick Facts</h6>
                                    
                                    <div class="mb-3">
                                        <strong>Salary Range:</strong><br>
                                        <span class="text-success">
                                            $${career.salaryRange?.min?.toLocaleString() || 'N/A'} - 
                                            $${career.salaryRange?.max?.toLocaleString() || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <strong>Average Salary:</strong><br>
                                        <span class="fs-5 text-primary">
                                            $${career.salaryRange?.avg?.toLocaleString() || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <strong>Education Level:</strong><br>
                                        ${career.educationLevel || 'Varies'}
                                    </div>
                                    
                                    <div class="mb-3">
                                        <strong>Job Outlook:</strong><br>
                                        <span class="badge bg-${this.getOutlookColor(career.jobOutlook)}">
                                            ${career.jobOutlook || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <strong>RIASEC Codes:</strong><br>
                                        ${(career.riasecCodes || []).map(code => `
                                            <span class="badge bg-info me-1">${code}</span>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="d-grid gap-2 mt-4">
                                        <button class="btn btn-primary" onclick="saveCareerInterest('${career.id}')">
                                            <i class="bi bi-bookmark"></i> Save Career
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="shareCareer('${career.id}')">
                                            <i class="bi bi-share"></i> Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <h6>Related Institutions</h6>
                                <div id="institutions-list" class="list-group">
                                    <!-- Institutions will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-12">
                            <h5>Institutions Map</h5>
                            <div id="institutions-map" style="height: 400px; width: 100%;" class="rounded border"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getOutlookColor(outlook) {
        const colors = {
            'Growing': 'success',
            'Stable': 'warning',
            'Declining': 'danger'
        };
        return colors[outlook] || 'secondary';
    }
    
    async loadRelatedInstitutions(institutionIds) {
        if (!institutionIds.length) return;
        
        try {
            const institutionsSnapshot = await FirebaseServices.db
                .collection('institutions')
                .where('id', 'in', institutionIds.slice(0, 10)) // Limit to 10
                .get();
            
            const institutionsList = document.getElementById('institutions-list');
            if (institutionsList) {
                institutionsList.innerHTML = institutionsSnapshot.docs.map(doc => {
                    const inst = doc.data();
                    return `
                        <a href="${inst.website || '#'}" target="_blank" class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">${inst.name}</h6>
                                <small>${inst.type || 'Institution'}</small>
                            </div>
                            <p class="mb-1 small">${inst.location || 'Location not specified'}</p>
                            <small class="text-muted">${inst.programs ? inst.programs.length + ' programs' : ''}</small>
                        </a>
                    `;
                }).join('');
            }
            
            // Update map with institution locations
            this.updateInstitutionsMap(institutionsSnapshot.docs.map(doc => doc.data()));
            
        } catch (error) {
            console.error('Error loading institutions:', error);
        }
    }
    
    initMap() {
        const mapElement = document.getElementById('institutions-map');
        if (!mapElement) return;
        
        // Initialize Leaflet map
        this.map = L.map(mapElement).setView([20, 0], 2);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
    }
    
    updateInstitutionsMap(institutions) {
        if (!this.map || !institutions.length) return;
        
        // Clear existing markers
        if (this.markers) {
            this.markers.forEach(marker => marker.remove());
        }
        
        this.markers = [];
        const bounds = [];
        
        institutions.forEach(inst => {
            if (inst.latitude && inst.longitude) {
                const marker = L.marker([inst.latitude, inst.longitude])
                    .addTo(this.map)
                    .bindPopup(`
                        <strong>${inst.name}</strong><br>
                        ${inst.location || ''}<br>
                        ${inst.type || 'Institution'}
                    `);
                
                this.markers.push(marker);
                bounds.push([inst.latitude, inst.longitude]);
            }
        });
        
        // Fit map to show all markers
        if (bounds.length > 0) {
            this.map.fitBounds(bounds);
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize careers manager when DOM is loaded
let careersManager;
document.addEventListener('DOMContentLoaded', () => {
    careersManager = new CareersManager();
    
    // Load career detail if on detail page
    if (window.location.pathname.includes('career-detail.html')) {
        careersManager.loadCareerDetail();
    }
});