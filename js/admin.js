class AdminManager {
    constructor() {
        if (!AppState.isAdmin) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        this.init();
    }
    
    async init() {
        this.initTabs();
        await this.loadDashboardStats();
        await this.loadCareersForManagement();
        await this.loadUsers();
        this.initEventListeners();
    }
    
    initTabs() {
        const triggerTabList = [].slice.call(document.querySelectorAll('button[data-bs-toggle="tab"]'));
        triggerTabList.forEach(triggerEl => {
            const tabTrigger = new bootstrap.Tab(triggerEl);
            
            triggerEl.addEventListener('click', event => {
                event.preventDefault();
                tabTrigger.show();
                
                // Load content based on active tab
                const tabId = triggerEl.getAttribute('data-bs-target');
                this.loadTabContent(tabId);
            });
        });
    }
    
    async loadDashboardStats() {
        try {
            // Get total users
            const usersSnapshot = await FirebaseServices.db.collection('users').get();
            const totalUsers = usersSnapshot.size;
            
            // Get total careers
            const careersSnapshot = await FirebaseServices.db.collection('careers').get();
            const totalCareers = careersSnapshot.size;
            
            // Get total assessments
            const assessmentsSnapshot = await FirebaseServices.db.collection('results').get();
            const totalAssessments = assessmentsSnapshot.size;
            
            // Get recent activity
            const recentActivity = await this.getRecentActivity();
            
            // Update dashboard UI
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-careers').textContent = totalCareers;
            document.getElementById('total-assessments').textContent = totalAssessments;
            document.getElementById('recent-activity').innerHTML = recentActivity;
            
            // Load analytics chart
            this.loadAnalyticsChart();
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
    
    async getRecentActivity() {
        try {
            const activities = [];
            
            // Get recent user signups
            const recentUsers = await FirebaseServices.db
                .collection('users')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
            
            recentUsers.forEach(doc => {
                const user = doc.data();
                activities.push(`
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">New User Registered</h6>
                            <small class="text-muted">${this.formatTimeAgo(user.createdAt)}</small>
                        </div>
                        <p class="mb-1">${user.name || user.email}</p>
                    </div>
                `);
            });
            
            // Get recent assessments
            const recentAssessments = await FirebaseServices.db
                .collection('results')
                .orderBy('completedAt', 'desc')
                .limit(5)
                .get();
            
            recentAssessments.forEach(doc => {
                const assessment = doc.data();
                activities.push(`
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">Assessment Completed</h6>
                            <small class="text-muted">${this.formatTimeAgo(assessment.completedAt)}</small>
                        </div>
                        <p class="mb-1">Score: ${assessment.totalScore || 'N/A'}</p>
                    </div>
                `);
            });
            
            return activities.join('');
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            return '<div class="alert alert-warning">Unable to load recent activity</div>';
        }
    }
    
    loadAnalyticsChart() {
        const ctx = document.getElementById('analytics-chart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'User Registrations',
                    data: [12, 19, 8, 15, 10, 7, 14],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4
                }, {
                    label: 'Assessments Taken',
                    data: [8, 15, 12, 10, 18, 9, 13],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    async loadCareersForManagement() {
        try {
            const careersSnapshot = await FirebaseServices.db
                .collection('careers')
                .orderBy('title')
                .get();
            
            const careersTable = document.getElementById('careers-table-body');
            if (!careersTable) return;
            
            careersTable.innerHTML = careersSnapshot.docs.map(doc => {
                const career = doc.data();
                return `
                    <tr>
                        <td>${career.title}</td>
                        <td>${career.category || 'N/A'}</td>
                        <td>$${career.salaryRange?.avg?.toLocaleString() || 'N/A'}</td>
                        <td>${career.educationLevel || 'N/A'}</td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="adminManager.editCareer('${doc.id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="adminManager.deleteCareer('${doc.id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading careers:', error);
        }
    }
    
    async loadUsers() {
        try {
            const usersSnapshot = await FirebaseServices.db
                .collection('users')
                .orderBy('createdAt', 'desc')
                .get();
            
            const usersTable = document.getElementById('users-table-body');
            if (!usersTable) return;
            
            usersTable.innerHTML = usersSnapshot.docs.map(doc => {
                const user = doc.data();
                return `
                    <tr>
                        <td>${user.name || 'N/A'}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                                ${user.role || 'user'}
                            </span>
                        </td>
                        <td>${this.formatDate(user.createdAt?.toDate())}</td>
                        <td>${user.assessmentHistory?.length || 0}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="adminManager.viewUser('${doc.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    initEventListeners() {
        // Add career form
        const addCareerForm = document.getElementById('add-career-form');
        if (addCareerForm) {
            addCareerForm.addEventListener('submit', (e) => this.handleAddCareer(e));
        }
        
        // Import careers button
        const importBtn = document.getElementById('import-careers-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importFromOnetAPI());
        }
        
        // Search functionality
        const searchInput = document.getElementById('admin-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleAdminSearch(e.target.value);
            }, 300));
        }
    }
    
    async handleAddCareer(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const careerData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            skills: formData.get('skills').split(',').map(s => s.trim()).filter(s => s),
            educationLevel: formData.get('educationLevel'),
            educationRequirements: formData.get('educationRequirements'),
            salaryRange: {
                min: parseInt(formData.get('salaryMin')) || 0,
                max: parseInt(formData.get('salaryMax')) || 0,
                avg: Math.round((parseInt(formData.get('salaryMin')) + parseInt(formData.get('salaryMax'))) / 2)
            },
            jobOutlook: formData.get('jobOutlook'),
            riasecCodes: formData.get('riasecCodes').split(',').map(c => c.trim().toUpperCase()).filter(c => c),
            careerPathway: formData.get('careerPathway').split('\n').map(s => s.trim()).filter(s => s),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await FirebaseServices.db.collection('careers').add(careerData);
            
            // Show success message
            this.showAlert('Career added successfully!', 'success');
            
            // Reset form
            e.target.reset();
            
            // Reload careers table
            await this.loadCareersForManagement();
            
        } catch (error) {
            console.error('Error adding career:', error);
            this.showAlert('Error adding career: ' + error.message, 'error');
        }
    }
    
    async importFromOnetAPI() {
        try {
            // This is a placeholder for O*NET API integration
            // In production, you would make actual API calls to O*NET Web Services
            
            const sampleCareers = [
                {
                    title: "Software Developer",
                    description: "Develop applications and systems software.",
                    category: "Technology",
                    skills: ["Programming", "Problem Solving", "Teamwork"],
                    educationLevel: "Bachelor's Degree",
                    salaryRange: { min: 60000, max: 120000, avg: 90000 },
                    jobOutlook: "Growing",
                    riasecCodes: ["I", "R", "C"]
                }
                // Add more sample careers
            ];
            
            for (const career of sampleCareers) {
                await FirebaseServices.db.collection('careers').add({
                    ...career,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            this.showAlert('Sample careers imported successfully!', 'success');
            await this.loadCareersForManagement();
            
        } catch (error) {
            console.error('Error importing careers:', error);
            this.showAlert('Error importing careers: ' + error.message, 'error');
        }
    }
    
    async editCareer(careerId) {
        try {
            const careerDoc = await FirebaseServices.db.collection('careers').doc(careerId).get();
            if (careerDoc.exists) {
                // Open modal with career data for editing
                this.openEditModal(careerId, careerDoc.data());
            }
        } catch (error) {
            console.error('Error loading career for edit:', error);
            this.showAlert('Error loading career data', 'error');
        }
    }
    
    openEditModal(careerId, careerData) {
        // Create and show modal for editing
        const modalHTML = `
            <div class="modal fade" id="editCareerModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Career: ${careerData.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-career-form">
                                <input type="hidden" name="careerId" value="${careerId}">
                                
                                <div class="mb-3">
                                    <label class="form-label">Title</label>
                                    <input type="text" class="form-control" name="title" value="${careerData.title}" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3" required>${careerData.description || ''}</textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Category</label>
                                            <select class="form-select" name="category" required>
                                                <option value="Technology" ${careerData.category === 'Technology' ? 'selected' : ''}>Technology</option>
                                                <option value="Healthcare" ${careerData.category === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                                                <option value="Business" ${careerData.category === 'Business' ? 'selected' : ''}>Business</option>
                                                <option value="Engineering" ${careerData.category === 'Engineering' ? 'selected' : ''}>Engineering</option>
                                                <option value="Education" ${careerData.category === 'Education' ? 'selected' : ''}>Education</option>
                                                <option value="Arts" ${careerData.category === 'Arts' ? 'selected' : ''}>Arts</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Job Outlook</label>
                                            <select class="form-select" name="jobOutlook">
                                                <option value="Growing" ${careerData.jobOutlook === 'Growing' ? 'selected' : ''}>Growing</option>
                                                <option value="Stable" ${careerData.jobOutlook === 'Stable' ? 'selected' : ''}>Stable</option>
                                                <option value="Declining" ${careerData.jobOutlook === 'Declining' ? 'selected' : ''}>Declining</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="text-end">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('editCareerModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editCareerModal'));
        modal.show();
        
        // Add submit handler
        document.getElementById('edit-career-form').addEventListener('submit', (e) => this.handleEditCareer(e));
    }
    
    async handleEditCareer(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const careerId = formData.get('careerId');
        const updates = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            jobOutlook: formData.get('jobOutlook'),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await FirebaseServices.db.collection('careers').doc(careerId).update(updates);
            
            this.showAlert('Career updated successfully!', 'success');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editCareerModal'));
            modal.hide();
            
            // Reload careers table
            await this.loadCareersForManagement();
            
        } catch (error) {
            console.error('Error updating career:', error);
            this.showAlert('Error updating career: ' + error.message, 'error');
        }
    }
    
    async deleteCareer(careerId) {
        if (!confirm('Are you sure you want to delete this career?')) return;
        
        try {
            await FirebaseServices.db.collection('careers').doc(careerId).delete();
            this.showAlert('Career deleted successfully!', 'success');
            await this.loadCareersForManagement();
        } catch (error) {
            console.error('Error deleting career:', error);
            this.showAlert('Error deleting career: ' + error.message, 'error');
        }
    }
    
    async viewUser(userId) {
        try {
            const userDoc = await FirebaseServices.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const user = userDoc.data();
                
                // Open modal with user details
                this.openUserModal(user);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            this.showAlert('Error loading user data', 'error');
        }
    }
    
    openUserModal(user) {
        const modalHTML = `
            <div class="modal fade" id="userModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <dl class="row">
                                <dt class="col-sm-4">Name:</dt>
                                <dd class="col-sm-8">${user.name || 'Not provided'}</dd>
                                
                                <dt class="col-sm-4">Email:</dt>
                                <dd class="col-sm-8">${user.email}</dd>
                                
                                <dt class="col-sm-4">Role:</dt>
                                <dd class="col-sm-8">
                                    <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                                        ${user.role || 'user'}
                                    </span>
                                </dd>
                                
                                <dt class="col-sm-4">Member Since:</dt>
                                <dd class="col-sm-8">${this.formatDate(user.createdAt?.toDate())}</dd>
                                
                                <dt class="col-sm-4">Assessments:</dt>
                                <dd class="col-sm-8">${user.assessmentHistory?.length || 0} completed</dd>
                                
                                ${user.academicBackground ? `
                                    <dt class="col-sm-4">Academic Background:</dt>
                                    <dd class="col-sm-8">${user.academicBackground}</dd>
                                ` : ''}
                                
                                ${user.careerInterests?.length ? `
                                    <dt class="col-sm-4">Career Interests:</dt>
                                    <dd class="col-sm-8">
                                        ${user.careerInterests.map(interest => `
                                            <span class="badge bg-info me-1">${interest}</span>
                                        `).join('')}
                                    </dd>
                                ` : ''}
                            </dl>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('userModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
    }
    
    handleAdminSearch(searchTerm) {
        const tables = document.querySelectorAll('.admin-table tbody');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
            });
        });
    }
    
    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.admin-container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        return Math.floor(seconds / 86400) + ' days ago';
    }
    
    formatDate(date) {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    loadTabContent(tabId) {
        // Load content based on tab
        switch (tabId) {
            case '#dashboard-tab':
                this.loadDashboardStats();
                break;
            case '#careers-tab':
                this.loadCareersForManagement();
                break;
            case '#users-tab':
                this.loadUsers();
                break;
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

// Initialize admin manager when DOM is loaded
let adminManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-dashboard')) {
        adminManager = new AdminManager();
    }
});