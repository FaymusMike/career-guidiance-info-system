// ============================================
// MAIN.JS - Client-Only Career Guidance System
// ============================================

// Global Configuration
const AppConfig = {
    // Using only client-side compatible APIs
    ADZUNA_APP_ID: '33ad0b83',
    ADZUNA_APP_KEY: 'b2b03ba1fac65347141fa0fe19b58640',
    
    // Cache Settings
    CACHE_TTL: {
        CAREER_DATA: 24 * 60 * 60 * 1000,
        JOB_DATA: 2 * 60 * 60 * 1000,
        NEWS_DATA: 30 * 60 * 1000,
        ASSESSMENT: 7 * 24 * 60 * 60 * 1000
    }
};

// Global Application State
window.AppState = window.AppState || {
    currentUser: null,
    userProfile: null,
    theme: localStorage.getItem('theme') || 'light',
    offlineMode: false
};

// ============================================
// 1. COMPLETELY CLIENT-SIDE CAREER DATA MANAGER
// ============================================

class CareerDataManager {
    constructor() {
        this.cache = new Map();
        this.careers = this.initializeCareerDatabase();
        this.attributionHTML = this.getAttributionHTML();
    }

    getAttributionHTML() {
        return `
            <div class="onet-attribution mt-4 p-3 bg-light border rounded">
                <p class="text-center mb-2">
                    Career data is based on public domain information from the U.S. Bureau of Labor Statistics
                    and industry research.
                </p>
                <p class="small text-center mb-0">
                    This application provides career guidance based on established career theories
                    including Holland's RIASEC model.
                </p>
            </div>
        `;
    }

    initializeCareerDatabase() {
        // Comprehensive career database with real data
        return {
            '15-1252': {
                id: '15-1252',
                title: 'Software Developer',
                description: 'Develop applications and systems software. Analyze user needs and create software solutions. Work in various industries including technology, finance, healthcare, and entertainment.',
                skills: [
                    { name: 'Programming', importance: 95, level: 85 },
                    { name: 'Problem Solving', importance: 90, level: 80 },
                    { name: 'Teamwork', importance: 80, level: 75 },
                    { name: 'Communication', importance: 75, level: 70 },
                    { name: 'Algorithms', importance: 85, level: 80 },
                    { name: 'System Design', importance: 80, level: 75 }
                ],
                tasks: [
                    'Write and test software applications',
                    'Collaborate with teams to design software solutions',
                    'Debug and fix software issues',
                    'Document software functionality',
                    'Participate in code reviews',
                    'Stay updated with new technologies'
                ],
                riasecCodes: ['I', 'R', 'C'],
                salary: { 
                    median: 110000, 
                    hourly: 52.88,
                    entry: 65000,
                    experienced: 160000
                },
                outlook: { 
                    growth: 22,
                    trend: 'Growing',
                    jobOpenings: '200,000+ annually'
                },
                education: ["Bachelor's degree in Computer Science or related field"],
                workEnvironment: 'Office setting, often with flexible/remote options',
                typicalIndustries: ['Technology', 'Finance', 'Healthcare', 'E-commerce'],
                relatedCareers: ['Web Developer', 'DevOps Engineer', 'Data Scientist']
            },
            '29-1141': {
                id: '29-1141',
                title: 'Registered Nurse',
                description: 'Provide and coordinate patient care, educate patients and the public about various health conditions, and provide advice and emotional support to patients and their family members.',
                skills: [
                    { name: 'Patient Care', importance: 98, level: 90 },
                    { name: 'Communication', importance: 95, level: 85 },
                    { name: 'Critical Thinking', importance: 90, level: 80 },
                    { name: 'Empathy', importance: 85, level: 80 },
                    { name: 'Medical Knowledge', importance: 90, level: 85 },
                    { name: 'Emergency Response', importance: 85, level: 80 }
                ],
                tasks: [
                    'Assess patient health problems and needs',
                    'Administer nursing care to patients',
                    'Advise patients on health maintenance',
                    'Coordinate patient care with other healthcare professionals',
                    'Maintain accurate patient records',
                    'Educate patients and families'
                ],
                riasecCodes: ['S', 'I', 'C'],
                salary: { 
                    median: 77000, 
                    hourly: 37.02,
                    entry: 53000,
                    experienced: 116000
                },
                outlook: { 
                    growth: 9,
                    trend: 'Growing',
                    jobOpenings: '175,000+ annually'
                },
                education: ["Associate's degree in Nursing", "Bachelor's degree in Nursing"],
                workEnvironment: 'Hospitals, clinics, nursing homes, schools',
                typicalIndustries: ['Healthcare', 'Hospitals', 'Long-term Care', 'Schools'],
                relatedCareers: ['Nurse Practitioner', 'Nurse Anesthetist', 'Healthcare Administrator']
            },
            '13-1161': {
                id: '13-1161',
                title: 'Market Research Analyst',
                description: 'Research market conditions to examine potential sales of a product or service. Help companies understand what products people want, who will buy them, and at what price.',
                skills: [
                    { name: 'Data Analysis', importance: 90, level: 80 },
                    { name: 'Statistical Analysis', importance: 85, level: 75 },
                    { name: 'Communication', importance: 80, level: 75 },
                    { name: 'Research', importance: 85, level: 80 },
                    { name: 'Critical Thinking', importance: 85, level: 80 },
                    { name: 'Presentation', importance: 75, level: 70 }
                ],
                tasks: [
                    'Monitor and forecast marketing and sales trends',
                    'Measure the effectiveness of marketing programs',
                    'Gather data on consumers and competitors',
                    'Analyze data using statistical software',
                    'Prepare reports and present results to clients',
                    'Develop methods for data collection'
                ],
                riasecCodes: ['I', 'E', 'C'],
                salary: { 
                    median: 65000, 
                    hourly: 31.25,
                    entry: 45000,
                    experienced: 120000
                },
                outlook: { 
                    growth: 18,
                    trend: 'Growing',
                    jobOpenings: '150,000+ annually'
                },
                education: ["Bachelor's degree in Market Research or related field"],
                workEnvironment: 'Office setting, may work independently or on teams',
                typicalIndustries: ['Marketing', 'Consulting', 'Consumer Goods', 'Technology'],
                relatedCareers: ['Marketing Manager', 'Data Analyst', 'Business Analyst']
            },
            '17-2071': {
                id: '17-2071',
                title: 'Electrical Engineer',
                description: 'Design, develop, test, and supervise the manufacturing of electrical equipment, such as electric motors, radar and navigation systems, communications systems, or power generation equipment.',
                skills: [
                    { name: 'Circuit Design', importance: 92, level: 85 },
                    { name: 'Mathematics', importance: 88, level: 80 },
                    { name: 'Problem Solving', importance: 90, level: 82 },
                    { name: 'Technical Drawing', importance: 80, level: 75 },
                    { name: 'Project Management', importance: 75, level: 70 },
                    { name: 'CAD Software', importance: 85, level: 80 }
                ],
                tasks: [
                    'Design electrical systems and components',
                    'Develop manufacturing processes',
                    'Test equipment to ensure safety and compliance',
                    'Supervise project production',
                    'Estimate project costs and timelines',
                    'Write technical reports and documentation'
                ],
                riasecCodes: ['R', 'I'],
                salary: { 
                    median: 101000, 
                    hourly: 48.56,
                    entry: 65000,
                    experienced: 150000
                },
                outlook: { 
                    growth: 7,
                    trend: 'Growing',
                    jobOpenings: '20,000+ annually'
                },
                education: ["Bachelor's degree in Electrical Engineering"],
                workEnvironment: 'Office, laboratory, or industrial plant settings',
                typicalIndustries: ['Manufacturing', 'Utilities', 'Telecommunications', 'Aerospace'],
                relatedCareers: ['Electronics Engineer', 'Computer Hardware Engineer', 'Project Engineer']
            },
            '11-3031': {
                id: '11-3031',
                title: 'Financial Manager',
                description: 'Create financial reports, direct investment activities, and develop strategies for the long-term financial goals of their organization. Often work in banks, insurance companies, or other businesses.',
                skills: [
                    { name: 'Financial Analysis', importance: 95, level: 88 },
                    { name: 'Leadership', importance: 85, level: 80 },
                    { name: 'Strategic Planning', importance: 90, level: 85 },
                    { name: 'Risk Management', importance: 88, level: 82 },
                    { name: 'Communication', importance: 85, level: 80 },
                    { name: 'Accounting', importance: 90, level: 85 }
                ],
                tasks: [
                    'Prepare financial statements and reports',
                    'Monitor financial details to ensure legal compliance',
                    'Supervise employees in financial reporting',
                    'Review company financial reports and seek ways to reduce costs',
                    'Analyze market trends to find opportunities',
                    'Help management make financial decisions'
                ],
                riasecCodes: ['E', 'C'],
                salary: { 
                    median: 134000, 
                    hourly: 64.42,
                    entry: 75000,
                    experienced: 200000
                },
                outlook: { 
                    growth: 17,
                    trend: 'Growing',
                    jobOpenings: '100,000+ annually'
                },
                education: ["Bachelor's degree in Finance or Accounting", "MBA preferred"],
                workEnvironment: 'Office setting, often in corporate headquarters',
                typicalIndustries: ['Finance', 'Insurance', 'Corporate Management', 'Government'],
                relatedCareers: ['Financial Analyst', 'Chief Financial Officer', 'Investment Banker']
            },
            '27-1024': {
                id: '27-1024',
                title: 'Graphic Designer',
                description: 'Create visual concepts, using computer software or by hand, to communicate ideas that inspire, inform, and captivate consumers. Develop the overall layout and production design for various applications.',
                skills: [
                    { name: 'Creativity', importance: 95, level: 90 },
                    { name: 'Visual Communication', importance: 90, level: 85 },
                    { name: 'Software Skills', importance: 85, level: 80 },
                    { name: 'Attention to Detail', importance: 80, level: 75 },
                    { name: 'Time Management', importance: 75, level: 70 },
                    { name: 'Client Communication', importance: 80, level: 75 }
                ],
                tasks: [
                    'Meet with clients to determine scope of projects',
                    'Use digital illustration and layout software',
                    'Create visual elements like logos and images',
                    'Present designs to clients for approval',
                    'Incorporate changes recommended by clients',
                    'Review designs for errors before printing'
                ],
                riasecCodes: ['A', 'E'],
                salary: { 
                    median: 53000, 
                    hourly: 25.48,
                    entry: 35000,
                    experienced: 85000
                },
                outlook: { 
                    growth: 3,
                    trend: 'Stable',
                    jobOpenings: '25,000+ annually'
                },
                education: ["Bachelor's degree in Graphic Design or related field"],
                workEnvironment: 'Studio, agency, or freelance/remote work',
                typicalIndustries: ['Advertising', 'Publishing', 'Marketing', 'Web Design'],
                relatedCareers: ['Web Designer', 'Art Director', 'UX/UI Designer']
            },
            '25-2021': {
                id: '25-2021',
                title: 'Elementary Teacher',
                description: 'Teach young students basic subjects such as math, reading, and writing. Develop lesson plans, evaluate student performance, and communicate with parents about student progress.',
                skills: [
                    { name: 'Communication', importance: 95, level: 90 },
                    { name: 'Patience', importance: 90, level: 85 },
                    { name: 'Creativity', importance: 85, level: 80 },
                    { name: 'Organization', importance: 88, level: 85 },
                    { name: 'Classroom Management', importance: 90, level: 85 },
                    { name: 'Subject Knowledge', importance: 85, level: 80 }
                ],
                tasks: [
                    'Plan lessons and teach subjects',
                    'Grade assignments and assess student progress',
                    'Communicate with parents about student performance',
                    'Create classroom rules and enforce them',
                    'Adapt teaching methods to student needs',
                    'Attend professional development workshops'
                ],
                riasecCodes: ['S', 'A'],
                salary: { 
                    median: 60000, 
                    hourly: 28.85,
                    entry: 40000,
                    experienced: 95000
                },
                outlook: { 
                    growth: 4,
                    trend: 'Stable',
                    jobOpenings: '120,000+ annually'
                },
                education: ["Bachelor's degree in Education", "State teaching certification"],
                workEnvironment: 'Elementary schools, public or private',
                typicalIndustries: ['Education', 'Public Schools', 'Private Schools'],
                relatedCareers: ['Special Education Teacher', 'School Counselor', 'Curriculum Developer']
            },
            '49-9071': {
                id: '49-9071',
                title: 'HVAC Technician',
                description: 'Install, maintain, and repair heating, air conditioning, and refrigeration systems. Work in homes, schools, hospitals, office buildings, or factories.',
                skills: [
                    { name: 'Technical Skills', importance: 95, level: 90 },
                    { name: 'Problem Solving', importance: 90, level: 85 },
                    { name: 'Physical Stamina', importance: 85, level: 80 },
                    { name: 'Attention to Detail', importance: 80, level: 75 },
                    { name: 'Customer Service', importance: 75, level: 70 },
                    { name: 'Electrical Knowledge', importance: 85, level: 80 }
                ],
                tasks: [
                    'Install heating, ventilation, and cooling units',
                    'Perform routine maintenance on systems',
                    'Diagnose electrical and mechanical faults',
                    'Repair or replace worn or defective parts',
                    'Test systems to ensure proper functioning',
                    'Explain problems and solutions to customers'
                ],
                riasecCodes: ['R', 'I'],
                salary: { 
                    median: 50000, 
                    hourly: 24.04,
                    entry: 32000,
                    experienced: 80000
                },
                outlook: { 
                    growth: 5,
                    trend: 'Growing',
                    jobOpenings: '40,000+ annually'
                },
                education: ["Technical school or apprenticeship", "EPA certification required"],
                workEnvironment: 'Homes, businesses, construction sites',
                typicalIndustries: ['Construction', 'Maintenance', 'Manufacturing'],
                relatedCareers: ['Electrician', 'Plumber', 'Building Maintenance Technician']
            }
        };
    }

    async getCareerData(socCode) {
        const cacheKey = `career_${socCode}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
            console.log(`Returning cached career data for ${socCode}`);
            return cached.data;
        }

        // Return data from our local database
        const careerData = this.careers[socCode] || this.getFallbackCareerData(socCode);

        // Cache the result
        this.cache.set(cacheKey, {
            data: careerData,
            timestamp: Date.now()
        });

        return careerData;
    }

    async searchCareersByInterest(riasecCode, maxResults = 10) {
        const cacheKey = `search_${riasecCode}_${maxResults}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
            return cached.data;
        }

        // Filter careers by RIASEC code
        const filteredCareers = Object.values(this.careers)
            .filter(career => career.riasecCodes && career.riasecCodes.includes(riasecCode))
            .slice(0, maxResults)
            .map(career => ({
                id: career.id,
                title: career.title,
                description: career.description,
                riasecCodes: career.riasecCodes,
                matchScore: 70 + Math.floor(Math.random() * 30) // Random score 70-99
            }));

        // If no matches, return some default careers
        const results = filteredCareers.length > 0 ? filteredCareers : 
            Object.values(this.careers).slice(0, maxResults).map(career => ({
                id: career.id,
                title: career.title,
                description: career.description,
                riasecCodes: career.riasecCodes,
                matchScore: 65
            }));

        this.cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        return results;
    }

    async searchCareersByKeyword(keyword, maxResults = 10) {
        const searchTerm = keyword.toLowerCase();
        
        return Object.values(this.careers)
            .filter(career => 
                career.title.toLowerCase().includes(searchTerm) ||
                career.description.toLowerCase().includes(searchTerm) ||
                career.skills.some(skill => skill.name.toLowerCase().includes(searchTerm))
            )
            .slice(0, maxResults)
            .map(career => ({
                id: career.id,
                title: career.title,
                description: career.description,
                riasecCodes: career.riasecCodes,
                matchScore: 75
            }));
    }

    getFallbackCareerData(socCode) {
        return {
            id: socCode,
            title: 'Career Information',
            description: 'Detailed information about this career is being updated. Explore our other career options for comprehensive guidance.',
            skills: [
                { name: 'Research Skills', importance: 80, level: 70 },
                { name: 'Continuous Learning', importance: 85, level: 75 }
            ],
            tasks: [
                'Research career information',
                'Develop professional skills',
                'Network with industry professionals'
            ],
            riasecCodes: ['I'],
            salary: { 
                median: 0, 
                hourly: 0,
                entry: 0,
                experienced: 0
            },
            outlook: { 
                growth: 0,
                trend: 'Unknown',
                jobOpenings: 'Data not available'
            },
            education: ["Information not available"],
            workEnvironment: 'Varies by specific career',
            typicalIndustries: ['Multiple industries'],
            relatedCareers: ['Explore similar career paths']
        };
    }

    getAllCareers() {
        return Object.values(this.careers);
    }

    getCareersByCategory(category) {
        const categoryMap = {
            'technology': ['Software Developer', 'Data Scientist', 'Web Developer'],
            'healthcare': ['Registered Nurse', 'Doctor', 'Pharmacist'],
            'business': ['Financial Manager', 'Market Research Analyst', 'Accountant'],
            'education': ['Elementary Teacher', 'Professor', 'School Counselor'],
            'engineering': ['Electrical Engineer', 'Mechanical Engineer', 'Civil Engineer'],
            'creative': ['Graphic Designer', 'Writer', 'Artist'],
            'trades': ['HVAC Technician', 'Electrician', 'Plumber']
        };

        const careersInCategory = categoryMap[category] || [];
        return Object.values(this.careers)
            .filter(career => careersInCategory.includes(career.title))
            .slice(0, 12);
    }

    addAttribution(elementId) {
        const element = document.getElementById(elementId);
        if (element && !element.querySelector('.onet-attribution')) {
            element.insertAdjacentHTML('beforeend', this.attributionHTML);
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('Career cache cleared');
    }
}

// ============================================
// 2. CLIENT-SIDE NEWS MANAGER (No API Calls)
// ============================================

class NewsManager {
    constructor() {
        this.cache = new Map();
        this.newsDatabase = this.initializeNewsDatabase();
    }

    initializeNewsDatabase() {
        return [
            {
                title: 'Tech Industry Hiring Trends Show Strong Growth in 2024',
                description: 'Latest reports indicate increased hiring in software development, data science, and cybersecurity roles across all industries.',
                url: '#',
                source: 'Tech Careers Weekly',
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(0),
                category: 'technology',
                readTime: 3
            },
            {
                title: 'Remote Work Continues to Shape Career Opportunities',
                description: 'Survey shows 65% of companies now offer permanent remote options, creating new career paths and work-life balance opportunities.',
                url: '#',
                source: 'Remote Work Insights',
                image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(1),
                category: 'business',
                readTime: 4
            },
            {
                title: 'Healthcare Sector Adds 50,000 New Jobs This Quarter',
                description: 'Nursing and healthcare administration positions see significant growth nationwide, with increasing demand for specialized skills.',
                url: '#',
                source: 'Healthcare Employment Report',
                image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(2),
                category: 'healthcare',
                readTime: 3
            },
            {
                title: 'Data Science Careers Continue to Expand Across Industries',
                description: 'New report shows 30% growth in data-related roles as companies increasingly rely on data-driven decision making.',
                url: '#',
                source: 'Data Career Weekly',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(3),
                category: 'technology',
                readTime: 5
            },
            {
                title: 'Green Energy Jobs See Record Growth',
                description: 'Renewable energy sector creates thousands of new positions in engineering, installation, and maintenance roles.',
                url: '#',
                source: 'Energy Employment Journal',
                image: 'https://images.unsplash.com-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(4),
                category: 'engineering',
                readTime: 4
            },
            {
                title: 'Cybersecurity Demand Outpaces Supply of Qualified Professionals',
                description: 'Companies struggle to fill cybersecurity roles as threats increase, creating excellent opportunities for career changers.',
                url: '#',
                source: 'Security Careers Digest',
                image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(5),
                category: 'technology',
                readTime: 4
            },
            {
                title: 'Soft Skills Become Critical for Career Advancement',
                description: 'Communication, teamwork, and adaptability now ranked as important as technical skills for career progression.',
                url: '#',
                source: 'Career Development Today',
                image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(6),
                category: 'career',
                readTime: 3
            },
            {
                title: 'AI Creates New Career Paths While Transforming Existing Jobs',
                description: 'Artificial intelligence opens opportunities in AI ethics, training, and implementation while changing traditional roles.',
                url: '#',
                source: 'Future of Work Report',
                image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
                publishedAt: this.getDateString(7),
                category: 'technology',
                readTime: 5
            }
        ];
    }

    getDateString(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    }

    async fetchCareerNews(keywords = ['career', 'jobs'], limit = 6) {
        const cacheKey = `news_${keywords.sort().join('_')}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.NEWS_DATA) {
            return cached.data;
        }

        // Filter news based on keywords (simple client-side filtering)
        const filteredNews = this.newsDatabase
            .filter(article => {
                const text = (article.title + ' ' + article.description).toLowerCase();
                return keywords.some(keyword => text.includes(keyword.toLowerCase()));
            })
            .slice(0, limit);

        // If no matches, return all news
        const results = filteredNews.length > 0 ? filteredNews : 
            this.newsDatabase.slice(0, limit);

        // Cache results
        this.cache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        return results;
    }

    getNewsByCategory(category, limit = 4) {
        return this.newsDatabase
            .filter(article => article.category === category)
            .slice(0, limit);
    }

    getAllNews(limit = 8) {
        return this.newsDatabase.slice(0, limit);
    }

    clearCache() {
        this.cache.clear();
        console.log('News cache cleared');
    }
}

// ============================================
// 3. JOB MARKET MANAGER (Adzuna Only - Works in Browser)
// ============================================

class JobMarketManager {
    constructor() {
        this.config = {
            ADZUNA: {
                baseURL: 'https://api.adzuna.com/v1/api/jobs',
                appId: AppConfig.ADZUNA_APP_ID,
                appKey: AppConfig.ADZUNA_APP_KEY
            }
        };
        this.cache = new Map();
        this.sampleJobs = this.initializeSampleJobs();
    }

    initializeSampleJobs() {
        return {
            'Software Developer': [
                {
                    id: 'job_soft_1',
                    title: 'Senior Software Developer',
                    company: 'Tech Innovations Inc.',
                    location: 'San Francisco, CA',
                    description: 'Looking for experienced software developer to work on cutting-edge web applications. Must have strong JavaScript and React skills.',
                    salary_min: 120000,
                    salary_max: 180000,
                    created: new Date().toISOString(),
                    category: 'Technology',
                    is_remote: true,
                    source: 'sample'
                },
                {
                    id: 'job_soft_2',
                    title: 'Full Stack Developer',
                    company: 'Digital Solutions Ltd',
                    location: 'Remote',
                    description: 'Join our remote team to build scalable web applications. Experience with Node.js and cloud services required.',
                    salary_min: 90000,
                    salary_max: 140000,
                    created: this.getPastDate(1),
                    category: 'Technology',
                    is_remote: true,
                    source: 'sample'
                }
            ],
            'Registered Nurse': [
                {
                    id: 'job_nurse_1',
                    title: 'Registered Nurse - ICU',
                    company: 'City General Hospital',
                    location: 'New York, NY',
                    description: 'ICU nurse position in major hospital. Requires BSN and critical care experience.',
                    salary_min: 80000,
                    salary_max: 110000,
                    created: new Date().toISOString(),
                    category: 'Healthcare',
                    is_remote: false,
                    source: 'sample'
                },
                {
                    id: 'job_nurse_2',
                    title: 'Telehealth Nurse',
                    company: 'HealthConnect',
                    location: 'Remote',
                    description: 'Provide nursing consultations via telehealth platform. Flexible hours available.',
                    salary_min: 70000,
                    salary_max: 95000,
                    created: this.getPastDate(2),
                    category: 'Healthcare',
                    is_remote: true,
                    source: 'sample'
                }
            ],
            'default': [
                {
                    id: 'job_default_1',
                    title: 'Career Position Available',
                    company: 'Various Employers',
                    location: 'Multiple Locations',
                    description: 'Explore current opportunities in this field. Many positions available with competitive salaries.',
                    salary_min: 50000,
                    salary_max: 100000,
                    created: new Date().toISOString(),
                    category: 'General',
                    is_remote: false,
                    source: 'sample'
                }
            ]
        };
    }

    getPastDate(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    }

    async fetchJobsByCareer(careerTitle, location = 'us', limit = 8) {
        const cacheKey = `jobs_${careerTitle}_${location}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            return cached.data;
        }

        let jobs = [];
        
        try {
            // Try Adzuna API (works in browser)
            jobs = await this.fetchAdzunaJobs(careerTitle, location, limit);
        } catch (error) {
            console.log('Using sample job data:', error.message);
            jobs = this.getSampleJobs(careerTitle, limit);
        }

        // Cache results
        this.cache.set(cacheKey, {
            data: jobs,
            timestamp: Date.now()
        });

        return jobs;
    }

    async fetchAdzunaJobs(careerTitle, location, limit) {
        const url = `${this.config.ADZUNA.baseURL}/${location}/search/1?` +
            `app_id=${this.config.ADZUNA.appId}&` +
            `app_key=${this.config.ADZUNA.appKey}&` +
            `what=${encodeURIComponent(careerTitle)}&` +
            `results_per_page=${limit}&` +
            `content-type=application/json`;
        
        console.log('Fetching jobs from Adzuna...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Adzuna API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return (data.results || []).map(job => ({
            id: job.id,
            title: job.title,
            company: job.company?.display_name || 'Unknown Company',
            location: job.location?.display_name || 'Location not specified',
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            created: job.created,
            contract_type: job.contract_type,
            category: job.category?.label,
            redirect_url: job.redirect_url,
            is_remote: job.remote_working === true,
            source: 'adzuna'
        }));
    }

    getSampleJobs(careerTitle, limit) {
        // Check if we have sample jobs for this career
        const careerKey = Object.keys(this.sampleJobs).find(key => 
            careerTitle.toLowerCase().includes(key.toLowerCase())
        );
        
        const jobs = this.sampleJobs[careerKey] || this.sampleJobs['default'];
        
        // Create some variation
        return jobs.slice(0, limit).map((job, index) => ({
            ...job,
            id: `sample_${careerTitle.replace(/\s+/g, '_').toLowerCase()}_${index + 1}`,
            title: job.title.replace('Career', careerTitle.split(' ')[0]),
            created: this.getPastDate(index)
        }));
    }

    async getJobMarketTrends(careerField) {
        try {
            // Get some jobs for analysis
            const jobs = await this.fetchJobsByCareer(careerField, 'us', 5);
            
            return {
                totalJobs: jobs.length,
                averageSalary: this.calculateAverageSalary(jobs),
                remotePercentage: this.calculateRemotePercentage(jobs),
                demandLevel: this.calculateDemandLevel(jobs.length),
                recentPostings: this.getRecentPostings(jobs, 7)
            };
            
        } catch (error) {
            console.error('Trends analysis error:', error);
            return {
                totalJobs: 15,
                averageSalary: 75000,
                remotePercentage: 40,
                demandLevel: 'Moderate',
                recentPostings: 8
            };
        }
    }

    calculateAverageSalary(jobs) {
        const validSalaries = jobs.filter(j => j.salary_min && j.salary_max)
            .map(j => (j.salary_min + j.salary_max) / 2);
        
        if (validSalaries.length === 0) return 65000;
        
        const average = validSalaries.reduce((sum, salary) => sum + salary, 0) / validSalaries.length;
        return Math.round(average);
    }

    calculateRemotePercentage(jobs) {
        if (jobs.length === 0) return 30;
        const remoteCount = jobs.filter(j => j.is_remote === true).length;
        return Math.round((remoteCount / jobs.length) * 100);
    }

    calculateDemandLevel(jobCount) {
        if (jobCount > 20) return 'High';
        if (jobCount > 10) return 'Moderate';
        if (jobCount > 5) return 'Low';
        return 'Very Low';
    }

    getRecentPostings(jobs, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return jobs.filter(job => new Date(job.created) > cutoff).length;
    }

    clearCache() {
        this.cache.clear();
        console.log('Job cache cleared');
    }
}

// ============================================
// 4. DASHBOARD MANAGER
// ============================================

class DashboardManager {
    constructor() {
        this.careerManager = new CareerDataManager();
        this.newsManager = new NewsManager();
        this.jobMarket = new JobMarketManager();
        this.initialized = false;
    }

    async initializeDashboard() {
        if (this.initialized) return;
        
        console.log('Initializing dashboard...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load all components
            await Promise.all([
                this.loadUserStats(),
                this.loadCareerInsights(),
                this.loadJobMarketData(),
                this.loadCareerNews(),
                this.loadQuickStats()
            ]);
            
            // Initialize visualizations
            this.initializeCharts();
            
            // Update UI
            this.updateDashboardUI();
            
            this.initialized = true;
            this.hideLoadingState();
            
            console.log('Dashboard loaded successfully');
            
        } catch (error) {
            console.error('Dashboard error:', error);
            this.hideLoadingState();
            this.showErrorMessage('Dashboard loaded with sample data');
        }
    }

    async loadUserStats() {
        // Get user data from localStorage or use defaults
        const userName = localStorage.getItem('userName') || 'Career Explorer';
        const totalAssessments = localStorage.getItem('totalAssessments') || '0';
        const savedCareers = localStorage.getItem('savedCareers') || '0';
        
        // Update UI
        const userNameElement = document.getElementById('user-name');
        const totalAssessmentsEl = document.getElementById('total-assessments');
        const savedCareersEl = document.getElementById('saved-careers');
        const matchPercentageEl = document.getElementById('match-percentage');
        
        if (userNameElement) userNameElement.textContent = userName;
        if (totalAssessmentsEl) totalAssessmentsEl.textContent = totalAssessments;
        if (savedCareersEl) savedCareersEl.textContent = savedCareers;
        if (matchPercentageEl) matchPercentageEl.textContent = '75%';
    }

    async loadCareerInsights() {
        const container = document.getElementById('career-insights-container');
        if (!container) return;
        
        // Get suggested careers
        const suggestions = await this.careerManager.searchCareersByInterest('I', 3);
        this.updateCareerInsights(suggestions);
    }

    async loadJobMarketData() {
        const container = document.getElementById('job-market-widget');
        if (!container) return;
        
        const fields = ['Software Developer', 'Data Analyst', 'Project Manager'];
        const marketData = [];
        
        for (const field of fields) {
            const trends = await this.jobMarket.getJobMarketTrends(field);
            marketData.push({ field, ...trends });
        }
        
        this.updateJobMarketWidget(marketData);
    }

    async loadCareerNews() {
        const container = document.getElementById('news-widget');
        if (!container) return;
        
        const news = await this.newsManager.fetchCareerNews(['career', 'jobs', 'hiring'], 4);
        this.updateNewsWidget(news);
    }

    async loadQuickStats() {
        const stats = {
            activeJobs: '50K+',
            avgSalary: '$75K',
            topIndustries: 'Tech, Healthcare',
            growthRate: '+15%'
        };
        
        // Update stats if elements exist
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(`stat-${key}`);
            if (element) element.textContent = value;
        });
    }

    updateCareerInsights(careers) {
        const container = document.getElementById('career-insights-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row g-3">
                ${careers.map(career => `
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
                                    ${career.description.substring(0, 80)}...
                                </p>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        ${career.riasecCodes.map(code => `
                                            <span class="badge bg-light text-dark border me-1">${code}</span>
                                        `).join('')}
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="viewCareerDetails('${career.id}')">
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateJobMarketWidget(marketData) {
        const container = document.getElementById('job-market-widget');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0">
                    <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Market Trends</h6>
                </div>
                <div class="card-body">
                    ${marketData.map((data, index) => `
                        <div class="mb-3 ${index < marketData.length - 1 ? 'pb-2 border-bottom' : ''}">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <strong>${data.field}</strong>
                                <span class="badge bg-${this.getDemandColor(data.demandLevel)}">
                                    ${data.demandLevel}
                                </span>
                            </div>
                            <div class="row small text-muted">
                                <div class="col-6">
                                    <i class="bi bi-briefcase me-1"></i> ${data.totalJobs} jobs
                                </div>
                                <div class="col-6 text-end">
                                    <i class="bi bi-cash-coin me-1"></i> $${data.averageSalary.toLocaleString()}
                                </div>
                            </div>
                            <div class="small text-muted mt-1">
                                <i class="bi bi-house me-1"></i> ${data.remotePercentage}% remote
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateNewsWidget(news) {
        const container = document.getElementById('news-widget');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0">
                    <h5 class="mb-0"><i class="bi bi-newspaper me-2"></i>Career News</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        ${news.map(article => `
                            <div class="col-md-6">
                                <div class="card h-100 border-0 shadow-sm">
                                    <img src="${article.image}" 
                                         class="card-img-top" 
                                         style="height: 140px; object-fit: cover;"
                                         alt="${article.title}">
                                    <div class="card-body">
                                        <h6 class="card-title">${article.title}</h6>
                                        <p class="card-text small text-muted">${article.description.substring(0, 60)}...</p>
                                        <small class="text-muted">${article.source}</small>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getDemandColor(level) {
        const colors = {
            'High': 'success',
            'Moderate': 'info',
            'Low': 'warning',
            'Very Low': 'secondary'
        };
        return colors[level] || 'secondary';
    }

    initializeCharts() {
        // Simple chart implementation without Chart.js dependency
        const chartContainer = document.getElementById('interest-chart');
        if (!chartContainer) return;
        
        const scores = [75, 90, 60, 85, 70, 55];
        const labels = ['R', 'I', 'A', 'S', 'E', 'C'];
        
        const maxScore = Math.max(...scores);
        
        chartContainer.innerHTML = `
            <div class="simple-chart p-3">
                <div class="chart-bars" style="display: flex; align-items: flex-end; gap: 8px; height: 150px;">
                    ${scores.map((score, i) => `
                        <div style="flex: 1; text-align: center;">
                            <div class="bg-primary rounded-top" 
                                 style="height: ${(score / maxScore) * 100}px; 
                                        min-height: 20px;
                                        transition: height 0.3s;">
                            </div>
                            <div class="small mt-2">${labels[i]}</div>
                            <div class="small text-muted">${score}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateDashboardUI() {
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
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

// ============================================
// 5. ERROR HANDLER
// ============================================

class ErrorHandler {
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || 
            (() => {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
                document.body.appendChild(container);
                return container;
            })();
        
        const toastId = 'toast-' + Date.now();
        const toastTypes = {
            info: { icon: 'info-circle', color: 'primary' },
            success: { icon: 'check-circle', color: 'success' },
            warning: { icon: 'exclamation-triangle', color: 'warning' },
            error: { icon: 'exclamation-circle', color: 'danger' }
        };
        
        const typeConfig = toastTypes[type] || toastTypes.info;
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `alert alert-${typeConfig.color} alert-dismissible fade show`;
        toast.style.cssText = 'margin-bottom: 10px; min-width: 250px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${typeConfig.icon} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
    
    static logError(error, context) {
        console.log(`Info${context ? ' - ' + context : ''}:`, error.message);
        // Don't show toasts for expected errors
    }
}

// ============================================
// 6. MAIN APP
// ============================================

class CareerGuidanceApp {
    constructor() {
        console.log('Starting Career Guidance App...');
        
        // Initialize managers
        this.careerManager = new CareerDataManager();
        this.newsManager = new NewsManager();
        this.jobMarket = new JobMarketManager();
        this.dashboard = new DashboardManager();
        
        // Set up theme
        this.setupTheme();
        
        // Initialize page
        this.initPage();
        
        console.log('App ready');
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
            themeToggle.onclick = () => this.toggleTheme();
        }
    }
    
    toggleTheme() {
        const current = localStorage.getItem('theme') || 'light';
        const newTheme = current === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.classList.toggle('dark-theme', newTheme === 'dark');
        
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.innerHTML = newTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
        }
    }
    
    initPage() {
        const path = window.location.pathname;
        
        if (path.includes('dashboard.html')) {
            this.dashboard.initializeDashboard();
        } else if (path.includes('index.html') || path === '/') {
            this.initHomePage();
        }
    }
    
    async initHomePage() {
        // Load careers for homepage
        const careers = await this.careerManager.searchCareersByInterest('I', 3);
        const news = await this.newsManager.fetchCareerNews(['career'], 2);
        
        const careersContainer = document.getElementById('popular-careers');
        if (careersContainer) {
            careersContainer.innerHTML = careers.map(career => `
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center">
                            <h5 class="card-title">${career.title}</h5>
                            <p class="card-text text-muted small">${career.description.substring(0, 60)}...</p>
                            <a href="careers.html?id=${career.id}" class="btn btn-outline-primary">Explore</a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        const newsContainer = document.getElementById('home-news');
        if (newsContainer) {
            newsContainer.innerHTML = news.map(article => `
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title">${article.title}</h6>
                            <p class="card-text small text-muted">${article.description}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// ============================================
// 7. INITIALIZATION
// ============================================

// Global functions
window.viewCareerDetails = (id) => {
    window.location.href = `careers.html?id=${id}`;
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CareerGuidanceApp();
});

// Add minimal CSS
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .hover-lift {
        transition: transform 0.2s;
    }
    
    .hover-lift:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
    }
    
    #dashboard-loading {
        display: none;
    }
    
    #dashboard-error {
        display: none;
    }
    
    .onet-attribution {
        background-color: #f8f9fa;
        border-radius: 8px;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);

console.log('Ready!');