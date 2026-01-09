// ============================================
// MAIN.JS - All API Integrations & Core Logic
// ============================================

// Global Configuration - USING YOUR ACTUAL API KEYS
const AppConfig = {
    // API Keys
    ONET_API_KEY: 'YOUR_ONET_API_KEY', // Register at onetcenter.org
    NEWS_API_KEY: 'cff14927ed9a417ca2c89f3cbe3c0269',  // From newsapi.org
    GNEWS_API_KEY: '5a01429d28b5c10f5eb820ecfd75d67e',   // From gnews.io
    MEDIASTACK_KEY: 'a4726d06e2ee7e97355c2bdfd365fd8e',  // From mediastack
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

// ============================================
// 1. O*NET API INTEGRATION
// ============================================

class OnetAPIManager {
    constructor() {
        this.baseURL = 'https://services.onetcenter.org/ws/';
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
            return cached.data;
        }

        try {
            const response = await fetch(
                `${this.baseURL}online/occupations/${socCode}/summary?format=json`,
                {
                    headers: {
                        'Authorization': 'Basic ' + btoa(AppConfig.ONET_API_KEY + ':'),
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`O*NET API Error: ${response.status}`);
            }

            const data = await response.json();
            
            const careerData = {
                id: socCode,
                title: data.occupation?.title || 'Unknown Occupation',
                description: data.occupation?.description || '',
                tasks: data.occupation?.tasks?.map(t => t.task) || [],
                skills: data.occupation?.skills?.map(s => ({
                    name: s.name,
                    importance: s.importance,
                    level: s.level
                })) || [],
                interests: data.occupation?.interests?.map(i => ({
                    name: i.name,
                    code: i.code,
                    score: i.score
                })) || [],
                salary: {
                    median: data.occupation?.wages?.national_median || 0,
                    hourly: data.occupation?.wages?.median_hourly || 0
                },
                outlook: {
                    growth: data.occupation?.job_outlook?.growth_rate || 0,
                    trend: data.occupation?.job_outlook?.trend || 'Stable'
                },
                education: data.occupation?.education?.map(e => e.level) || [],
                riasecCodes: data.occupation?.interests?.map(i => i.code) || []
            };

            this.cache.set(cacheKey, {
                data: careerData,
                timestamp: Date.now()
            });

            return careerData;

        } catch (error) {
            console.error('O*NET API Error:', error);
            return this.getFallbackCareerData(socCode);
        }
    }

    async searchCareersByInterest(riasecCode, maxResults = 10) {
        try {
            const response = await fetch(
                `${this.baseURL}mnm/interestexplorer/careers?format=json&interest=${riasecCode}&max=${maxResults}`,
                {
                    headers: {
                        'Authorization': 'Basic ' + btoa(AppConfig.ONET_API_KEY + ':')
                    }
                }
            );

            const data = await response.json();
            return data.careers || [];

        } catch (error) {
            console.error('O*NET Search Error:', error);
            return [];
        }
    }

    getFallbackCareerData(socCode) {
        const fallbackCareers = {
            '15-1252': {
                title: 'Software Developer',
                description: 'Develop applications and systems software.',
                skills: [
                    { name: 'Programming', importance: 90, level: 80 },
                    { name: 'Problem Solving', importance: 85, level: 75 },
                    { name: 'Teamwork', importance: 75, level: 70 }
                ],
                riasecCodes: ['I', 'R', 'C'],
                salary: { median: 90000, hourly: 43.27 },
                outlook: { growth: 22, trend: 'Growing' }
            },
            '29-1141': {
                title: 'Registered Nurse',
                description: 'Provide and coordinate patient care.',
                skills: [
                    { name: 'Patient Care', importance: 95, level: 85 },
                    { name: 'Communication', importance: 90, level: 80 },
                    { name: 'Critical Thinking', importance: 85, level: 75 }
                ],
                riasecCodes: ['S', 'I', 'C'],
                salary: { median: 75000, hourly: 36.06 },
                outlook: { growth: 12, trend: 'Growing' }
            }
        };

        return fallbackCareers[socCode] || {
            title: 'Career Information',
            description: 'Career data is currently unavailable.',
            skills: [],
            riasecCodes: [],
            salary: { median: 0, hourly: 0 },
            outlook: { growth: 0, trend: 'Unknown' }
        };
    }

    addAttribution(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.insertAdjacentHTML('beforeend', this.attributionHTML);
        }
    }
}

// ============================================
// 2. UPDATED NEWS API INTEGRATION (NewsAPI.org + Mediastack)
// ============================================

class NewsIntegrationManager {
    constructor() {
        this.newsSources = {
            NEWSAPI: {
                baseURL: 'https://newsapi.org/v2/everything',
                apiKey: AppConfig.NEWS_API_KEY
            },
            MEDIASTACK: {
                baseURL: 'http://api.mediastack.com/v1/news',
                apiKey: AppConfig.MEDIASTACK_KEY
            },
            GNEWS: {
                baseURL: 'https://gnews.io/api/v4/search',
                apiKey: AppConfig.GNEWS_API_KEY
            }
        };
        this.cache = new Map();
    }

    async fetchCareerNews(keywords = ['career', 'jobs'], limit = 6) {
        const cacheKey = `news_${keywords.join('_')}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.NEWS_DATA) {
            return cached.data;
        }

        try {
            // Try NewsAPI.org first
            let articles = await this.fetchFromNewsAPI(keywords, limit);
            
            // If NewsAPI fails, try Mediastack
            if (!articles || articles.length === 0) {
                articles = await this.fetchFromMediastack(keywords, limit);
            }
            
            // If still no articles, try GNews
            if (!articles || articles.length === 0) {
                articles = await this.fetchFromGNews(keywords, limit);
            }
            
            // Final fallback
            if (!articles || articles.length === 0) {
                articles = this.getSampleCareerNews();
            }
            
            this.cache.set(cacheKey, {
                data: articles.slice(0, limit),
                timestamp: Date.now()
            });
            
            return articles.slice(0, limit);
            
        } catch (error) {
            console.error('News fetch error:', error);
            return this.getSampleCareerNews().slice(0, limit);
        }
    }

    async fetchFromNewsAPI(keywords, limit) {
        try {
            const query = keywords.map(k => `"${k}"`).join(' OR ');
            const response = await fetch(
                `${this.newsSources.NEWSAPI.baseURL}?` +
                `q=${encodeURIComponent(query)}&` +
                `language=en&` +
                `sortBy=publishedAt&` +
                `pageSize=${limit}&` +
                `apiKey=${this.newsSources.NEWSAPI.apiKey}`
            );

            if (!response.ok) {
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
                category: this.extractCategory(article)
            })).filter(article => article.title && article.description);

        } catch (error) {
            console.warn('NewsAPI failed, trying Mediastack:', error);
            return null;
        }
    }

    async fetchFromMediastack(keywords, limit) {
        try {
            const query = keywords.join(' ');
            const response = await fetch(
                `${this.newsSources.MEDIASTACK.baseURL}?` +
                `access_key=${this.newsSources.MEDIASTACK.apiKey}&` +
                `keywords=${encodeURIComponent(query)}&` +
                `languages=en&` +
                `limit=${limit}`
            );

            if (!response.ok) {
                throw new Error(`Mediastack error: ${response.status}`);
            }

            const data = await response.json();
            
            return (data.data || []).map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source || 'Unknown Source',
                image: article.image || this.getDefaultImage(),
                publishedAt: article.published_at,
                category: article.category || 'general'
            }));

        } catch (error) {
            console.warn('Mediastack failed:', error);
            return null;
        }
    }

    async fetchFromGNews(keywords, limit) {
        try {
            const query = keywords.join(' OR ');
            const response = await fetch(
                `${this.newsSources.GNEWS.baseURL}?` +
                `q=${encodeURIComponent(query)}&` +
                `lang=en&` +
                `max=${limit}&` +
                `apikey=${this.newsSources.GNEWS.apiKey}`
            );

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
                category: 'career'
            }));

        } catch (error) {
            console.error('GNews failed:', error);
            return [];
        }
    }

    getSampleCareerNews() {
        return [
            {
                title: 'Tech Careers See 20% Growth in 2024',
                description: 'Software development and data science roles continue to lead hiring trends.',
                url: '#',
                source: 'Tech Careers Digest',
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop',
                publishedAt: new Date().toISOString(),
                category: 'technology'
            },
            {
                title: 'Remote Work Expands Career Opportunities',
                description: 'Companies continue to offer flexible work arrangements across industries.',
                url: '#',
                source: 'Remote Work Today',
                image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400&h=225&fit=crop',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                category: 'business'
            }
        ];
    }

    extractCategory(article) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        if (text.includes('tech') || text.includes('software') || text.includes('developer')) return 'technology';
        if (text.includes('health') || text.includes('medical') || text.includes('nurse')) return 'healthcare';
        if (text.includes('business') || text.includes('market') || text.includes('finance')) return 'business';
        return 'general';
    }

    getDefaultImage() {
        const images = [
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop',
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=225&fit=crop',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=225&fit=crop'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }
}

// ============================================
// 3. JOB MARKET API INTEGRATION
// ============================================

class JobMarketManager {
    constructor() {
        this.config = {
            ADZUNA: {
                baseURL: 'https://api.adzuna.com/v1/api/jobs',
                appId: AppConfig.ADZUNA_APP_ID,
                appKey: AppConfig.ADZUNA_APP_KEY
            },
            REMOTIVE: {
                baseURL: 'https://remotive.com/api/remote-jobs'
            }
        };
        this.cache = new Map();
    }

    async fetchJobsByCareer(careerTitle, location = 'us', limit = 8) {
        const cacheKey = `jobs_${careerTitle}_${location}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            return cached.data;
        }

        try {
            let jobs = await this.fetchAdzunaJobs(careerTitle, location, limit);
            
            if (jobs.length < limit / 2) {
                const remoteJobs = await this.fetchRemotiveJobs(careerTitle, limit - jobs.length);
                jobs = [...jobs, ...remoteJobs];
            }
            
            if (jobs.length === 0) {
                jobs = this.getSampleJobs(careerTitle);
            }
            
            this.cache.set(cacheKey, {
                data: jobs.slice(0, limit),
                timestamp: Date.now()
            });
            
            return jobs.slice(0, limit);
            
        } catch (error) {
            console.error('Job fetch error:', error);
            return this.getSampleJobs(careerTitle).slice(0, limit);
        }
    }

    async fetchAdzunaJobs(careerTitle, location, limit) {
        try {
            const response = await fetch(
                `${this.config.ADZUNA.baseURL}/${location}/search/1?` +
                `app_id=${this.config.ADZUNA.appId}&` +
                `app_key=${this.config.ADZUNA.appKey}&` +
                `what=${encodeURIComponent(careerTitle)}&` +
                `results_per_page=${limit}&` +
                `content-type=application/json`
            );

            if (!response.ok) {
                throw new Error(`Adzuna API error: ${response.status}`);
            }

            const data = await response.json();
            return (data.results || []).map(this.transformAdzunaJob);

        } catch (error) {
            console.warn('Adzuna API failed:', error);
            return [];
        }
    }

    async fetchRemotiveJobs(careerTitle, limit) {
        try {
            const response = await fetch(
                `${this.config.REMOTIVE.baseURL}?search=${encodeURIComponent(careerTitle)}&limit=${limit}`
            );

            if (!response.ok) {
                throw new Error(`Remotive API error: ${response.status}`);
            }

            const data = await response.json();
            return (data.jobs || []).map(this.transformRemotiveJob);

        } catch (error) {
            console.warn('Remotive API failed:', error);
            return [];
        }
    }

    transformAdzunaJob(job) {
        return {
            id: job.id,
            title: job.title,
            company: job.company?.display_name || 'Unknown Company',
            location: job.location?.display_name || 'Location not specified',
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            created: job.created,
            url: job.redirect_url,
            category: job.category?.label,
            is_remote: job.remote_working === true
        };
    }

    transformRemotiveJob(job) {
        return {
            id: job.id,
            title: job.title,
            company: job.company_name,
            location: 'Remote',
            description: job.description,
            salary: job.salary,
            created: job.publication_date,
            url: job.url,
            category: job.category,
            is_remote: true
        };
    }

    getSampleJobs(careerTitle) {
        return [
            {
                id: 'sample1',
                title: `${careerTitle} Position`,
                company: 'Leading Tech Company',
                location: 'Remote',
                description: `Exciting opportunity for a ${careerTitle.toLowerCase()} role.`,
                salary_min: 50000,
                salary_max: 80000,
                created: new Date().toISOString(),
                category: 'Technology',
                is_remote: true
            }
        ];
    }
}

// ============================================
// 4. DASHBOARD MANAGER
// ============================================

class DashboardManager {
    constructor() {
        this.onetAPI = new OnetAPIManager();
        this.newsManager = new NewsIntegrationManager();
        this.jobMarket = new JobMarketManager();
    }

    async initializeDashboard() {
        if (!AppState.currentUser) return;
        
        try {
            await Promise.all([
                this.loadUserStats(),
                this.loadCareerInsights(),
                this.loadJobMarketData(),
                this.loadCareerNews(),
                this.loadRecentAssessments()
            ]);
            
            this.initializeCharts();
            this.onetAPI.addAttribution('career-data-container');
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showErrorState();
        }
    }

    async loadUserStats() {
        try {
            const userDoc = await FirebaseServices.db.collection('users').doc(AppState.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Update user name
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = userData.name || 'User';
                }
                
                // Get assessment count
                const assessmentsSnapshot = await FirebaseServices.db
                    .collection('assessment_results')
                    .where('userId', '==', AppState.currentUser.uid)
                    .get();
                
                document.getElementById('total-assessments').textContent = assessmentsSnapshot.size;
                
                // Get saved careers count
                document.getElementById('saved-careers').textContent = userData.savedCareers?.length || 0;
                
                // Calculate average match
                let totalMatch = 0;
                assessmentsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.scores) {
                        const scores = Object.values(data.scores);
                        if (scores.length > 0) {
                            totalMatch += scores.reduce((a, b) => a + b, 0) / scores.length;
                        }
                    }
                });
                
                const avgMatch = assessmentsSnapshot.size > 0 ? Math.round(totalMatch / assessmentsSnapshot.size) : 0;
                document.getElementById('match-percentage').textContent = `${avgMatch}%`;
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadCareerInsights() {
        try {
            // Get user's latest assessment
            const assessmentsSnapshot = await FirebaseServices.db
                .collection('assessment_results')
                .where('userId', '==', AppState.currentUser.uid)
                .orderBy('completedAt', 'desc')
                .limit(1)
                .get();
            
            if (!assessmentsSnapshot.empty) {
                const latestAssessment = assessmentsSnapshot.docs[0].data();
                const riasecScores = latestAssessment.scores || {};
                
                // Get top RIASEC code
                const topCode = Object.entries(riasecScores)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'I';
                
                // Get career suggestions
                const suggestions = await this.onetAPI.searchCareersByInterest(topCode, 3);
                
                this.updateCareerInsights(suggestions);
            }
        } catch (error) {
            console.error('Error loading career insights:', error);
        }
    }

    async loadJobMarketData() {
        try {
            const userInterests = AppState.userProfile?.careerInterests || ['software developer', 'data analyst'];
            
            const marketData = [];
            for (const interest of userInterests.slice(0, 2)) {
                const jobs = await this.jobMarket.fetchJobsByCareer(interest, 'us', 3);
                marketData.push({
                    field: interest,
                    jobCount: jobs.length,
                    salaryRange: this.calculateSalaryRange(jobs)
                });
            }
            
            this.updateJobMarketWidget(marketData);
            
        } catch (error) {
            console.error('Error loading job market data:', error);
        }
    }

    async loadCareerNews() {
        try {
            const interests = AppState.userProfile?.careerInterests || ['career', 'jobs', 'employment'];
            const news = await this.newsManager.fetchCareerNews(interests, 4);
            this.updateNewsWidget(news);
            
        } catch (error) {
            console.error('Error loading career news:', error);
        }
    }

    async loadRecentAssessments() {
        try {
            const assessmentsSnapshot = await FirebaseServices.db
                .collection('assessment_results')
                .where('userId', '==', AppState.currentUser.uid)
                .orderBy('completedAt', 'desc')
                .limit(3)
                .get();
            
            const assessments = assessmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.updateRecentAssessments(assessments);
            
        } catch (error) {
            console.error('Error loading recent assessments:', error);
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
                                    <h6 class="card-title text-truncate">${career.title}</h6>
                                    <p class="card-text small text-muted">
                                        ${career.description?.substring(0, 80) || 'Explore this career path'}...
                                    </p>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <span class="badge bg-primary">${career.riasecCodes?.[0] || 'Career'}</span>
                                        <button class="btn btn-sm btn-outline-primary" 
                                                onclick="viewCareerDetails('${career.id || career.title}')">
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
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0"><i class="bi bi-graph-up me-2"></i>Job Market</h6>
                    </div>
                    <div class="card-body">
                        ${marketData.map(data => `
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong class="text-truncate">${data.field}</strong>
                                    <span class="badge bg-info">${data.jobCount} jobs</span>
                                </div>
                                ${data.salaryRange.min > 0 ? `
                                    <div class="small text-muted">
                                        Salary: $${data.salaryRange.min.toLocaleString()} - $${data.salaryRange.max.toLocaleString()}
                                    </div>
                                ` : ''}
                            </div>
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
                        <h5 class="mb-0"><i class="bi bi-newspaper me-2"></i>Career News</h5>
                        <small class="text-muted">Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            ${news.map(article => `
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm">
                                        ${article.image ? `
                                            <img src="${article.image}" 
                                                 class="card-img-top" 
                                                 style="height: 150px; object-fit: cover;"
                                                 alt="${article.title}"
                                                 onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop'">
                                        ` : ''}
                                        <div class="card-body">
                                            <h6 class="card-title">${article.title}</h6>
                                            <p class="card-text small text-muted line-clamp-2">${article.description}</p>
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

    updateRecentAssessments(assessments) {
        const container = document.getElementById('recent-assessments');
        if (!container) return;
        
        if (assessments && assessments.length > 0) {
            container.innerHTML = assessments.map(assessment => `
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title">Assessment</h6>
                            <p class="card-text small text-muted">
                                ${new Date(assessment.completedAt).toLocaleDateString()}
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-primary">${assessment.assessmentType || 'RIASEC'}</span>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="viewAssessmentResults('${assessment.id}')">
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="bi bi-clipboard-check display-4 text-muted"></i>
                    <p class="mt-3">No assessments completed yet</p>
                    <a href="assessment.html" class="btn btn-primary">Start Your First Assessment</a>
                </div>
            `;
        }
    }

    calculateSalaryRange(jobs) {
        const salaries = jobs
            .filter(j => j.salary_min && j.salary_max)
            .map(j => ({ min: j.salary_min, max: j.salary_max }));
        
        if (salaries.length === 0) return { min: 0, max: 0 };
        
        return {
            min: Math.min(...salaries.map(s => s.min)),
            max: Math.max(...salaries.map(s => s.max))
        };
    }

    initializeCharts() {
        this.initInterestChart();
        this.initCategoryChart();
    }

    initInterestChart() {
        const ctx = document.getElementById('interest-chart');
        if (!ctx) return;
        
        // Sample data - in real app, get from user's assessment
        const scores = { R: 75, I: 90, A: 60, S: 85, E: 70, C: 55 };
        
        new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
                datasets: [{
                    label: 'Your Interests',
                    data: Object.values(scores),
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
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { stepSize: 20 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    initCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Technology', 'Healthcare', 'Business', 'Engineering', 'Education', 'Arts'],
                datasets: [{
                    label: 'Career Matches',
                    data: [12, 8, 6, 9, 4, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ]
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        setTimeout(() => {
            if (AppState.currentUser) {
                window.dashboardManager = new DashboardManager();
                window.dashboardManager.initializeDashboard();
            }
        }, 1000);
    }
});

// Global functions
window.refreshInsights = function() {
    if (window.dashboardManager) {
        window.dashboardManager.initializeDashboard();
    }
};

window.viewCareerDetails = function(careerId) {
    window.location.href = `careers.html?id=${careerId}`;
};

window.viewAssessmentResults = function(assessmentId) {
    window.location.href = `assessment.html?result=${assessmentId}`;
};