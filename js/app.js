class CareerGuidanceApp {
    constructor() {
        this.initComponents();
        this.loadDashboardData();
        this.initEventListeners();
    }
    
    initComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                toggleTheme();
                themeToggle.innerHTML = AppState.theme === 'light' ? 
                    '<i class="bi bi-moon"></i>' : 
                    '<i class="bi bi-sun"></i>';
            });
        }
    }
    
    async loadDashboardData() {
        if (!AppState.currentUser) return;
        
        try {
            // Load user's recent assessments
            const assessmentsSnapshot = await FirebaseServices.db
                .collection('results')
                .where('userId', '==', AppState.currentUser.uid)
                .orderBy('completedAt', 'desc')
                .limit(5)
                .get();
            
            const recentAssessments = assessmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Load recommended careers
            const recommendedCareers = await this.getRecommendedCareers();
            
            // Update dashboard UI
            this.updateDashboardUI(recentAssessments, recommendedCareers);
            
            // Initialize charts
            this.initDashboardCharts();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    async getRecommendedCareers() {
        try {
            // For now, return top careers based on general popularity
            // In production, this would use the user's assessment results
            const careersSnapshot = await FirebaseServices.db
                .collection('careers')
                .limit(6)
                .get();
            
            return careersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error loading careers:', error);
            return [];
        }
    }
    
    updateDashboardUI(assessments, careers) {
        // Update recent assessments
        const assessmentsContainer = document.getElementById('recent-assessments');
        if (assessmentsContainer) {
            if (assessments.length > 0) {
                assessmentsContainer.innerHTML = assessments.map(assessment => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h6 class="card-title">${assessment.assessmentType || 'Career Assessment'}</h6>
                                <p class="card-text text-muted small">
                                    Completed: ${this.formatDate(assessment.completedAt?.toDate())}
                                </p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-primary">Score: ${assessment.totalScore || 'N/A'}</span>
                                    <a href="assessment.html?result=${assessment.id}" class="btn btn-sm btn-outline-primary">
                                        View Details
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                assessmentsContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-clipboard-check display-1 text-muted"></i>
                        <h5 class="mt-3">No assessments completed yet</h5>
                        <p class="text-muted">Take your first career assessment to get personalized recommendations</p>
                        <a href="assessment.html" class="btn btn-primary">Start Assessment</a>
                    </div>
                `;
            }
        }
        
        // Update recommended careers
        const careersContainer = document.getElementById('recommended-careers');
        if (careersContainer) {
            careersContainer.innerHTML = careers.map(career => `
                <div class="col-md-6 col-lg-4">
                    <div class="card career-card h-100">
                        <div class="card-img-top bg-light text-center py-4">
                            <i class="bi bi-briefcase display-4 text-primary"></i>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${career.title}</h5>
                            <p class="card-text text-muted small">${career.description?.substring(0, 100)}...</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-success">${career.category || 'General'}</span>
                                <a href="careers.html?id=${career.id}" class="btn btn-sm btn-outline-primary">
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    initDashboardCharts() {
        // Interest Radar Chart
        const interestCtx = document.getElementById('interest-chart');
        if (interestCtx) {
            new Chart(interestCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
                    datasets: [{
                        label: 'Your Interests',
                        data: [65, 59, 90, 81, 56, 55],
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Career Category Bar Chart
        const categoryCtx = document.getElementById('category-chart');
        if (categoryCtx) {
            new Chart(categoryCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Technology', 'Healthcare', 'Business', 'Arts', 'Engineering', 'Education'],
                    datasets: [{
                        label: 'Career Matches',
                        data: [12, 19, 8, 15, 10, 7],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
    
    initEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-careers');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch, 300));
        }
        
        // Filter careers
        const filterButtons = document.querySelectorAll('.career-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterCareers(e));
        });
    }
    
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        // Implement search logic here
        console.log('Searching for:', searchTerm);
    }
    
    handleFilterCareers(event) {
        const filter = event.target.dataset.filter;
        // Implement filter logic here
        console.log('Filtering by:', filter);
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
    
    formatDate(date) {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CareerGuidanceApp();
});