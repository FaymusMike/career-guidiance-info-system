// ============================================
// CAREERS.JS - Complete Careers Page Functionality
// ============================================

// Career Database (Enhanced with more careers)
const CareerDatabase = [
    // Technology
    {
        id: 'tech-001',
        title: 'Software Developer',
        category: 'Technology',
        riasec: ['I', 'R', 'C'],
        salary: '₦110,000',
        growth: '22%',
        description: 'Design, develop, and maintain software applications and systems.',
        longDescription: 'Software developers create the applications that run on computers, mobile devices, and the web. They analyze user needs, design software solutions, write code, test programs, and fix bugs. This role requires strong problem-solving skills and knowledge of programming languages like Java, Python, or JavaScript.',
        skills: ['Programming', 'Problem Solving', 'Analytical Thinking', 'Attention to Detail', 'Teamwork'],
        education: "Bachelor's degree in Computer Science or related field",
        outlook: 'Excellent - 22% growth expected through 2030',
        companies: ['Google', 'Microsoft', 'Amazon', 'Apple', 'Startups'],
        tags: ['coding', 'software', 'tech', 'developer']
    },
    {
        id: 'tech-002',
        title: 'Data Scientist',
        category: 'Technology',
        riasec: ['I', 'C', 'R'],
        salary: '₦120,000',
        growth: '31%',
        description: 'Analyze complex data to help organizations make better decisions.',
        longDescription: 'Data scientists use advanced analytics, machine learning, and statistical methods to extract insights from data. They work with large datasets, build predictive models, and communicate findings to stakeholders. This role combines mathematics, programming, and business acumen.',
        skills: ['Statistics', 'Machine Learning', 'Python/R', 'Data Visualization', 'Communication'],
        education: "Master's degree in Data Science or related field",
        outlook: 'Very High - 31% growth projected',
        companies: ['Facebook', 'Netflix', 'Uber', 'Airbnb', 'Consulting Firms'],
        tags: ['data', 'analytics', 'AI', 'machine learning']
    },
    {
        id: 'tech-003',
        title: 'Cybersecurity Analyst',
        category: 'Technology',
        riasec: ['I', 'R', 'C'],
        salary: '₦103,000',
        growth: '33%',
        description: 'Protect organizations from cyber threats and security breaches.',
        longDescription: 'Cybersecurity analysts monitor networks for security breaches, investigate incidents, and implement security measures. They conduct vulnerability testing, analyze security risks, and develop security policies. This role is critical as cyber threats continue to grow.',
        skills: ['Network Security', 'Risk Assessment', 'Ethical Hacking', 'Incident Response', 'Compliance'],
        education: "Bachelor's degree in Cybersecurity or Computer Science",
        outlook: 'Very High - 33% growth expected',
        companies: ['Security Firms', 'Banks', 'Government', 'Tech Companies'],
        tags: ['security', 'cyber', 'protection', 'IT']
    },
    
    // Healthcare
    {
        id: 'health-001',
        title: 'Registered Nurse',
        category: 'Healthcare',
        riasec: ['S', 'I', 'C'],
        salary: '₦77,000',
        growth: '9%',
        description: 'Provide and coordinate patient care, educate patients about health conditions.',
        longDescription: 'Registered nurses (RNs) provide and coordinate patient care, educate patients and the public about various health conditions, and provide advice and emotional support to patients and their families. They work in hospitals, clinics, nursing homes, and other healthcare settings.',
        skills: ['Patient Care', 'Communication', 'Critical Thinking', 'Empathy', 'Medical Knowledge'],
        education: "Associate's or Bachelor's degree in Nursing",
        outlook: 'Good - 9% growth expected',
        companies: ['Hospitals', 'Clinics', 'Nursing Homes', 'Home Health Services'],
        tags: ['healthcare', 'nursing', 'patient care', 'medical']
    },
    {
        id: 'health-002',
        title: 'Physician Assistant',
        category: 'Healthcare',
        riasec: ['S', 'I', 'R'],
        salary: '₦115,000',
        growth: '31%',
        description: 'Practice medicine under physician supervision, diagnose and treat patients.',
        longDescription: 'Physician assistants examine patients, diagnose injuries and illnesses, and provide treatment. They work under the supervision of physicians but have significant autonomy. This role offers a great balance of medical practice with good work-life balance.',
        skills: ['Diagnosis', 'Patient Care', 'Medical Knowledge', 'Communication', 'Problem Solving'],
        education: "Master's degree from PA program",
        outlook: 'Very High - 31% growth projected',
        companies: ['Hospitals', 'Clinics', 'Surgical Centers', 'Private Practices'],
        tags: ['medical', 'healthcare', 'clinical', 'provider']
    },
    
    // Business
    {
        id: 'biz-001',
        title: 'Marketing Manager',
        category: 'Business',
        riasec: ['E', 'A', 'S'],
        salary: '₦135,000',
        growth: '10%',
        description: 'Plan and execute marketing campaigns to promote products and services.',
        longDescription: 'Marketing managers develop marketing strategies, manage campaigns, analyze market trends, and oversee marketing staff. They work to increase brand awareness, generate leads, and drive sales through various channels including digital, social media, and traditional advertising.',
        skills: ['Strategic Planning', 'Digital Marketing', 'Analytics', 'Leadership', 'Creativity'],
        education: "Bachelor's degree in Marketing or Business",
        outlook: 'Good - 10% growth expected',
        companies: ['Agencies', 'Corporations', 'Tech Companies', 'Retail'],
        tags: ['marketing', 'business', 'advertising', 'branding']
    },
    {
        id: 'biz-002',
        title: 'Financial Analyst',
        category: 'Business',
        riasec: ['C', 'I', 'E'],
        salary: '₦83,000',
        growth: '9%',
        description: 'Analyze financial data to help businesses make investment decisions.',
        longDescription: 'Financial analysts evaluate investment opportunities, analyze financial data, and prepare reports for companies and individuals. They study economic trends, evaluate stocks and bonds, and recommend investment strategies. This role requires strong analytical and mathematical skills.',
        skills: ['Financial Modeling', 'Data Analysis', 'Excel', 'Valuation', 'Research'],
        education: "Bachelor's degree in Finance or Economics",
        outlook: 'Good - 9% growth expected',
        companies: ['Investment Banks', 'Asset Management', 'Corporations', 'Consulting'],
        tags: ['finance', 'investing', 'analysis', 'money']
    },
    
    // Creative
    {
        id: 'creative-001',
        title: 'UX/UI Designer',
        category: 'Creative',
        riasec: ['A', 'I', 'R'],
        salary: '₦95,000',
        growth: '13%',
        description: 'Design user experiences and interfaces for digital products.',
        longDescription: 'UX/UI designers create intuitive, engaging experiences for websites and applications. They conduct user research, create wireframes and prototypes, and design visual interfaces that are both beautiful and functional. This role combines creativity with user psychology.',
        skills: ['User Research', 'Wireframing', 'Prototyping', 'Visual Design', 'Usability Testing'],
        education: "Bachelor's degree in Design or related field",
        outlook: 'High - 13% growth expected',
        companies: ['Tech Companies', 'Agencies', 'Startups', 'E-commerce'],
        tags: ['design', 'UX', 'UI', 'creative', 'digital']
    },
    {
        id: 'creative-002',
        title: 'Content Creator',
        category: 'Creative',
        riasec: ['A', 'E', 'S'],
        salary: '₦60,000',
        growth: '8%',
        description: 'Create engaging content for digital platforms and social media.',
        longDescription: 'Content creators produce written, visual, and video content for websites, social media, and marketing campaigns. They develop content strategies, engage with audiences, and build personal or brand presence online. This role requires creativity and understanding of digital trends.',
        skills: ['Writing', 'Video Production', 'Social Media', 'SEO', 'Photography'],
        education: "Bachelor's degree or equivalent experience",
        outlook: 'Good - 8% growth expected',
        companies: ['Media Companies', 'Brands', 'Agencies', 'Self-employed'],
        tags: ['content', 'social media', 'video', 'blogging']
    },
    
    // Trades
    {
        id: 'trades-001',
        title: 'Electrician',
        category: 'Trades',
        riasec: ['R', 'C', 'I'],
        salary: '₦60,000',
        growth: '9%',
        description: 'Install and maintain electrical systems in buildings and structures.',
        longDescription: 'Electricians install, maintain, and repair electrical wiring, equipment, and fixtures. They read blueprints, follow building codes, and troubleshoot electrical problems. This skilled trade offers job security and the opportunity to work independently.',
        skills: ['Electrical Systems', 'Blueprint Reading', 'Troubleshooting', 'Safety Practices', 'Manual Dexterity'],
        education: "Apprenticeship and technical training",
        outlook: 'Good - 9% growth expected',
        companies: ['Construction', 'Maintenance', 'Self-employed', 'Industrial'],
        tags: ['electrical', 'construction', 'trades', 'skilled']
    },
    {
        id: 'trades-002',
        title: 'HVAC Technician',
        category: 'Trades',
        riasec: ['R', 'C', 'I'],
        salary: '₦50,000',
        growth: '5%',
        description: 'Install and repair heating, ventilation, and air conditioning systems.',
        longDescription: 'HVAC technicians install, maintain, and repair heating, cooling, and refrigeration systems. They work in homes, businesses, and industrial settings. This role requires technical knowledge, problem-solving skills, and physical stamina.',
        skills: ['HVAC Systems', 'Refrigeration', 'Electrical', 'Troubleshooting', 'Customer Service'],
        education: "Technical school or apprenticeship",
        outlook: 'Stable - 5% growth expected',
        companies: ['HVAC Companies', 'Construction', 'Facilities Management', 'Self-employed'],
        tags: ['HVAC', 'heating', 'cooling', 'trades']
    }
];

// Initialize careers page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('careers.html')) {
        initializeCareersPage();
    }
});

function initializeCareersPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    const category = urlParams.get('category');
    
    if (searchQuery) {
        searchCareers(searchQuery);
    } else if (category) {
        filterByCategory(category);
    } else {
        displayAllCareers();
    }
    
    // Set up search input
    const searchInput = document.getElementById('career-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if (query.length > 2) {
                searchCareers(query);
            } else if (query.length === 0) {
                displayAllCareers();
            }
        });
    }
}

function displayAllCareers() {
    const container = document.getElementById('careers-container');
    if (!container) return;
    
    // Group by category
    const categories = {};
    CareerDatabase.forEach(career => {
        if (!categories[career.category]) {
            categories[career.category] = [];
        }
        categories[career.category].push(career);
    });
    
    let html = `
        <div class="mb-4">
            <h1 class="mb-3">Explore Careers</h1>
            <p class="lead text-muted">Browse through our comprehensive database of career paths</p>
        </div>
        
        <!-- Category Tabs -->
        <ul class="nav nav-tabs mb-4" id="careerTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="all-tab" data-bs-toggle="tab" data-bs-target="#all" 
                        type="button" role="tab">All Careers</button>
            </li>
            ${Object.keys(categories).map(category => `
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="${category}-tab" data-bs-toggle="tab" 
                            data-bs-target="#${category}" type="button" role="tab">${category}</button>
                </li>
            `).join('')}
        </ul>
        
        <!-- Tab Content -->
        <div class="tab-content" id="careerTabsContent">
            <!-- All Careers Tab -->
            <div class="tab-pane fade show active" id="all" role="tabpanel">
                <div class="row g-4">
                    ${CareerDatabase.map(career => createCareerCard(career)).join('')}
                </div>
            </div>
            
            <!-- Category Tabs -->
            ${Object.entries(categories).map(([category, careers]) => `
                <div class="tab-pane fade" id="${category}" role="tabpanel">
                    <div class="row g-4">
                        ${careers.map(career => createCareerCard(career)).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

function createCareerCard(career) {
    return `
        <div class="col-md-6 col-lg-4">
            <div class="career-card h-100 border-0 shadow-sm p-3" onclick="showCareerDetails('${career.id}')">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5 class="mb-0">${career.title}</h5>
                    <span class="badge bg-primary">${career.category}</span>
                </div>
                <p class="text-muted small mb-3">${career.description}</p>
                <div class="mb-3">
                    ${career.skills.slice(0, 3).map(skill => `
                        <span class="badge bg-light text-dark border me-1 mb-1">${skill}</span>
                    `).join('')}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-success bg-opacity-10 text-success me-1">💰 ${career.salary}</span>
                        <span class="badge bg-info bg-opacity-10 text-info">📈 ${career.growth}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); showCareerDetails('${career.id}')">
                        View Details <i class="bi bi-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function searchCareers(query) {
    const searchTerm = query.toLowerCase();
    const results = CareerDatabase.filter(career => 
        career.title.toLowerCase().includes(searchTerm) ||
        career.description.toLowerCase().includes(searchTerm) ||
        career.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
        career.tags.some(tag => tag.includes(searchTerm))
    );
    
    displaySearchResults(query, results);
}

function displaySearchResults(query, results) {
    const container = document.getElementById('careers-container');
    if (!container) return;
    
    if (results.length > 0) {
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-3">Search Results for "${query}"</h1>
                <p class="text-muted">Found ${results.length} careers matching your search</p>
            </div>
            <div class="row g-4">
                ${results.map(career => createCareerCard(career)).join('')}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search display-1 text-muted opacity-50"></i>
                <h3 class="mt-4">No Results Found</h3>
                <p class="text-muted">We couldn't find any careers matching "${query}"</p>
                <p class="small text-muted">Try different keywords or browse all careers</p>
                <button class="btn btn-primary mt-3" onclick="displayAllCareers()">
                    <i class="bi bi-grid me-2"></i>View All Careers
                </button>
            </div>
        `;
    }
}

function filterByCategory(category) {
    const results = CareerDatabase.filter(c => c.category === category);
    
    const container = document.getElementById('careers-container');
    if (container) {
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-3">${category} Careers</h1>
                <p class="text-muted">Explore ${results.length} careers in ${category}</p>
            </div>
            <div class="row g-4">
                ${results.map(career => createCareerCard(career)).join('')}
            </div>
        `;
    }
}

function showCareerDetails(careerId) {
    const career = CareerDatabase.find(c => c.id === careerId);
    if (!career) return;
    
    const modal = new bootstrap.Modal(document.getElementById('careerModal'));
    
    document.getElementById('careerModalLabel').textContent = career.title;
    document.getElementById('careerModalBody').innerHTML = `
        <div class="career-details">
            <div class="mb-4">
                <span class="badge bg-primary mb-3">${career.category}</span>
                <p class="lead">${career.longDescription || career.description}</p>
            </div>
            
            <div class="row g-4 mb-4">
                <div class="col-md-4">
                    <div class="stat-box p-3 bg-light rounded text-center">
                        <i class="bi bi-cash-coin display-6 text-success mb-2"></i>
                        <h5>Median Salary</h5>
                        <p class="h4">${career.salary}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box p-3 bg-light rounded text-center">
                        <i class="bi bi-graph-up display-6 text-primary mb-2"></i>
                        <h5>Growth Rate</h5>
                        <p class="h4">${career.growth}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-box p-3 bg-light rounded text-center">
                        <i class="bi bi-mortarboard display-6 text-info mb-2"></i>
                        <h5>Education</h5>
                        <p class="small mt-2">${career.education}</p>
                    </div>
                </div>
            </div>
            
            <h5 class="mb-3">Key Skills</h5>
            <div class="mb-4">
                ${career.skills.map(skill => `
                    <span class="badge bg-primary bg-opacity-10 text-primary p-2 me-2 mb-2">${skill}</span>
                `).join('')}
            </div>
            
            <h5 class="mb-3">Job Outlook</h5>
            <p>${career.outlook}</p>
            
            <h5 class="mb-3">Top Employers</h5>
            <div class="mb-4">
                ${career.companies.map(company => `
                    <span class="badge bg-light text-dark border p-2 me-2 mb-2">${company}</span>
                `).join('')}
            </div>
            
            <div class="d-flex gap-3 mt-4">
                <a href="jobs.html?career=${encodeURIComponent(career.title)}" class="btn btn-primary">
                    <i class="bi bi-briefcase me-2"></i>View Jobs
                </a>
                <button class="btn btn-outline-primary" onclick="saveCareer('${career.id}')">
                    <i class="bi bi-bookmark me-2"></i>Save Career
                </button>
            </div>
        </div>
    `;
    
    modal.show();
}

function saveCareer(careerId) {
    const career = CareerDatabase.find(c => c.id === careerId);
    if (!career) return;
    
    const saved = JSON.parse(localStorage.getItem('savedCareers') || '[]');
    if (!saved.includes(careerId)) {
        saved.push(careerId);
        localStorage.setItem('savedCareers', JSON.stringify(saved));
        localStorage.setItem('savedCareersCount', saved.length.toString());
        alert(`${career.title} saved to your profile!`);
    } else {
        alert('This career is already saved');
    }
}

// Make functions globally available
window.displayAllCareers = displayAllCareers;
window.showCareerDetails = showCareerDetails;
window.saveCareer = saveCareer;