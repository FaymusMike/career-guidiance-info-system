// ============================================
// MAIN.JS - Fixed Career Guidance System
// ============================================

// Global Configuration
const AppConfig = {
    // Note: For production, use environment variables or Netlify environment variables
    // API Keys for free tier services
    ONET_API_KEY: '', // Leave empty - we'll use client-side approach
    NEWS_API_KEY: 'cff14927ed9a417ca2c89f3cbe3c0269', // NewsAPI
    GNEWS_API_KEY: '5a01429d28b5c10f5eb820ecfd75d67e', // GNews
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
// 1. FIXED O*NET API MANAGER (CORS-Fixed Version)
// ============================================

class OnetAPIManager {
    constructor() {
        // Using CORS proxy for O*NET API
        this.baseURL = 'https://corsproxy.io/?url=https://services.onetcenter.org/ws/';
        this.cache = new Map();
        this.attributionHTML = this.getAttributionHTML();
    }

    getAttributionHTML() {
        return `
            <div class="onet-attribution mt-4 p-3 bg-light border rounded">
                <p class="text-center mb-2">
                    <a href="https://services.onetcenter.org/" 
                       title="This site incorporates information from O*NET Web Services. Click to learn more."
                       target="_blank">
                        <img src="https://www.onetcenter.org/image/link/onet-in-it.svg" 
                             style="width: 130px; height: 60px; border: none" 
                             alt="O*NET in-it">
                    </a>
                </p>
                <p class="small text-center mb-0">
                    This site incorporates information from 
                    <a href="https://services.onetcenter.org/" target="_blank">O*NET Web Services</a> 
                    by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). 
                    O*NET® is a trademark of USDOL/ETA.
                </p>
            </div>
        `;
    }

    async getCareerData(socCode) {
        const cacheKey = `career_${socCode}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
            console.log(`Returning cached career data for ${socCode}`);
            return cached.data;
        }

        try {
            // Using CORS proxy to avoid CORS issues
            const url = `${this.baseURL}online/occupations/${socCode}/summary?format=json`;
            
            console.log('Fetching O*NET data via CORS proxy...');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`O*NET API returned ${response.status}, using fallback data`);
                return this.getFallbackCareerData(socCode);
            }

            const data = await response.json();
            const careerData = this.transformCareerData(data, socCode);

            // Cache the result
            this.cache.set(cacheKey, {
                data: careerData,
                timestamp: Date.now()
            });

            return careerData;

        } catch (error) {
            console.error('O*NET API Error (using fallback):', error.message);
            return this.getFallbackCareerData(socCode);
        }
    }

    transformCareerData(data, socCode) {
        const occupation = data.occupation || {};
        
        return {
            id: socCode,
            title: occupation.title || 'Unknown Occupation',
            description: occupation.description || '',
            tasks: occupation.tasks?.map(t => t.task) || [],
            skills: occupation.skills?.map(s => ({
                name: s.name,
                importance: s.importance,
                level: s.level
            })) || [],
            interests: occupation.interests?.map(i => ({
                name: i.name,
                code: i.code,
                score: i.score
            })) || [],
            salary: {
                median: occupation.wages?.national_median || 0,
                hourly: occupation.wages?.median_hourly || 0
            },
            outlook: {
                growth: occupation.job_outlook?.growth_rate || 0,
                trend: occupation.job_outlook?.trend || 'Stable'
            },
            education: occupation.education?.map(e => e.level) || [],
            riasecCodes: occupation.interests?.map(i => i.code) || []
        };
    }

    async searchCareersByInterest(riasecCode, maxResults = 10) {
        try {
            const cacheKey = `search_${riasecCode}_${maxResults}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
                return cached.data;
            }

            const url = `${this.baseURL}mnm/interestexplorer/careers?format=json&interest=${riasecCode}&max=${maxResults}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return this.getFallbackSearchResults(riasecCode, maxResults);
            }

            const data = await response.json();
            const careers = data.careers || [];

            this.cache.set(cacheKey, {
                data: careers,
                timestamp: Date.now()
            });

            return careers;

        } catch (error) {
            console.error('Career search error:', error);
            return this.getFallbackSearchResults(riasecCode, maxResults);
        }
    }

    getFallbackCareerData(socCode) {
        // Comprehensive fallback career data
        const fallbackCareers = {
            '15-1252': {
                title: 'Software Developer',
                description: 'Develop applications and systems software. Analyze user needs and create software solutions.',
                skills: [
                    { name: 'Programming', importance: 95, level: 85 },
                    { name: 'Problem Solving', importance: 90, level: 80 },
                    { name: 'Teamwork', importance: 80, level: 75 },
                    { name: 'Communication', importance: 75, level: 70 }
                ],
                tasks: [
                    'Write and test software applications',
                    'Collaborate with teams to design software solutions',
                    'Debug and fix software issues',
                    'Document software functionality'
                ],
                riasecCodes: ['I', 'R', 'C'],
                salary: { 
                    median: 110000, 
                    hourly: 52.88,
                    annual: 110000
                },
                outlook: { 
                    growth: 22, 
                    trend: 'Growing'
                },
                education: ["Bachelor's degree"]
            },
            '29-1141': {
                title: 'Registered Nurse',
                description: 'Provide and coordinate patient care, educate patients and the public about various health conditions.',
                skills: [
                    { name: 'Patient Care', importance: 98, level: 90 },
                    { name: 'Communication', importance: 95, level: 85 },
                    { name: 'Critical Thinking', importance: 90, level: 80 },
                    { name: 'Empathy', importance: 85, level: 80 }
                ],
                tasks: [
                    'Assess patient health problems and needs',
                    'Administer nursing care to patients',
                    'Advise patients on health maintenance',
                    'Coordinate patient care with other healthcare professionals'
                ],
                riasecCodes: ['S', 'I', 'C'],
                salary: { 
                    median: 77000, 
                    hourly: 37.02
                },
                outlook: { 
                    growth: 9, 
                    trend: 'Growing'
                },
                education: ["Associate's degree", "Bachelor's degree"]
            },
            '13-1161': {
                title: 'Market Research Analyst',
                description: 'Research market conditions to examine potential sales of a product or service.',
                skills: [
                    { name: 'Data Analysis', importance: 90, level: 80 },
                    { name: 'Statistical Analysis', importance: 85, level: 75 },
                    { name: 'Communication', importance: 80, level: 75 },
                    { name: 'Research', importance: 85, level: 80 }
                ],
                riasecCodes: ['I', 'E', 'C'],
                salary: { median: 65000, hourly: 31.25 },
                outlook: { growth: 18, trend: 'Growing' },
                education: ["Bachelor's degree"]
            },
            '17-2071': {
                title: 'Electrical Engineer',
                description: 'Design, develop, test, and supervise the manufacturing of electrical equipment.',
                skills: [
                    { name: 'Circuit Design', importance: 92, level: 85 },
                    { name: 'Mathematics', importance: 88, level: 80 },
                    { name: 'Problem Solving', importance: 90, level: 82 },
                    { name: 'Technical Drawing', importance: 80, level: 75 }
                ],
                riasecCodes: ['R', 'I'],
                salary: { median: 101000, hourly: 48.56 },
                outlook: { growth: 7, trend: 'Growing' },
                education: ["Bachelor's degree"]
            },
            '11-3031': {
                title: 'Financial Manager',
                description: 'Create financial reports, direct investment activities, and develop strategies for long-term financial goals.',
                skills: [
                    { name: 'Financial Analysis', importance: 95, level: 88 },
                    { name: 'Leadership', importance: 85, level: 80 },
                    { name: 'Strategic Planning', importance: 90, level: 85 },
                    { name: 'Risk Management', importance: 88, level: 82 }
                ],
                riasecCodes: ['E', 'C'],
                salary: { median: 134000, hourly: 64.42 },
                outlook: { growth: 17, trend: 'Growing' },
                education: ["Bachelor's degree", "MBA"]
            }
        };

        return fallbackCareers[socCode] || {
            title: 'Career Information',
            description: 'Career data is currently unavailable. Please try again later.',
            skills: [],
            tasks: [],
            riasecCodes: [],
            salary: { median: 0, hourly: 0 },
            outlook: { growth: 0, trend: 'Unknown' },
            education: []
        };
    }

    getFallbackSearchResults(riasecCode, maxResults) {
        const interestCareers = {
            'I': [
                { id: '15-1252', title: 'Software Developer', description: 'Develop software applications and systems' },
                { id: '19-1029', title: 'Biological Scientist', description: 'Study living organisms and their relationships' },
                { id: '17-2031', title: 'Biomedical Engineer', description: 'Apply engineering principles to medicine' },
                { id: '19-1023', title: 'Zoologist', description: 'Study animals and their behavior' },
                { id: '15-1221', title: 'Data Scientist', description: 'Analyze and interpret complex data' }
            ],
            'R': [
                { id: '17-2071', title: 'Electrical Engineer', description: 'Design electrical systems and equipment' },
                { id: '49-9041', title: 'Industrial Mechanic', description: 'Maintain and repair industrial machinery' },
                { id: '47-2031', title: 'Carpenter', description: 'Construct and repair building frameworks' },
                { id: '49-3022', title: 'Automotive Technician', description: 'Repair and maintain vehicles' },
                { id: '53-7032', title: 'Excavating Operator', description: 'Operate heavy construction equipment' }
            ],
            'A': [
                { id: '27-1011', title: 'Art Director', description: 'Determine the visual style of publications' },
                { id: '27-1024', title: 'Graphic Designer', description: 'Create visual concepts using software' },
                { id: '27-2041', title: 'Music Director', description: 'Lead musical performances and groups' },
                { id: '27-3023', title: 'News Reporter', description: 'Investigate and report news stories' },
                { id: '27-3031', title: 'Public Relations Specialist', description: 'Manage public image for organizations' }
            ],
            'S': [
                { id: '29-1141', title: 'Registered Nurse', description: 'Provide and coordinate patient care' },
                { id: '21-1012', title: 'Educational Counselor', description: 'Advise students on educational issues' },
                { id: '21-1014', title: 'Mental Health Counselor', description: 'Help clients with mental health issues' },
                { id: '25-2021', title: 'Elementary Teacher', description: 'Teach elementary school students' },
                { id: '21-1022', title: 'Healthcare Social Worker', description: 'Help patients navigate healthcare system' }
            ],
            'E': [
                { id: '11-3031', title: 'Financial Manager', description: 'Oversee financial operations of organizations' },
                { id: '11-2022', title: 'Sales Manager', description: 'Direct sales teams and strategies' },
                { id: '11-9199', title: 'Management Analyst', description: 'Analyze business operations' },
                { id: '41-1011', title: 'Insurance Sales Agent', description: 'Sell insurance policies to clients' },
                { id: '41-3031', title: 'Securities Trader', description: 'Buy and sell securities for clients' }
            ],
            'C': [
                { id: '13-1161', title: 'Market Research Analyst', description: 'Research market conditions' },
                { id: '43-3031', title: 'Bookkeeper', description: 'Record financial transactions' },
                { id: '43-3051', title: 'Payroll Clerk', description: 'Process employee compensation' },
                { id: '43-4051', title: 'Customer Service Representative', description: 'Handle customer inquiries' },
                { id: '43-6011', title: 'Executive Secretary', description: 'Provide administrative support' }
            ]
        };

        const careers = interestCareers[riasecCode] || interestCareers['I'];
        return careers.slice(0, maxResults).map((career, index) => ({
            ...career,
            matchScore: 70 - (index * 5)
        }));
    }

    addAttribution(elementId) {
        const element = document.getElementById(elementId);
        if (element && !element.querySelector('.onet-attribution')) {
            element.insertAdjacentHTML('beforeend', this.attributionHTML);
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('O*NET cache cleared');
    }
}

// ============================================
// 2. FIXED NEWS API INTEGRATION
// ============================================

class NewsIntegrationManager {
    constructor() {
        // Using HTTPS endpoints only
        this.newsSources = {
            NEWSAPI: {
                baseURL: 'https://newsapi.org/v2',
                apiKey: AppConfig.NEWS_API_KEY,
                version: 'v2'  // Correct version
            },
            GNEWS: {
                baseURL: 'https://gnews.io/api/v4',
                apiKey: AppConfig.GNEWS_API_KEY,
                version: 'v4'
            }
        };
        this.cache = new Map();
    }

    async fetchCareerNews(keywords = ['career', 'jobs'], limit = 6) {
        const cacheKey = `news_${keywords.sort().join('_')}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.NEWS_DATA) {
            console.log('Returning cached news');
            return cached.data;
        }

        let articles = [];
        
        try {
            // Try GNews first (better CORS support)
            const gnewsArticles = await this.fetchFromGNews(keywords, limit);
            if (gnewsArticles && gnewsArticles.length > 0) {
                articles = gnewsArticles;
            }
        } catch (error) {
            console.warn('GNews failed, trying NewsAPI:', error);
            
            try {
                // Fallback to NewsAPI
                const newsapiArticles = await this.fetchFromNewsAPI(keywords, limit);
                if (newsapiArticles && newsapiArticles.length > 0) {
                    articles = newsapiArticles;
                }
            } catch (newsapiError) {
                console.warn('NewsAPI also failed:', newsapiError);
            }
        }

        // If no articles from APIs, use sample data
        if (articles.length === 0) {
            console.log('Using sample news data');
            articles = this.getSampleCareerNews();
        }

        const finalArticles = articles.slice(0, limit);
        
        // Cache results
        this.cache.set(cacheKey, {
            data: finalArticles,
            timestamp: Date.now()
        });

        return finalArticles;
    }

    async fetchFromNewsAPI(keywords, limit) {
        // IMPORTANT: NewsAPI v2 requires the API key in the URL, not headers
        const query = this.buildSimpleQuery(keywords);
        const url = `https://newsapi.org/v2/everything?` +
            `q=${encodeURIComponent(query)}&` +
            `pageSize=${limit}&` +
            `apiKey=${AppConfig.NEWS_API_KEY}`;

        console.log('Fetching from NewsAPI:', url.substring(0, 100) + '...');
        
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 426) {
                throw new Error('NewsAPI requires upgrade. Please check your plan.');
            }
            throw new Error(`NewsAPI error: ${response.status}`);
        }

        const data = await response.json();
        
        return (data.articles || []).map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source?.name || 'Unknown Source',
            image: article.urlToImage || this.getDefaultImage(),
            publishedAt: article.publishedAt,
            category: this.extractCategory(article),
            relevance: 0.8
        })).filter(article => 
            article.title && 
            article.description && 
            !article.title.includes('[Removed]')
        );
    }

    async fetchFromGNews(keywords, limit) {
        // GNews has better CORS support
        const query = this.buildSimpleQuery(keywords);
        const url = `https://gnews.io/api/v4/search?` +
            `q=${encodeURIComponent(query)}&` +
            `max=${limit}&` +
            `lang=en&` +
            `apikey=${AppConfig.GNEWS_API_KEY}`;

        console.log('Fetching from GNews...');
        
        try {
            // Using fetch without mode:'cors' might work better
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`GNews error: ${response.status}`);
            }

            const data = await response.json();
            
            return (data.articles || []).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source?.name || 'Unknown Source',
                image: article.image || this.getDefaultImage(),
                publishedAt: article.publishedAt,
                category: 'career',
                relevance: 0.7
            })).filter(article => article.title && article.description);

        } catch (error) {
            console.error('GNews fetch error:', error);
            // Try with a CORS proxy as fallback
            return await this.fetchFromGNewsWithProxy(keywords, limit);
        }
    }

    async fetchFromGNewsWithProxy(keywords, limit) {
        // Fallback using CORS proxy
        const query = this.buildSimpleQuery(keywords);
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(
            `https://gnews.io/api/v4/search?q=${query}&max=${limit}&lang=en&apikey=${AppConfig.GNEWS_API_KEY}`
        )}`;

        try {
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`GNews proxy error: ${response.status}`);
            }

            const data = await response.json();
            
            return (data.articles || []).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source?.name || 'Unknown Source',
                image: article.image || this.getDefaultImage(),
                publishedAt: article.publishedAt,
                category: 'career',
                relevance: 0.7
            }));

        } catch (error) {
            console.error('GNews proxy also failed:', error);
            return [];
        }
    }

    buildSimpleQuery(keywords) {
        // Simpler query to avoid issues
        const mainKeywords = keywords.slice(0, 2);
        return mainKeywords.join(' ');
    }

    extractCategory(article) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        if (text.includes('tech') || text.includes('software') || text.includes('developer')) return 'technology';
        if (text.includes('health') || text.includes('medical') || text.includes('nurse')) return 'healthcare';
        if (text.includes('business') || text.includes('market') || text.includes('finance')) return 'business';
        if (text.includes('education') || text.includes('teacher') || text.includes('student')) return 'education';
        return 'general';
    }

    getDefaultImage() {
        const defaultImages = [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop'
        ];
        return defaultImages[Math.floor(Math.random() * defaultImages.length)];
    }

    getSampleCareerNews() {
        return [
            {
                title: 'Tech Industry Sees Record Hiring in 2024',
                description: 'Software development and AI roles lead the growth with 20% increase in job postings.',
                url: '#',
                source: 'Tech Careers Digest',
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                relevance: 0.9
            },
            {
                title: 'Remote Work Becoming Permanent Fixture',
                description: '65% of companies now offer remote or hybrid work options, transforming career opportunities.',
                url: '#',
                source: 'Remote Work Insights',
                image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                category: 'business',
                relevance: 0.85
            },
            {
                title: 'Healthcare Sector Adds 50,000 New Positions',
                description: 'Nursing and healthcare administration see unprecedented growth nationwide.',
                url: '#',
                source: 'Healthcare Employment Report',
                image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 172800000).toISOString(),
                category: 'healthcare',
                relevance: 0.8
            },
            {
                title: 'Data Science Careers Continue to Expand',
                description: 'New report shows 30% growth in data-related roles across all industries.',
                url: '#',
                source: 'Data Career Weekly',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 259200000).toISOString(),
                category: 'technology',
                relevance: 0.88
            }
        ];
    }

    clearCache() {
        this.cache.clear();
        console.log('News cache cleared');
    }
}

// ============================================
// 3. FIXED JOB MARKET API INTEGRATION
// ============================================

class JobMarketManager {
    constructor() {
        this.config = {
            ADZUNA: {
                baseURL: 'https://api.adzuna.com/v1/api/jobs',
                appId: AppConfig.ADZUNA_APP_ID,
                appKey: AppConfig.ADZUNA_APP_KEY,
                countries: ['us', 'gb']
            }
        };
        this.cache = new Map();
    }

    async fetchJobsByCareer(careerTitle, location = 'us', limit = 8) {
        const cacheKey = `jobs_${careerTitle}_${location}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            console.log(`Returning cached jobs for ${careerTitle}`);
            return cached.data;
        }

        let jobs = [];
        
        try {
            // Try Adzuna first
            const adzunaJobs = await this.fetchAdzunaJobs(careerTitle, location, limit);
            if (adzunaJobs.length > 0) {
                jobs = adzunaJobs;
            }
        } catch (error) {
            console.warn('Adzuna API failed:', error.message);
        }

        // If no jobs from API, use sample data
        if (jobs.length === 0) {
            console.log('Using sample job data');
            jobs = this.getSampleJobs(careerTitle, limit);
        }

        const finalJobs = jobs.slice(0, limit);
        
        // Cache results
        this.cache.set(cacheKey, {
            data: finalJobs,
            timestamp: Date.now()
        });

        return finalJobs;
    }

    async fetchAdzunaJobs(careerTitle, location, limit) {
        const url = `${this.config.ADZUNA.baseURL}/${location}/search/1?` +
            `app_id=${this.config.ADZUNA.appId}&` +
            `app_key=${this.config.ADZUNA.appKey}&` +
            `what=${encodeURIComponent(careerTitle)}&` +
            `results_per_page=${limit}&` +
            `content-type=application/json`;
        
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
        const baseJobs = [
            {
                id: 'sample_1',
                title: `Senior ${careerTitle}`,
                company: 'Tech Innovations Inc.',
                location: 'San Francisco, CA',
                description: `Exciting opportunity for a Senior ${careerTitle} to join our innovative team.`,
                salary_min: 90000,
                salary_max: 140000,
                created: new Date().toISOString(),
                category: 'Technology',
                is_remote: true,
                source: 'sample'
            },
            {
                id: 'sample_2',
                title: `${careerTitle} - Remote Position`,
                company: 'Global Solutions Ltd.',
                location: 'Remote',
                description: `Join our distributed team as a ${careerTitle}. We offer flexible hours and great benefits.`,
                salary_min: 70000,
                salary_max: 110000,
                created: new Date(Date.now() - 86400000).toISOString(),
                category: 'Business',
                is_remote: true,
                source: 'sample'
            },
            {
                id: 'sample_3',
                title: `Junior ${careerTitle}`,
                company: 'Startup Ventures',
                location: 'New York, NY',
                description: `Entry-level position for aspiring ${careerTitle.toLowerCase()}s. Great learning opportunity.`,
                salary_min: 50000,
                salary_max: 70000,
                created: new Date(Date.now() - 172800000).toISOString(),
                category: 'Technology',
                is_remote: false,
                source: 'sample'
            },
            {
                id: 'sample_4',
                title: `${careerTitle} Specialist`,
                company: 'Enterprise Corporation',
                location: 'Chicago, IL',
                description: `Looking for a specialist in ${careerTitle.toLowerCase()} to join our growing department.`,
                salary_min: 80000,
                salary_max: 120000,
                created: new Date(Date.now() - 259200000).toISOString(),
                category: 'Business',
                is_remote: false,
                source: 'sample'
            }
        ];
        
        return baseJobs.slice(0, limit);
    }

    async getJobMarketTrends(careerField) {
        const cacheKey = `trends_${careerField}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            return cached.data;
        }

        try {
            // Fetch jobs for analysis
            const jobs = await this.fetchJobsByCareer(careerField, 'us', 10);
            
            const trends = {
                totalJobs: jobs.length,
                averageSalary: this.calculateAverageSalary(jobs),
                remotePercentage: this.calculateRemotePercentage(jobs),
                topCompanies: this.extractTopCompanies(jobs, 3),
                recentPostings: this.getRecentPostings(jobs, 7),
                demandLevel: this.calculateDemandLevel(jobs.length)
            };
            
            // Cache trends
            this.cache.set(cacheKey, {
                data: trends,
                timestamp: Date.now()
            });
            
            return trends;
            
        } catch (error) {
            console.error('Trends analysis error:', error);
            return this.getSampleTrends(careerField);
        }
    }

    calculateAverageSalary(jobs) {
        const validSalaries = jobs.filter(j => j.salary_min && j.salary_max)
            .map(j => (j.salary_min + j.salary_max) / 2);
        
        if (validSalaries.length === 0) return 0;
        
        const average = validSalaries.reduce((sum, salary) => sum + salary, 0) / validSalaries.length;
        return Math.round(average);
    }

    calculateRemotePercentage(jobs) {
        if (jobs.length === 0) return 0;
        const remoteCount = jobs.filter(j => j.is_remote === true).length;
        return Math.round((remoteCount / jobs.length) * 100);
    }

    extractTopCompanies(jobs, limit) {
        const companyCount = {};
        jobs.forEach(job => {
            if (job.company && job.company !== 'Unknown Company') {
                companyCount[job.company] = (companyCount[job.company] || 0) + 1;
            }
        });
        
        return Object.entries(companyCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([company, count]) => ({ company, count }));
    }

    getRecentPostings(jobs, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return jobs.filter(job => new Date(job.created) > cutoff).length;
    }

    calculateDemandLevel(jobCount) {
        if (jobCount > 20) return 'High';
        if (jobCount > 10) return 'Moderate';
        if (jobCount > 5) return 'Low';
        return 'Very Low';
    }

    getSampleTrends(careerField) {
        return {
            totalJobs: 15,
            averageSalary: 85000,
            remotePercentage: 60,
            topCompanies: [
                { company: 'Tech Corp', count: 3 },
                { company: 'Innovate Ltd', count: 2 }
            ],
            recentPostings: 8,
            demandLevel: 'Moderate'
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('Job cache cleared');
    }
}

// ============================================
// 4. SIMPLIFIED DASHBOARD MANAGER
// ============================================

class DashboardManager {
    constructor() {
        this.onetAPI = new OnetAPIManager();
        this.newsManager = new NewsIntegrationManager();
        this.jobMarket = new JobMarketManager();
        this.initialized = false;
    }

    async initializeDashboard() {
        if (this.initialized) {
            console.log('Dashboard already initialized');
            return;
        }
        
        console.log('Initializing dashboard...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load all dashboard components in parallel
            await Promise.allSettled([
                this.loadUserStats(),
                this.loadCareerInsights(),
                this.loadJobMarketData(),
                this.loadCareerNews()
            ]);
            
            // Initialize charts
            this.initializeCharts();
            
            // Update UI
            this.updateDashboardUI();
            
            // Add attribution
            this.onetAPI.addAttribution('career-data-container');
            
            this.initialized = true;
            this.hideLoadingState();
            
            console.log('Dashboard initialization complete');
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showErrorState(error);
            this.hideLoadingState();
        }
    }

    async loadUserStats() {
        try {
            // Update user name
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                const userName = localStorage.getItem('userName') || 'Career Explorer';
                userNameElement.textContent = userName;
            }
            
            // Get stats from localStorage or use defaults
            const totalAssessments = localStorage.getItem('totalAssessments') || '0';
            const savedCareers = localStorage.getItem('savedCareers') || '0';
            const matchPercentage = localStorage.getItem('matchPercentage') || '75';
            
            // Update stats
            const totalAssessmentsEl = document.getElementById('total-assessments');
            const savedCareersEl = document.getElementById('saved-careers');
            const matchPercentageEl = document.getElementById('match-percentage');
            
            if (totalAssessmentsEl) totalAssessmentsEl.textContent = totalAssessments;
            if (savedCareersEl) savedCareersEl.textContent = savedCareers;
            if (matchPercentageEl) matchPercentageEl.textContent = `${matchPercentage}%`;
            
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadCareerInsights() {
        try {
            const container = document.getElementById('career-insights-container');
            if (!container) return;
            
            // Get sample career suggestions
            const suggestions = [
                {
                    id: '15-1252',
                    title: 'Software Developer',
                    description: 'Develop applications and systems software.',
                    matchScore: 85,
                    riasecCodes: ['I', 'R', 'C']
                },
                {
                    id: '29-1141',
                    title: 'Registered Nurse',
                    description: 'Provide and coordinate patient care.',
                    matchScore: 78,
                    riasecCodes: ['S', 'I', 'C']
                },
                {
                    id: '13-1161',
                    title: 'Market Research Analyst',
                    description: 'Research market conditions and trends.',
                    matchScore: 72,
                    riasecCodes: ['I', 'E', 'C']
                }
            ];
            
            this.updateCareerInsights(suggestions);
            
        } catch (error) {
            console.error('Error loading career insights:', error);
            this.showNoInsightsMessage();
        }
    }

    async loadJobMarketData() {
        try {
            const interests = ['Software Developer', 'Data Analyst'];
            
            const marketData = [];
            for (const interest of interests.slice(0, 2)) {
                const trends = await this.jobMarket.getJobMarketTrends(interest);
                marketData.push({
                    field: interest,
                    ...trends
                });
            }
            
            this.updateJobMarketWidget(marketData);
            
        } catch (error) {
            console.error('Error loading job market data:', error);
        }
    }

    async loadCareerNews() {
        try {
            const interests = ['career', 'jobs', 'employment'];
            const news = await this.newsManager.fetchCareerNews(interests, 4);
            this.updateNewsWidget(news);
            
        } catch (error) {
            console.error('Error loading career news:', error);
        }
    }

    updateCareerInsights(careers) {
        const container = document.getElementById('career-insights-container');
        if (!container) return;
        
        if (careers && careers.length > 0) {
            container.innerHTML = `
                <div class="row g-3">
                    ${careers.map(career => `
                        <div class="col-md-4">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <h6 class="card-title">${career.title}</h6>
                                    <div class="mb-2">
                                        <small class="text-muted">Match: ${career.matchScore}%</small>
                                        <div class="progress" style="height: 5px;">
                                            <div class="progress-bar bg-success" style="width: ${career.matchScore}%"></div>
                                        </div>
                                    </div>
                                    <p class="card-text small text-muted">
                                        ${career.description}
                                    </p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            ${career.riasecCodes?.map(code => `
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
        } else {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-lightbulb display-4 text-muted"></i>
                    <p class="mt-3">Complete an assessment to get career insights</p>
                    <a href="assessment.html" class="btn btn-primary">Take Assessment</a>
                </div>
            `;
        }
    }

    updateJobMarketWidget(marketData) {
        const container = document.getElementById('job-market-widget');
        if (!container) return;
        
        if (marketData && marketData.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Market Trends</h6>
                    </div>
                    <div class="card-body">
                        ${marketData.map((data, index) => `
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>${data.field}</strong>
                                    <span class="badge bg-${this.getDemandBadgeColor(data.demandLevel)}">
                                        ${data.demandLevel}
                                    </span>
                                </div>
                                <div class="row small text-muted">
                                    <div class="col-6">
                                        <i class="bi bi-briefcase me-1"></i> ${data.totalJobs} jobs
                                    </div>
                                    <div class="col-6 text-end">
                                        <i class="bi bi-cash-coin me-1"></i> $${data.averageSalary?.toLocaleString() || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            ${index < marketData.length - 1 ? '<hr class="my-2">' : ''}
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    updateNewsWidget(news) {
        const container = document.getElementById('news-widget');
        if (!container) return;
        
        if (news && news.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="bi bi-newspaper me-2"></i>Career News</h6>
                        <small class="text-muted">Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            ${news.slice(0, 2).map(article => `
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm">
                                        ${article.image ? `
                                            <img src="${article.image}" 
                                                 class="card-img-top" 
                                                 style="height: 150px; object-fit: cover;"
                                                 alt="${article.title}">
                                        ` : ''}
                                        <div class="card-body">
                                            <h6 class="card-title">${article.title}</h6>
                                            <p class="card-text small text-muted">${article.description?.substring(0, 80)}...</p>
                                            <a href="${article.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                Read More
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    getDemandBadgeColor(level) {
        const colors = {
            'High': 'success',
            'Moderate': 'info',
            'Low': 'warning',
            'Very Low': 'secondary'
        };
        return colors[level] || 'secondary';
    }

    initializeCharts() {
        // Initialize simple chart for interests
        const ctx = document.getElementById('interest-chart');
        if (!ctx) return;
        
        // Sample data
        const scores = { R: 75, I: 90, A: 60, S: 85, E: 70, C: 55 };
        
        // Create a simple HTML-based chart instead of Chart.js to avoid dependencies
        ctx.innerHTML = `
            <div class="simple-chart">
                <div class="chart-labels d-flex justify-content-between mb-2">
                    ${Object.entries(scores).map(([code, score]) => `
                        <div class="text-center">
                            <div class="fw-bold">${code}</div>
                            <div class="small text-muted">${score}%</div>
                        </div>
                    `).join('')}
                </div>
                <div class="chart-bars d-flex align-items-end" style="height: 100px;">
                    ${Object.values(scores).map(score => `
                        <div class="flex-fill mx-1">
                            <div class="bg-primary rounded-top" style="height: ${score}%;"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateDashboardUI() {
        // Update last updated timestamp
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }

    showLoadingState() {
        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    hideLoadingState() {
        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showErrorState(error) {
        const errorContainer = document.getElementById('dashboard-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Dashboard loaded with limited data:</strong> ${error.message || 'Some external services are unavailable'}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    showNoInsightsMessage() {
        const container = document.getElementById('career-insights-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-lightbulb display-4 text-muted"></i>
                    <p class="mt-3">Complete an assessment to get personalized career insights</p>
                    <a href="assessment.html" class="btn btn-primary">Take Assessment</a>
                </div>
            `;
        }
    }
}

// ============================================
// 5. SIMPLE ERROR HANDLER
// ============================================

class ErrorHandler {
    static showToast(message, type = 'info', duration = 3000) {
        const toastId = 'app-toast-' + Date.now();
        
        const toastTypes = {
            info: { icon: 'info-circle', color: 'primary' },
            success: { icon: 'check-circle', color: 'success' },
            warning: { icon: 'exclamation-triangle', color: 'warning' },
            error: { icon: 'exclamation-circle', color: 'danger' }
        };
        
        const toastType = toastTypes[type] || toastTypes.info;
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center border-0" 
                 role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center">
                        <i class="bi bi-${toastType.icon} text-${toastType.color} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                            data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        const toastContainer = document.getElementById('toast-container') || 
            (() => {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';
                document.body.appendChild(container);
                return container;
            })();
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        
        // Simple show/hide without Bootstrap dependency
        toastElement.style.display = 'block';
        toastElement.style.opacity = '1';
        
        // Auto-hide
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.style.opacity = '0';
                setTimeout(() => toastElement.remove(), 300);
            }
        }, duration);
    }
    
    static logError(error, context = '') {
        console.error(`Error${context ? ' in ' + context : ''}:`, error);
        
        // Don't show toast for network errors (they're common)
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') ||
            error.message.includes('CORS')) {
            console.warn('Network error (not shown to user):', error.message);
            return;
        }
        
        // Show user-friendly error
        this.showToast(`Operation failed: ${error.message}`, 'error', 5000);
    }
}

// ============================================
// 6. MAIN APP INITIALIZATION
// ============================================

class CareerGuidanceApp {
    constructor() {
        console.log('Initializing Career Guidance App...');
        
        // Initialize managers
        this.onetAPI = new OnetAPIManager();
        this.newsManager = new NewsIntegrationManager();
        this.jobMarket = new JobMarketManager();
        this.dashboard = new DashboardManager();
        
        // Set up theme
        this.setupTheme();
        
        // Initialize based on current page
        this.initPageSpecificFeatures();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Test APIs quietly (don't show errors to users)
        this.testAPIConnections();
        
        console.log('Career Guidance App initialized');
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        AppState.theme = savedTheme;
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', AppState.theme);
        document.body.classList.toggle('dark-theme', AppState.theme === 'dark');
        
        // Update theme toggle button if exists
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = AppState.theme === 'dark' ? 
                '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
        }
    }
    
    toggleTheme() {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', AppState.theme);
        document.body.classList.toggle('dark-theme', AppState.theme === 'dark');
        
        // Save preference
        localStorage.setItem('app-theme', AppState.theme);
        
        // Update toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.innerHTML = AppState.theme === 'dark' ? 
                '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
        }
    }
    
    initPageSpecificFeatures() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        console.log(`Initializing page: ${page}`);
        
        switch (page) {
            case 'dashboard.html':
                this.initDashboard();
                break;
                
            case 'careers.html':
                this.initCareersPage();
                break;
                
            case 'assessment.html':
                this.initAssessmentPage();
                break;
                
            case 'jobs.html':
                this.initJobsPage();
                break;
                
            case 'index.html':
            case '':
                this.initHomePage();
                break;
        }
    }
    
    async initDashboard() {
        console.log('Initializing dashboard...');
        
        // Initialize dashboard immediately (no auth required for demo)
        setTimeout(() => {
            this.dashboard.initializeDashboard();
        }, 500);
    }
    
    async initHomePage() {
        console.log('Initializing homepage...');
        
        // Load featured content
        await this.loadFeaturedContent();
    }
    
    async loadFeaturedContent() {
        try {
            // Load popular careers
            const popularCareers = await this.onetAPI.searchCareersByInterest('I', 6);
            
            // Load latest career news
            const news = await this.newsManager.fetchCareerNews(['career', 'jobs'], 4);
            
            // Update homepage
            this.updateHomepageContent(popularCareers, news);
            
        } catch (error) {
            console.error('Error loading featured content:', error);
            // Silently fail - homepage will show default content
        }
    }
    
    updateHomepageContent(careers, news) {
        // Update popular careers section
        const careersContainer = document.getElementById('popular-careers');
        if (careersContainer) {
            if (careers && careers.length > 0) {
                careersContainer.innerHTML = `
                    <div class="row g-4">
                        ${careers.slice(0, 3).map(career => `
                            <div class="col-md-4">
                                <div class="card h-100 border-0 shadow-sm">
                                    <div class="card-body text-center">
                                        <i class="bi bi-briefcase display-4 text-primary mb-3"></i>
                                        <h5 class="card-title">${career.title}</h5>
                                        <p class="card-text text-muted small">
                                            ${career.description?.substring(0, 80) || 'Explore this career path'}...
                                        </p>
                                        <a href="careers.html?id=${career.id || '#'}" 
                                           class="btn btn-outline-primary">
                                            Explore
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                // Fallback content
                careersContainer.innerHTML = `
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body text-center">
                                    <i class="bi bi-code-slash display-4 text-primary mb-3"></i>
                                    <h5 class="card-title">Software Developer</h5>
                                    <p class="card-text text-muted small">
                                        Develop applications and systems software. High demand career with great growth potential.
                                    </p>
                                    <a href="careers.html" class="btn btn-outline-primary">
                                        Explore
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body text-center">
                                    <i class="bi bi-heart-pulse display-4 text-danger mb-3"></i>
                                    <h5 class="card-title">Registered Nurse</h5>
                                    <p class="card-text text-muted small">
                                        Provide and coordinate patient care. Rewarding career in healthcare with stable growth.
                                    </p>
                                    <a href="careers.html" class="btn btn-outline-primary">
                                        Explore
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100 border-0 shadow-sm">
                                <div class="card-body text-center">
                                    <i class="bi bi-graph-up display-4 text-success mb-3"></i>
                                    <h5 class="card-title">Data Analyst</h5>
                                    <p class="card-text text-muted small">
                                        Analyze data to help organizations make better decisions. Growing field across all industries.
                                    </p>
                                    <a href="careers.html" class="btn btn-outline-primary">
                                        Explore
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Update news section
        const newsContainer = document.getElementById('home-news');
        if (newsContainer) {
            if (news && news.length > 0) {
                newsContainer.innerHTML = `
                    <div class="row g-4">
                        ${news.slice(0, 2).map(article => `
                            <div class="col-md-6">
                                <div class="card h-100 border-0 shadow-sm">
                                    ${article.image ? `
                                        <img src="${article.image}" 
                                             class="card-img-top" 
                                             style="height: 200px; object-fit: cover;"
                                             alt="${article.title}">
                                    ` : ''}
                                    <div class="card-body">
                                        <h5 class="card-title">${article.title}</h5>
                                        <p class="card-text text-muted">${article.description?.substring(0, 100)}...</p>
                                        <a href="${article.url}" target="_blank" 
                                           class="btn btn-outline-primary">
                                            Read More
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = searchInput.value.trim();
                    if (query.length > 2) {
                        this.handleGlobalSearch(query);
                    }
                }, 300);
            });
        }
    }
    
    async handleGlobalSearch(query) {
        try {
            // Simple search - redirect to careers page
            window.location.href = `careers.html?search=${encodeURIComponent(query)}`;
        } catch (error) {
            console.error('Search error:', error);
        }
    }
    
    async testAPIConnections() {
        console.log('Testing API connections (silently)...');
        
        // Test APIs quietly without showing errors to users
        const tests = [
            {
                name: 'O*NET API',
                test: async () => {
                    try {
                        const result = await this.onetAPI.getCareerData('15-1252');
                        return result && result.title ? 'Connected' : 'Fallback';
                    } catch {
                        return 'Fallback';
                    }
                }
            },
            {
                name: 'News API',
                test: async () => {
                    try {
                        const result = await this.newsManager.fetchCareerNews(['test'], 1);
                        return result && Array.isArray(result) ? 'Connected' : 'Fallback';
                    } catch {
                        return 'Fallback';
                    }
                }
            }
        ];
        
        for (const test of tests) {
            try {
                const result = await test.test();
                console.log(`✅ ${test.name}: ${result}`);
            } catch (error) {
                console.log(`⚠️ ${test.name}: Fallback mode`);
            }
        }
    }
}

// ============================================
// 7. GLOBAL EXPORTS AND INITIALIZATION
// ============================================

// Export for use in other files
window.CareerAPIs = {
    OnetAPIManager,
    NewsIntegrationManager,
    JobMarketManager,
    DashboardManager,
    ErrorHandler
};

// Global utility functions
window.viewCareerDetails = function(careerId) {
    window.location.href = `careers.html?id=${careerId}`;
};

window.exploreJobs = function(careerTitle) {
    window.location.href = `jobs.html?career=${encodeURIComponent(careerTitle)}`;
};

window.refreshDashboard = function() {
    if (window.CareerApp && window.CareerApp.dashboard) {
        window.CareerApp.dashboard.initializeDashboard();
        ErrorHandler.showToast('Dashboard refreshed', 'success');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Starting Career Guidance App');
    
    try {
        window.CareerApp = new CareerGuidanceApp();
        console.log('🎉 Career Guidance App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Career Guidance App:', error);
        // Still show the page even if app initialization fails
        ErrorHandler.showToast('Application loaded with limited features', 'warning');
    }
});

// Add minimal CSS for the app
const style = document.createElement('style');
style.textContent = `
    /* Minimal required CSS */
    .onet-attribution {
        font-size: 0.8rem;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 2rem;
    }
    
    .onet-attribution a {
        color: #0d6efd;
        text-decoration: none;
    }
    
    .onet-attribution a:hover {
        text-decoration: underline;
    }
    
    .simple-chart .chart-bars div {
        background-color: #0d6efd;
        opacity: 0.7;
        transition: height 0.3s ease;
    }
    
    .simple-chart .chart-bars div:hover {
        opacity: 1;
    }
    
    /* Loading animation */
    #dashboard-loading {
        display: none;
        text-align: center;
        padding: 2rem;
    }
    
    /* Toast styles */
    .toast {
        background-color: #333;
        color: white;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: opacity 0.3s ease;
    }
    
    /* Dark theme support */
    [data-theme="dark"] body {
        background-color: #212529;
        color: #f8f9fa;
    }
    
    [data-theme="dark"] .card {
        background-color: #343a40;
        border-color: #495057;
    }
    
    [data-theme="dark"] .text-muted {
        color: #adb5bd !important;
    }
`;
document.head.appendChild(style);

console.log('📦 Career Guidance App bundle loaded');