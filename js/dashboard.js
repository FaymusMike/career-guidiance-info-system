// ============================================
// DASHBOARD.JS - Complete Dashboard Functionality
// ============================================

class DashboardPageManager {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
        this.interestChart = null;
        this.categoryChart = null;
        this.config = {
            ADZUNA_APP_ID: '33ad0b83',
            ADZUNA_APP_KEY: 'b2b03ba1fac65347141fa0fe19b58640'
        };
    }

    async initializeDashboard() {
        console.log('Initializing dashboard...');
        
        try {
            this.showLoadingState();
            
            // Load all dashboard components
            await Promise.all([
                this.loadUserStats(),
                this.loadCareerInsights(),
                this.loadJobMarketData(),
                this.loadCareerNews(),
                this.loadSavedCareers(),
                this.loadAssessmentHistory(),
                this.loadInterestProfile(),
                this.loadRecentAssessmentsSection(),
                this.loadRecommendedCareersSection(),
                this.loadCategoryDistribution()
            ]);
            
            this.initialized = true;
            this.hideLoadingState();
            
            console.log('Dashboard ready');
            
        } catch (error) {
            console.error('Dashboard error:', error);
            this.hideLoadingState();
            this.showErrorMessage('Loading dashboard with sample data');
        }
    }

    async loadUserStats() {
        const userName = localStorage.getItem('userName') || 'Career Explorer';
        const totalAssessments = localStorage.getItem('totalAssessments') || '0';
        const savedCareers = localStorage.getItem('savedCareersCount') || '0';
        
        const userNameEl = document.getElementById('user-name');
        const totalAssessmentsEl = document.getElementById('total-assessments');
        const savedCareersEl = document.getElementById('saved-careers');
        const matchPercentageEl = document.getElementById('match-percentage');
        
        if (userNameEl) userNameEl.textContent = userName;
        if (totalAssessmentsEl) totalAssessmentsEl.textContent = totalAssessments;
        if (savedCareersEl) savedCareersEl.textContent = savedCareers;
        
        // Get latest assessment match percentage
        const latestResult = JSON.parse(localStorage.getItem('latestResult'));
        if (latestResult && latestResult.scores) {
            const avgScore = Math.round(Object.values(latestResult.scores).reduce((a, b) => a + b, 0) / 6);
            if (matchPercentageEl) matchPercentageEl.textContent = `${avgScore}%`;
        } else if (matchPercentageEl) {
            matchPercentageEl.textContent = '75%';
        }
    }

    async loadCareerInsights() {
        const container = document.getElementById('career-insights-container');
        if (!container) return;

        // Get recommendations based on latest assessment or default
        const latestResult = JSON.parse(localStorage.getItem('latestResult'));
        let recommendations = [];
        
        if (latestResult && latestResult.recommendations) {
            recommendations = latestResult.recommendations.slice(0, 3);
        } else {
            // Default recommendations if no assessment
            recommendations = [
                {
                    title: 'Software Developer',
                    description: 'Create innovative software solutions for modern problems.',
                    matchScore: 85,
                    riasec: ['I', 'R', 'C'],
                    id: 'tech-001'
                },
                {
                    title: 'Data Scientist',
                    description: 'Analyze complex data to drive business decisions.',
                    matchScore: 78,
                    riasec: ['I', 'C', 'R'],
                    id: 'tech-002'
                },
                {
                    title: 'UX/UI Designer',
                    description: 'Design beautiful and functional user experiences.',
                    matchScore: 72,
                    riasec: ['A', 'I', 'R'],
                    id: 'creative-001'
                }
            ];
        }

        container.innerHTML = `
            <div class="row g-3">
                ${recommendations.map(career => `
                    <div class="col-md-4">
                        <div class="card h-100 border-0 shadow-sm hover-lift">
                            <div class="card-body">
                                <h6 class="card-title">${career.title}</h6>
                                <div class="mb-2">
                                    <small class="text-muted">Match: ${career.matchScore}%</small>
                                    <div class="progress" style="height: 4px;">
                                        <div class="progress-bar bg-success" style="width: ${career.matchScore}%"></div>
                                    </div>
                                </div>
                                <p class="card-text small text-muted line-clamp-2">
                                    ${career.description}
                                </p>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        ${career.riasec.map(code => `
                                            <span class="badge bg-light text-dark border me-1">${code}</span>
                                        `).join('')}
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="window.viewCareer('${career.title}')">
                                        Details <i class="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadJobMarketData() {
        const container = document.getElementById('job-market-widget');
        if (!container) return;

        // Fetch from Adzuna API for real data
        const marketData = await this.fetchMarketData();
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Live Market Trends</h6>
                    <span class="badge bg-success">Live Data</span>
                </div>
                <div class="card-body">
                    ${marketData.map((data, index) => `
                        <div class="mb-3 ${index < marketData.length - 1 ? 'pb-2 border-bottom' : ''}">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong>${data.field}</strong>
                                <span class="badge bg-${data.demandColor}">
                                    ${data.demandLevel}
                                </span>
                            </div>
                            <div class="row small">
                                <div class="col-6">
                                    <i class="bi bi-briefcase text-muted me-1"></i> 
                                    <span class="fw-bold">${data.totalJobs}+</span> jobs
                                </div>
                                <div class="col-6 text-end">
                                    <i class="bi bi-cash-coin text-muted me-1"></i>
                                    <span class="fw-bold">$${data.avgSalary.toLocaleString()}</span>
                                </div>
                            </div>
                            <div class="small text-muted mt-1">
                                <i class="bi bi-building me-1"></i>
                                ${data.topCompanies.map(c => c.company).join(', ')}
                            </div>
                        </div>
                    `).join('')}
                    <div class="mt-3 small text-muted">
                        <i class="bi bi-clock me-1"></i>Updated: ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;
    }

    async fetchMarketData() {
        const fields = ['Software Developer', 'Data Scientist', 'Marketing Manager'];
        const marketData = [];
        
        for (const field of fields) {
            try {
                // Fetch from Adzuna API
                const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?` +
                    `app_id=${this.config.ADZUNA_APP_ID}&` +
                    `app_key=${this.config.ADZUNA_APP_KEY}&` +
                    `what=${encodeURIComponent(field)}&` +
                    `results_per_page=10`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                const jobs = data.results || [];
                const avgSalary = jobs.length > 0 
                    ? jobs.filter(j => j.salary_min).reduce((sum, j) => sum + (j.salary_min + j.salary_max) / 2, 0) / jobs.length
                    : 85000;
                
                marketData.push({
                    field,
                    totalJobs: data.count || 50,
                    avgSalary: Math.round(avgSalary),
                    demandLevel: this.getDemandLevel(data.count || 50),
                    demandColor: this.getDemandColor(this.getDemandLevel(data.count || 50)),
                    topCompanies: this.extractTopCompanies(jobs)
                });
            } catch (error) {
                // Fallback data if API fails
                marketData.push({
                    field,
                    totalJobs: 75,
                    avgSalary: 85000,
                    demandLevel: 'High',
                    demandColor: 'success',
                    topCompanies: [
                        { company: 'Tech Corp' },
                        { company: 'Innovate Inc' }
                    ]
                });
            }
        }
        
        return marketData;
    }

    getDemandLevel(count) {
        if (count > 500) return 'Very High';
        if (count > 200) return 'High';
        if (count > 50) return 'Moderate';
        return 'Low';
    }

    getDemandColor(level) {
        const colors = {
            'Very High': 'success',
            'High': 'primary',
            'Moderate': 'info',
            'Low': 'warning'
        };
        return colors[level] || 'secondary';
    }

    extractTopCompanies(jobs) {
        const companies = jobs
            .filter(j => j.company && j.company.display_name)
            .map(j => ({ company: j.company.display_name }));
        
        return companies.slice(0, 2);
    }

    async loadCareerNews() {
        const container = document.getElementById('news-widget');
        if (!container) return;

        // Get real news from NewsAPI
        const news = await this.fetchRealNews();
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="bi bi-newspaper me-2"></i>Latest Career News</h5>
                    <span class="badge bg-success">Live</span>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        ${news.map(article => `
                            <div class="col-md-6">
                                <div class="card h-100 border-0 shadow-sm hover-lift">
                                    <img src="${article.image}" 
                                         class="card-img-top" 
                                         style="height: 140px; object-fit: cover;"
                                         alt="${article.title}">
                                    <div class="card-body">
                                        <h6 class="card-title">${article.title}</h6>
                                        <p class="card-text small text-muted">${article.description}</p>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">${article.source}</small>
                                            <a href="${article.url}" target="_blank" 
                                               class="btn btn-sm btn-outline-primary">
                                                Read <i class="bi bi-box-arrow-up-right"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    async fetchRealNews() {
        try {
            if (!window.AppConfig || !AppConfig.GNEWS_API_KEY) {
                return this.getFallbackNews();
            }
            
            // Try to get real news from GNews API
            const url = `https://gnews.io/api/v4/search?q=career%20OR%20jobs%20OR%20employment&lang=en&max=4&apikey=${AppConfig.GNEWS_API_KEY}`;
            
            // Use CORS proxy
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.articles && data.articles.length > 0) {
                return data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    source: article.source.name,
                    image: article.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
                    publishedAt: article.publishedAt
                }));
            }
        } catch (error) {
            console.log('Using sample news');
        }
        
        // Fallback news
        return this.getFallbackNews();
    }

    getFallbackNews() {
        return [
            {
                title: 'Tech Hiring Surges in Q2 2024',
                description: 'Software development roles see 25% increase in job postings.',
                url: '#',
                source: 'Tech Careers',
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop'
            },
            {
                title: 'Remote Work Now Standard for Tech Roles',
                description: '70% of tech companies now offer permanent remote options.',
                url: '#',
                source: 'Remote Work',
                image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=400&fit=crop'
            },
            {
                title: 'Healthcare Hiring at Record Pace',
                description: 'Nursing and healthcare admin roles see unprecedented growth.',
                url: '#',
                source: 'Health Jobs',
                image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop'
            },
            {
                title: 'AI Creates New Career Opportunities',
                description: 'Machine learning and AI roles grow 35% year over year.',
                url: '#',
                source: 'AI Weekly',
                image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
            }
        ];
    }

    async loadSavedCareers() {
        const container = document.getElementById('saved-careers-widget');
        if (!container) return;

        const savedIds = JSON.parse(localStorage.getItem('savedCareers') || '[]');
        const savedCareers = CareerDatabase.filter(c => savedIds.includes(c.id)).slice(0, 3);
        
        if (savedCareers.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0"><i class="bi bi-bookmark-check me-2"></i>Saved Careers</h6>
                    </div>
                    <div class="card-body">
                        ${savedCareers.map(career => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <strong>${career.title}</strong>
                                    <br><small class="text-muted">${career.category}</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="window.viewCareer('${career.title}')">
                                    View
                                </button>
                            </div>
                        `).join('')}
                        ${savedIds.length > 3 ? `
                            <div class="text-center mt-2">
                                <small class="text-muted">+${savedIds.length - 3} more saved</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    async loadAssessmentHistory() {
        const container = document.getElementById('assessment-history-widget');
        if (!container) return;

        const history = JSON.parse(localStorage.getItem('assessmentHistory') || '[]').slice(0, 3);
        
        if (history.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Assessments</h6>
                    </div>
                    <div class="card-body">
                        ${history.map(assessment => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <strong>${new Date(assessment.completedAt).toLocaleDateString()}</strong>
                                    <br><small class="text-muted">RIASEC Assessment</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="window.viewAssessment('${assessment.id}')">
                                    View
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    getLatestScores() {
        const latestResult = JSON.parse(localStorage.getItem('latestResult') || 'null');
        return latestResult?.scores || {
            R: 60,
            I: 75,
            A: 55,
            S: 70,
            E: 68,
            C: 62
        };
    }

    async loadInterestProfile() {
        const chartCanvas = document.getElementById('interest-chart');
        if (!chartCanvas || typeof Chart === 'undefined') return;

        const scores = this.getLatestScores();
        const labels = ['R', 'I', 'A', 'S', 'E', 'C'];
        const values = labels.map(label => Number(scores[label] || 0));

        if (this.interestChart) {
            this.interestChart.destroy();
        }

        this.interestChart = new Chart(chartCanvas, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'RIASEC Scores',
                    data: values,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: '#0d6efd',
                    borderWidth: 2,
                    pointBackgroundColor: '#0d6efd'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { stepSize: 20 }
                    }
                }
            }
        });
    }

    async loadRecentAssessmentsSection() {
        const container = document.getElementById('recent-assessments');
        if (!container) return;

        const history = JSON.parse(localStorage.getItem('assessmentHistory') || '[]');
        const latestResult = JSON.parse(localStorage.getItem('latestResult') || 'null');

        const assessments = [...history];
        if (latestResult?.completedAt) {
            assessments.unshift({ id: 'latest', ...latestResult });
        }

        const topThree = assessments.slice(0, 3);
        if (topThree.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted mb-0">No assessments yet. Take one to see results here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = topThree.map((assessment, index) => {
            const date = assessment.completedAt ? new Date(assessment.completedAt) : new Date();
            return `
                <div class="col-12">
                    <div class="border rounded p-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">Assessment ${index + 1}</h6>
                            <small class="text-muted">${date.toLocaleDateString()}</small>
                        </div>
                        <a href="assessment.html" class="btn btn-sm btn-outline-primary">View</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadRecommendedCareersSection() {
        const container = document.getElementById('recommended-careers');
        if (!container) return;

        const latestResult = JSON.parse(localStorage.getItem('latestResult') || 'null');
        const recommendations = latestResult?.recommendations?.slice(0, 3) || [
            { title: 'Software Developer', matchScore: 85, category: 'Technology' },
            { title: 'Data Analyst', matchScore: 78, category: 'Business' },
            { title: 'UX Designer', matchScore: 72, category: 'Creative' }
        ];

        container.innerHTML = recommendations.map(career => `
            <div class="col-12">
                <div class="border rounded p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">${career.title}</h6>
                        <span class="badge bg-success">${career.matchScore || 70}%</span>
                    </div>
                    <small class="text-muted">${career.category || 'General'}</small>
                </div>
            </div>
        `).join('');
    }

    async loadCategoryDistribution() {
        const chartCanvas = document.getElementById('category-chart');
        if (!chartCanvas || typeof Chart === 'undefined') return;

        const latestResult = JSON.parse(localStorage.getItem('latestResult') || 'null');
        const recommendations = latestResult?.recommendations || [];

        const categories = recommendations.reduce((acc, item) => {
            const category = item.category || 'Other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        if (Object.keys(categories).length === 0) {
            categories.Technology = 2;
            categories.Business = 1;
            categories.Creative = 1;
        }

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#0d6efd', '#20c997', '#ffc107', '#dc3545', '#6f42c1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    showLoadingState() {
        const loading = document.getElementById('dashboard-loading');
        if (loading) loading.style.display = 'block';
    }

    hideLoadingState() {
        const loading = document.getElementById('dashboard-loading');
        if (loading) loading.style.display = 'none';
    }

    showErrorMessage(message) {
        const error = document.getElementById('dashboard-error');
        if (error) {
            error.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show">
                    <i class="bi bi-info-circle me-2"></i>${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            error.style.display = 'block';
        }
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html')) {
        window.dashboard = new DashboardPageManager();
        window.dashboard.initializeDashboard();
    }
});