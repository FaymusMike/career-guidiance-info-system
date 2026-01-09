// ============================================
// MAIN.JS - Enhanced Career Guidance System
// ============================================

// Global Configuration with Secure API Keys
const AppConfig = {
    // API Keys - In production, use environment variables
    ONET_API_KEY: 'YOUR_ONET_API_KEY', // Register at onetcenter.org
    NEWS_API_KEY: 'cff14927ed9a417ca2c89f3cbe3c0269',
    GNEWS_API_KEY: '5a01429d28b5c10f5eb820ecfd75d67e',
    MEDIASTACK_KEY: 'a4726d06e2ee7e97355c2bdfd365fd8e',
    ADZUNA_APP_ID: '33ad0b83',
    ADZUNA_APP_KEY: 'b2b03ba1fac65347141fa0fe19b58640',
    
    // Enhanced Cache Settings
    CACHE_TTL: {
        CAREER_DATA: 24 * 60 * 60 * 1000,
        JOB_DATA: 2 * 60 * 60 * 1000,
        NEWS_DATA: 30 * 60 * 1000,
        ASSESSMENT: 7 * 24 * 60 * 60 * 1000,
        USER_PROFILE: 60 * 60 * 1000
    },
    
    // Rate Limiting
    RATE_LIMITS: {
        ONET_API: 10, // requests per minute
        NEWS_API: 30,
        JOB_API: 20
    }
};

// Global Application State
window.AppState = window.AppState || {
    currentUser: null,
    userProfile: null,
    theme: localStorage.getItem('theme') || 'light',
    lastUpdate: null,
    offlineMode: false
};

// ============================================
// 1. ENHANCED O*NET API MANAGER (With Fixes)
// ============================================

class OnetAPIManager {
    constructor() {
        this.baseURL = 'https://services.onetcenter.org/ws/';
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.attributionHTML = this.getAttributionHTML();
    }

    // REQUIRED O*NET Attribution
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
        
        // Return cached data if valid
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
            console.log(`Returning cached career data for ${socCode}`);
            return cached.data;
        }

        // Queue request for rate limiting
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                key: cacheKey,
                socCode: socCode,
                resolve: resolve,
                reject: reject
            });
            
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            
            try {
                // Add delay between requests to respect rate limits
                if (this.requestQueue.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const data = await this.fetchCareerData(request.socCode);
                this.cache.set(request.key, {
                    data: data,
                    timestamp: Date.now()
                });
                request.resolve(data);
                
            } catch (error) {
                console.error(`Failed to fetch data for ${request.socCode}:`, error);
                const fallbackData = this.getFallbackCareerData(request.socCode);
                this.cache.set(request.key, {
                    data: fallbackData,
                    timestamp: Date.now()
                });
                request.resolve(fallbackData);
            }
        }
        
        this.isProcessingQueue = false;
    }

    async fetchCareerData(socCode) {
        // Validate SOC code format
        if (!this.isValidSOCCode(socCode)) {
            throw new Error(`Invalid SOC code format: ${socCode}`);
        }

        const response = await fetch(
            `${this.baseURL}online/occupations/${socCode}/summary?format=json`,
            {
                headers: {
                    'Authorization': 'Basic ' + btoa(AppConfig.ONET_API_KEY + ':'),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid O*NET API credentials');
            } else if (response.status === 404) {
                throw new Error(`Career not found: ${socCode}`);
            } else {
                throw new Error(`O*NET API Error: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();
        
        return this.transformCareerData(data, socCode);
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
                level: s.level,
                category: s.category
            })) || [],
            knowledge: occupation.knowledge?.map(k => ({
                name: k.name,
                level: k.level,
                category: k.category
            })) || [],
            workActivities: occupation.work_activities?.map(w => ({
                activity: w.activity,
                importance: w.importance
            })) || [],
            workContext: occupation.work_context?.map(wc => ({
                context: wc.context,
                importance: wc.importance
            })) || [],
            interests: occupation.interests?.map(i => ({
                name: i.name,
                code: i.code,
                score: i.score
            })) || [],
            workStyles: occupation.work_styles?.map(ws => ({
                name: ws.name,
                importance: ws.importance
            })) || [],
            workValues: occupation.work_values?.map(wv => ({
                value: wv.value,
                importance: wv.importance
            })) || [],
            salary: {
                median: occupation.wages?.national_median || 0,
                hourly: occupation.wages?.median_hourly || 0,
                annual: occupation.wages?.median_annual || 0,
                range: occupation.wages?.range || {},
                percentiles: occupation.wages?.percentiles || {}
            },
            outlook: {
                growth: occupation.job_outlook?.growth_rate || 0,
                openings: occupation.job_outlook?.openings || 0,
                trend: occupation.job_outlook?.trend || 'Stable',
                employment: occupation.job_outlook?.employment || 0
            },
            education: occupation.education?.map(e => ({
                level: e.level,
                programs: e.programs || [],
                required: e.required || false
            })) || [],
            certifications: occupation.certifications || [],
            relatedCareers: occupation.related_careers || [],
            riasecCodes: occupation.interests?.map(i => i.code) || [],
            metadata: {
                socCode: socCode,
                updated: data.updated || new Date().toISOString(),
                source: 'O*NET'
            }
        };
    }

    async searchCareersByInterest(riasecCode, maxResults = 10) {
        // Validate RIASEC code
        const validCodes = ['R', 'I', 'A', 'S', 'E', 'C'];
        if (!validCodes.includes(riasecCode.toUpperCase())) {
            console.warn(`Invalid RIASEC code: ${riasecCode}`);
            return [];
        }

        try {
            const cacheKey = `search_${riasecCode}_${maxResults}`;
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.CAREER_DATA) {
                return cached.data;
            }

            const response = await fetch(
                `${this.baseURL}mnm/interestexplorer/careers?format=json&interest=${riasecCode}&max=${maxResults}`,
                {
                    headers: {
                        'Authorization': 'Basic ' + btoa(AppConfig.ONET_API_KEY + ':'),
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            const careers = data.careers || [];

            // Cache the results
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

    async getCareerSuggestions(riasecScores) {
        if (!riasecScores || typeof riasecScores !== 'object') {
            console.error('Invalid RIASEC scores provided');
            return [];
        }

        // Get top 2-3 RIASEC codes
        const topCodes = Object.entries(riasecScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .filter(([_, score]) => score > 20) // Filter low scores
            .map(([code]) => code);

        if (topCodes.length === 0) {
            return [];
        }

        const allSuggestions = [];
        
        // Fetch careers for each top interest
        for (const code of topCodes) {
            try {
                const careers = await this.searchCareersByInterest(code, 4);
                
                // Add match scores to each career
                const enhancedCareers = careers.map(career => ({
                    ...career,
                    primaryInterest: code,
                    matchScore: this.calculateMatchScore(career, riasecScores),
                    compatibility: this.calculateCompatibility(career, riasecScores)
                }));
                
                allSuggestions.push(...enhancedCareers);
                
            } catch (error) {
                console.warn(`Failed to get careers for interest ${code}:`, error);
                continue;
            }
        }

        // Remove duplicates, sort by match score, and limit results
        const uniqueSuggestions = Array.from(
            new Map(allSuggestions.map(item => [item.id || item.title, item])).values()
        );

        return uniqueSuggestions
            .sort((a, b) => {
                // Sort by match score, then by compatibility
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                return b.compatibility - a.compatibility;
            })
            .slice(0, 8);
    }

    calculateMatchScore(career, riasecScores) {
        if (!career.riasecCodes || career.riasecCodes.length === 0) {
            return 50; // Default score if no RIASEC codes
        }
        
        let totalScore = 0;
        let weightTotal = 0;
        
        career.riasecCodes.forEach(code => {
            const score = riasecScores[code] || 0;
            // Higher weight for primary interests
            const weight = code === career.primaryInterest ? 1.5 : 1;
            totalScore += score * weight;
            weightTotal += weight;
        });
        
        const averageScore = weightTotal > 0 ? totalScore / weightTotal : 0;
        
        // Normalize to 0-100 scale
        return Math.min(Math.round((averageScore / 100) * 100), 100);
    }

    calculateCompatibility(career, riasecScores) {
        // Calculate compatibility based on work styles and values
        let compatibilityScore = 50; // Base score
        
        // Add logic based on career data and user preferences
        // This would be expanded with actual user preference data
        
        return Math.min(compatibilityScore, 100);
    }

    isValidSOCCode(socCode) {
        // SOC codes are typically in format XX-XXXX or XX-XXXX.XX
        const socPattern = /^\d{2}-\d{4}(\.\d{2})?$/;
        return socPattern.test(socCode);
    }

    getFallbackCareerData(socCode) {
        // Enhanced fallback data
        const fallbackCareers = {
            '15-1252': {
                title: 'Software Developer',
                description: 'Develop applications and systems software. Analyze user needs and create software solutions.',
                skills: [
                    { name: 'Programming', importance: 95, level: 85, category: 'Technical' },
                    { name: 'Problem Solving', importance: 90, level: 80, category: 'Analytical' },
                    { name: 'Teamwork', importance: 80, level: 75, category: 'Interpersonal' },
                    { name: 'Communication', importance: 75, level: 70, category: 'Interpersonal' },
                    { name: 'Project Management', importance: 65, level: 60, category: 'Managerial' }
                ],
                knowledge: [
                    { name: 'Computer Science', level: 85, category: 'Technical' },
                    { name: 'Mathematics', level: 70, category: 'Analytical' }
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
                    annual: 110000,
                    range: { low: 65000, high: 160000 }
                },
                outlook: { 
                    growth: 22, 
                    openings: 200000, 
                    trend: 'Growing',
                    employment: 1469000
                },
                education: [
                    { level: "Bachelor's degree", required: true },
                    { level: "Master's degree", required: false }
                ],
                workStyles: [
                    { name: 'Analytical Thinking', importance: 90 },
                    { name: 'Attention to Detail', importance: 85 }
                ],
                metadata: {
                    socCode: '15-1252',
                    updated: new Date().toISOString(),
                    source: 'Fallback Data'
                }
            },
            '29-1141': {
                title: 'Registered Nurse',
                description: 'Provide and coordinate patient care, educate patients and the public about various health conditions.',
                skills: [
                    { name: 'Patient Care', importance: 98, level: 90, category: 'Clinical' },
                    { name: 'Communication', importance: 95, level: 85, category: 'Interpersonal' },
                    { name: 'Critical Thinking', importance: 90, level: 80, category: 'Analytical' },
                    { name: 'Empathy', importance: 85, level: 80, category: 'Interpersonal' },
                    { name: 'Medical Knowledge', importance: 90, level: 85, category: 'Clinical' }
                ],
                knowledge: [
                    { name: 'Medicine', level: 85, category: 'Clinical' },
                    { name: 'Psychology', level: 75, category: 'Interpersonal' }
                ],
                tasks: [
                    'Assess patient health problems and needs',
                    'Administer nursing care to ill, injured, or disabled patients',
                    'Advise patients on health maintenance and disease prevention',
                    'Coordinate patient care with other healthcare professionals'
                ],
                riasecCodes: ['S', 'I', 'C'],
                salary: { 
                    median: 77000, 
                    hourly: 37.02,
                    annual: 77000,
                    range: { low: 53000, high: 116000 }
                },
                outlook: { 
                    growth: 9, 
                    openings: 175000, 
                    trend: 'Growing',
                    employment: 3100000
                },
                education: [
                    { level: "Associate's degree", required: true },
                    { level: "Bachelor's degree", required: false }
                ],
                workStyles: [
                    { name: 'Integrity', importance: 95 },
                    { name: 'Stress Tolerance', importance: 90 }
                ],
                metadata: {
                    socCode: '29-1141',
                    updated: new Date().toISOString(),
                    source: 'Fallback Data'
                }
            },
            '13-1161': {
                title: 'Market Research Analyst',
                description: 'Research market conditions to examine potential sales of a product or service.',
                skills: [
                    { name: 'Data Analysis', importance: 90, level: 80, category: 'Analytical' },
                    { name: 'Statistical Analysis', importance: 85, level: 75, category: 'Analytical' },
                    { name: 'Communication', importance: 80, level: 75, category: 'Interpersonal' },
                    { name: 'Research', importance: 85, level: 80, category: 'Analytical' }
                ],
                riasecCodes: ['I', 'E', 'C'],
                salary: { median: 65000, hourly: 31.25 },
                outlook: { growth: 18, openings: 150000, trend: 'Growing' }
            }
        };

        return fallbackCareers[socCode] || {
            title: 'Career Information',
            description: 'Career data is currently unavailable. Please check your connection and try again later.',
            skills: [],
            riasecCodes: [],
            salary: { median: 0, hourly: 0, annual: 0, range: {} },
            outlook: { growth: 0, openings: 0, trend: 'Unknown', employment: 0 },
            education: [],
            metadata: {
                socCode: socCode,
                updated: new Date().toISOString(),
                source: 'Fallback Data - Not Found'
            }
        };
    }

    getFallbackSearchResults(riasecCode, maxResults) {
        const interestCareers = {
            'I': ['Software Developer', 'Data Scientist', 'Research Scientist', 'Physicist', 'Mathematician'],
            'R': ['Mechanical Engineer', 'Electrician', 'Carpenter', 'Civil Engineer', 'Aircraft Mechanic'],
            'A': ['Graphic Designer', 'Writer', 'Musician', 'Actor', 'Architect'],
            'S': ['Teacher', 'Counselor', 'Nurse', 'Social Worker', 'Psychologist'],
            'E': ['Sales Manager', 'Entrepreneur', 'Marketing Manager', 'Real Estate Agent', 'Business Executive'],
            'C': ['Accountant', 'Financial Analyst', 'Office Manager', 'Banker', 'Bookkeeper']
        };

        const careers = interestCareers[riasecCode] || interestCareers['I'];
        
        return careers.slice(0, maxResults).map((title, index) => ({
            id: `fallback_${riasecCode}_${index}`,
            title: title,
            description: `A career in ${title.toLowerCase()}.`,
            riasecCodes: [riasecCode],
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

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            oldest: this.cache.size > 0 ? 
                Math.min(...Array.from(this.cache.values()).map(v => v.timestamp)) : null
        };
    }
}

// ============================================
// 2. ENHANCED NEWS INTEGRATION MANAGER
// ============================================

class NewsIntegrationManager {
    constructor() {
        this.newsSources = {
            NEWSAPI: {
                baseURL: 'https://newsapi.org/v2/everything',
                apiKey: AppConfig.NEWS_API_KEY,
                priority: 1
            },
            MEDIASTACK: {
                baseURL: 'http://api.mediastack.com/v1/news',
                apiKey: AppConfig.MEDIASTACK_KEY,
                priority: 2
            },
            GNEWS: {
                baseURL: 'https://gnews.io/api/v4/search',
                apiKey: AppConfig.GNEWS_API_KEY,
                priority: 3
            }
        };
        this.cache = new Map();
        this.sourceAvailability = new Map();
        this.initializeSourceHealth();
    }

    initializeSourceHealth() {
        // Initialize all sources as available
        Object.keys(this.newsSources).forEach(source => {
            this.sourceAvailability.set(source, {
                available: true,
                lastChecked: Date.now(),
                failureCount: 0
            });
        });
    }

    async fetchCareerNews(keywords = ['career', 'jobs', 'employment', 'work'], limit = 8) {
        const cacheKey = `news_${keywords.sort().join('_')}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.NEWS_DATA) {
            console.log('Returning cached news');
            return cached.data;
        }

        let articles = [];
        let attemptedSources = 0;
        
        // Try sources in priority order
        const sources = Object.entries(this.newsSources)
            .sort((a, b) => a[1].priority - b[1].priority);

        for (const [sourceName, sourceConfig] of sources) {
            if (attemptedSources >= 2 && articles.length >= limit / 2) {
                break; // Stop if we have enough articles
            }

            const sourceHealth = this.sourceAvailability.get(sourceName);
            if (!sourceHealth.available && 
                Date.now() - sourceHealth.lastChecked < 300000) { // 5 minutes
                console.log(`Skipping ${sourceName} - marked as unavailable`);
                continue;
            }

            try {
                console.log(`Trying ${sourceName}...`);
                const sourceArticles = await this.fetchFromSource(sourceName, keywords, limit);
                
                if (sourceArticles && sourceArticles.length > 0) {
                    articles.push(...sourceArticles);
                    
                    // Mark source as available
                    this.sourceAvailability.set(sourceName, {
                        available: true,
                        lastChecked: Date.now(),
                        failureCount: 0
                    });
                }
                
                attemptedSources++;
                
            } catch (error) {
                console.warn(`${sourceName} failed:`, error.message);
                
                // Update source health
                const currentHealth = this.sourceAvailability.get(sourceName);
                this.sourceAvailability.set(sourceName, {
                    available: false,
                    lastChecked: Date.now(),
                    failureCount: currentHealth.failureCount + 1
                });
            }
        }

        // Deduplicate articles by title
        articles = this.deduplicateArticles(articles);
        
        // Sort by relevance and date
        articles.sort((a, b) => {
            if (b.relevance !== a.relevance) {
                return b.relevance - a.relevance;
            }
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });

        // If no articles, use sample data
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

    async fetchFromSource(sourceName, keywords, limit) {
        const source = this.newsSources[sourceName];
        
        switch(sourceName) {
            case 'NEWSAPI':
                return await this.fetchFromNewsAPI(keywords, limit, source);
            case 'MEDIASTACK':
                return await this.fetchFromMediastack(keywords, limit, source);
            case 'GNEWS':
                return await this.fetchFromGNews(keywords, limit, source);
            default:
                throw new Error(`Unknown source: ${sourceName}`);
        }
    }

    async fetchFromNewsAPI(keywords, limit, source) {
        const query = this.buildSearchQuery(keywords);
        const url = `${source.baseURL}?` +
            `q=${encodeURIComponent(query)}&` +
            `language=en&` +
            `sortBy=publishedAt&` +
            `pageSize=${limit}&` +
            `apiKey=${source.apiKey}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`NewsAPI: ${response.status}`);
        }

        const data = await response.json();
        
        return (data.articles || []).map(article => ({
            title: article.title,
            description: article.description,
            content: article.content,
            url: article.url,
            source: article.source?.name || 'Unknown Source',
            sourceDomain: this.extractDomain(article.url),
            image: article.urlToImage || this.getDefaultImage(article.source?.name),
            publishedAt: article.publishedAt,
            category: this.extractCategory(article),
            relevance: this.calculateRelevance(article, keywords),
            sentiment: this.analyzeSentiment(article),
            readTime: this.estimateReadTime(article)
        })).filter(article => 
            article.title && 
            article.description && 
            !article.title.includes('[Removed]')
        );
    }

    async fetchFromMediastack(keywords, limit, source) {
        const query = keywords.join(' ');
        const url = `${source.baseURL}?` +
            `access_key=${source.apiKey}&` +
            `keywords=${encodeURIComponent(query)}&` +
            `languages=en&` +
            `limit=${limit}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Mediastack: ${response.status}`);
        }

        const data = await response.json();
        
        return (data.data || []).map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source || 'Unknown Source',
            sourceDomain: this.extractDomain(article.url),
            image: article.image || this.getDefaultImage(article.source),
            publishedAt: article.published_at,
            category: article.category || 'general',
            relevance: this.calculateRelevance(article, keywords),
            sentiment: 'neutral',
            readTime: this.estimateReadTime(article)
        })).filter(article => article.title && article.description);
    }

    async fetchFromGNews(keywords, limit, source) {
        const query = keywords.join(' OR ');
        const url = `${source.baseURL}?` +
            `q=${encodeURIComponent(query)}&` +
            `lang=en&` +
            `max=${limit}&` +
            `apikey=${source.apiKey}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GNews: ${response.status}`);
        }

        const data = await response.json();
        
        return (data.articles || []).map(article => ({
            title: article.title,
            description: article.description,
            content: article.content,
            url: article.url,
            source: article.source?.name || 'Unknown Source',
            sourceDomain: this.extractDomain(article.url),
            image: article.image || this.getDefaultImage(article.source?.name),
            publishedAt: article.publishedAt,
            category: this.extractCategory(article),
            relevance: this.calculateRelevance(article, keywords),
            sentiment: this.analyzeSentiment(article),
            readTime: this.estimateReadTime(article)
        })).filter(article => article.title && article.description);
    }

    buildSearchQuery(keywords) {
        // Build an intelligent search query
        const careerTerms = ['career', 'job', 'employment', 'work', 'occupation'];
        const industryTerms = ['technology', 'healthcare', 'education', 'business', 'engineering'];
        
        const allKeywords = [...keywords, ...careerTerms];
        
        // Create OR query with quotes for exact matches
        return allKeywords
            .map(keyword => `"${keyword}"`)
            .join(' OR ');
    }

    deduplicateArticles(articles) {
        const seen = new Set();
        return articles.filter(article => {
            // Create a unique key from title and source
            const key = `${article.title.toLowerCase()}-${article.sourceDomain}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'unknown';
        }
    }

    extractCategory(article) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        
        const categories = {
            technology: ['tech', 'software', 'developer', 'programming', 'ai', 'machine learning', 'cybersecurity'],
            healthcare: ['health', 'medical', 'nurse', 'doctor', 'hospital', 'medicine', 'patient'],
            business: ['business', 'market', 'finance', 'economy', 'corporate', 'investment', 'stock'],
            education: ['education', 'student', 'teacher', 'school', 'university', 'learning', 'degree'],
            remote: ['remote', 'work from home', 'wfh', 'telecommute', 'distributed', 'virtual'],
            career: ['career', 'job', 'employment', 'hiring', 'recruitment', 'interview', 'resume']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }

        return 'general';
    }

    calculateRelevance(article, keywords) {
        const text = (article.title + ' ' + article.description + ' ' + (article.content || '')).toLowerCase();
        let score = 0;
        
        keywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            if (text.includes(keywordLower)) {
                // Higher score for title matches
                if (article.title.toLowerCase().includes(keywordLower)) {
                    score += 3;
                } else if (article.description.toLowerCase().includes(keywordLower)) {
                    score += 2;
                } else {
                    score += 1;
                }
            }
        });
        
        // Normalize score
        const maxPossibleScore = keywords.length * 3;
        return maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 50;
    }

    analyzeSentiment(article) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        const positiveWords = ['growth', 'hire', 'opportunity', 'success', 'expand', 'increase', 'rise'];
        const negativeWords = ['layoff', 'cut', 'decline', 'down', 'recession', 'crisis', 'fire'];
        
        let sentiment = 0;
        
        positiveWords.forEach(word => {
            if (text.includes(word)) sentiment++;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) sentiment--;
        });
        
        if (sentiment > 0) return 'positive';
        if (sentiment < 0) return 'negative';
        return 'neutral';
    }

    estimateReadTime(article) {
        const words = (article.content || article.description || '').split(/\s+/).length;
        const readTimeMinutes = Math.ceil(words / 200); // 200 words per minute
        return Math.min(readTimeMinutes, 10); // Cap at 10 minutes
    }

    getDefaultImage(sourceName) {
        // Use Unsplash images with career/work themes
        const defaultImages = [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1573164713714-d95e436ab234?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
        ];
        
        // Hash the source name to pick a consistent image
        let hash = 0;
        for (let i = 0; i < (sourceName || '').length; i++) {
            hash = ((hash << 5) - hash) + sourceName.charCodeAt(i);
            hash = hash & hash;
        }
        
        const index = Math.abs(hash) % defaultImages.length;
        return defaultImages[index];
    }

    getSampleCareerNews() {
        return [
            {
                title: 'Tech Industry Sees Record Hiring in 2024',
                description: 'Software development and AI roles lead the growth with 20% increase in job postings.',
                url: '#',
                source: 'Tech Careers Digest',
                sourceDomain: 'techcareers.com',
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                relevance: 95,
                sentiment: 'positive',
                readTime: 3
            },
            {
                title: 'Remote Work Becoming Permanent Fixture',
                description: '65% of companies now offer remote or hybrid work options, transforming career opportunities.',
                url: '#',
                source: 'Remote Work Insights',
                sourceDomain: 'remotework.com',
                image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                category: 'remote',
                relevance: 88,
                sentiment: 'positive',
                readTime: 4
            },
            {
                title: 'Healthcare Sector Adds 50,000 New Positions',
                description: 'Nursing and healthcare administration see unprecedented growth nationwide.',
                url: '#',
                source: 'Healthcare Employment Report',
                sourceDomain: 'healthcarejobs.com',
                image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 172800000).toISOString(),
                category: 'healthcare',
                relevance: 85,
                sentiment: 'positive',
                readTime: 3
            },
            {
                title: 'Data Science Careers Continue to Expand',
                description: 'New report shows 30% growth in data-related roles across all industries.',
                url: '#',
                source: 'Data Career Weekly',
                sourceDomain: 'datacareers.com',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
                publishedAt: new Date(Date.now() - 259200000).toISOString(),
                category: 'technology',
                relevance: 92,
                sentiment: 'positive',
                readTime: 5
            }
        ];
    }

    clearCache() {
        this.cache.clear();
        console.log('News cache cleared');
    }

    getSourceHealth() {
        return Array.from(this.sourceAvailability.entries()).map(([source, health]) => ({
            source,
            available: health.available,
            lastChecked: new Date(health.lastChecked).toLocaleString(),
            failureCount: health.failureCount
        }));
    }
}

// ============================================
// 3. ENHANCED JOB MARKET MANAGER
// ============================================

class JobMarketManager {
    constructor() {
        this.config = {
            ADZUNA: {
                baseURL: 'https://api.adzuna.com/v1/api/jobs',
                appId: AppConfig.ADZUNA_APP_ID,
                appKey: AppConfig.ADZUNA_APP_KEY,
                countries: ['us', 'gb', 'ca', 'au', 'nz']
            },
            REMOTIVE: {
                baseURL: 'https://remotive.com/api/remote-jobs',
                categories: [
                    'software-dev', 'customer-support', 'sales', 
                    'marketing', 'design', 'product'
                ]
            }
        };
        this.cache = new Map();
        this.jobCategories = this.initializeJobCategories();
    }

    initializeJobCategories() {
        return {
            'software-dev': ['Software Developer', 'Web Developer', 'Mobile Developer', 'DevOps Engineer'],
            'healthcare': ['Nurse', 'Doctor', 'Medical Assistant', 'Healthcare Administrator'],
            'business': ['Business Analyst', 'Project Manager', 'Marketing Manager', 'Sales Executive'],
            'design': ['Graphic Designer', 'UX Designer', 'UI Designer', 'Product Designer'],
            'education': ['Teacher', 'Professor', 'Educational Consultant', 'Curriculum Developer'],
            'engineering': ['Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Software Engineer']
        };
    }

    async fetchJobsByCareer(careerTitle, location = 'us', limit = 10) {
        const cacheKey = `jobs_${careerTitle}_${location}_${limit}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            console.log(`Returning cached jobs for ${careerTitle}`);
            return cached.data;
        }

        let jobs = [];
        const errors = [];
        
        try {
            // Try Adzuna first
            const adzunaJobs = await this.fetchAdzunaJobs(careerTitle, location, Math.ceil(limit * 0.7));
            if (adzunaJobs.length > 0) {
                jobs.push(...adzunaJobs);
            }
        } catch (error) {
            errors.push(`Adzuna: ${error.message}`);
            console.warn('Adzuna API failed:', error);
        }
        
        // If we don't have enough jobs, try Remotive for remote positions
        if (jobs.length < limit) {
            try {
                const remaining = limit - jobs.length;
                const remoteJobs = await this.fetchRemotiveJobs(careerTitle, remaining);
                if (remoteJobs.length > 0) {
                    jobs.push(...remoteJobs);
                }
            } catch (error) {
                errors.push(`Remotive: ${error.message}`);
                console.warn('Remotive API failed:', error);
            }
        }
        
        // If still no jobs, check for related categories
        if (jobs.length === 0) {
            const relatedCategories = this.findRelatedCategories(careerTitle);
            for (const category of relatedCategories.slice(0, 2)) {
                if (jobs.length >= limit) break;
                
                try {
                    const categoryJobs = await this.fetchAdzunaJobs(category, location, 3);
                    jobs.push(...categoryJobs);
                } catch (error) {
                    // Continue to next category
                }
            }
        }
        
        // Final fallback to sample data
        if (jobs.length === 0) {
            console.log('Using sample job data');
            jobs = this.getSampleJobs(careerTitle, limit);
        }
        
        // Enhance job data with additional information
        jobs = jobs.map(job => this.enhanceJobData(job));
        
        // Remove duplicates and sort by date
        jobs = this.deduplicateJobs(jobs);
        jobs.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        const finalJobs = jobs.slice(0, limit);
        
        // Cache results
        this.cache.set(cacheKey, {
            data: finalJobs,
            timestamp: Date.now(),
            sourceCount: {
                adzuna: jobs.filter(j => j.source === 'adzuna').length,
                remotive: jobs.filter(j => j.source === 'remotive').length,
                sample: jobs.filter(j => j.source === 'sample').length
            }
        });
        
        if (errors.length > 0) {
            console.warn('Job fetch completed with errors:', errors);
        }
        
        return finalJobs;
    }

    async fetchAdzunaJobs(careerTitle, location, limit) {
        const url = `${this.config.ADZUNA.baseURL}/${location}/search/1?` +
            `app_id=${this.config.ADZUNA.appId}&` +
            `app_key=${this.config.ADZUNA.appKey}&` +
            `what=${encodeURIComponent(careerTitle)}&` +
            `results_per_page=${limit}&` +
            `content-type=application/json&` +
            `sort_by=date`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Adzuna API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return (data.results || []).map(job => ({
            id: `adzuna_${job.id}`,
            title: job.title,
            company: job.company?.display_name || job.company?.name || 'Unknown Company',
            company_logo: job.company?.logo,
            location: job.location?.display_name || job.location?.area || 'Location not specified',
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_is_predicted: job.salary_is_predicted,
            salary_currency: job.salary_currency || 'USD',
            created: job.created,
            contract_type: job.contract_type,
            category: job.category?.label,
            redirect_url: job.redirect_url,
            is_remote: job.remote_working === true,
            latitude: job.latitude,
            longitude: job.longitude,
            source: 'adzuna',
            raw_data: job
        }));
    }

    async fetchRemotiveJobs(careerTitle, limit) {
        const url = `${this.config.REMOTIVE.baseURL}?` +
            `search=${encodeURIComponent(careerTitle)}&` +
            `limit=${limit}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Remotive API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return (data.jobs || []).map(job => ({
            id: `remotive_${job.id}`,
            title: job.title,
            company: job.company_name,
            company_logo: job.company_logo,
            location: 'Remote',
            description: job.description,
            salary: job.salary,
            salary_currency: job.salary_currency || 'USD',
            created: job.publication_date,
            url: job.url,
            category: job.category,
            tags: job.tags,
            job_type: job.job_type,
            is_remote: true,
            source: 'remotive',
            raw_data: job
        }));
    }

    findRelatedCategories(careerTitle) {
        const titleLower = careerTitle.toLowerCase();
        const related = [];
        
        for (const [category, keywords] of Object.entries(this.jobCategories)) {
            if (keywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
                related.push(category);
            }
        }
        
        return related.length > 0 ? related : ['software-dev', 'business'];
    }

    enhanceJobData(job) {
        // Calculate estimated salary if not provided
        if (!job.salary_min && !job.salary_max && !job.salary) {
            const estimatedSalary = this.estimateSalary(job.title, job.category);
            job.estimated_salary = estimatedSalary;
            job.salary_min = estimatedSalary.min;
            job.salary_max = estimatedSalary.max;
        }
        
        // Extract skills from description
        job.extracted_skills = this.extractSkillsFromDescription(job.description);
        
        // Calculate job seniority level
        job.seniority = this.determineSeniority(job.title);
        
        // Add application tracking
        job.application_url = job.redirect_url || job.url || '#';
        job.applied = false;
        job.saved = false;
        
        return job;
    }

    estimateSalary(jobTitle, category) {
        const titleLower = jobTitle.toLowerCase();
        
        // Salary estimates by role type
        const salaryRanges = {
            'senior': { min: 90000, max: 160000 },
            'lead': { min: 110000, max: 200000 },
            'principal': { min: 130000, max: 250000 },
            'junior': { min: 45000, max: 70000 },
            'entry': { min: 40000, max: 60000 },
            'associate': { min: 50000, max: 80000 },
            'default': { min: 60000, max: 100000 }
        };
        
        // Category adjustments
        const categoryMultipliers = {
            'software-dev': 1.2,
            'healthcare': 1.1,
            'business': 1.0,
            'design': 0.9,
            'education': 0.8,
            'engineering': 1.15
        };
        
        // Determine base range
        let range = salaryRanges.default;
        for (const [level, levelRange] of Object.entries(salaryRanges)) {
            if (titleLower.includes(level)) {
                range = levelRange;
                break;
            }
        }
        
        // Apply category multiplier
        const multiplier = categoryMultipliers[category] || 1.0;
        const min = Math.round(range.min * multiplier);
        const max = Math.round(range.max * multiplier);
        
        return { min, max, currency: 'USD' };
    }

    extractSkillsFromDescription(description) {
        if (!description) return [];
        
        const commonSkills = [
            'JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue', 'Node.js',
            'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'SQL', 'NoSQL',
            'Agile', 'Scrum', 'Project Management', 'Communication', 'Leadership',
            'Data Analysis', 'Machine Learning', 'AI', 'Cybersecurity', 'DevOps'
        ];
        
        const descriptionLower = description.toLowerCase();
        return commonSkills.filter(skill => 
            descriptionLower.includes(skill.toLowerCase())
        );
    }

    determineSeniority(jobTitle) {
        const titleLower = jobTitle.toLowerCase();
        
        if (titleLower.includes('senior') || titleLower.includes('sr.')) return 'Senior';
        if (titleLower.includes('lead') || titleLower.includes('principal')) return 'Lead';
        if (titleLower.includes('manager') || titleLower.includes('director')) return 'Management';
        if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('graduate')) return 'Junior';
        if (titleLower.includes('mid') || titleLower.includes('experienced')) return 'Mid-level';
        
        return 'Not specified';
    }

    deduplicateJobs(jobs) {
        const seen = new Set();
        return jobs.filter(job => {
            // Create unique key from title, company, and location
            const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}-${job.location.toLowerCase()}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    async getJobMarketTrends(careerField) {
        const cacheKey = `trends_${careerField}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < AppConfig.CACHE_TTL.JOB_DATA) {
            return cached.data;
        }

        try {
            // Fetch recent jobs for analysis
            const jobs = await this.fetchJobsByCareer(careerField, 'us', 20);
            
            const trends = {
                totalJobs: jobs.length,
                averageSalary: this.calculateAverageSalary(jobs),
                remotePercentage: this.calculateRemotePercentage(jobs),
                topCompanies: this.extractTopCompanies(jobs, 5),
                topLocations: this.extractTopLocations(jobs, 5),
                recentPostings: this.getRecentPostings(jobs, 7),
                demandLevel: this.calculateDemandLevel(jobs.length),
                skillFrequency: this.analyzeSkillsFrequency(jobs),
                growthTrend: this.calculateGrowthTrend(jobs)
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
        const validSalaries = jobs.filter(j => 
            (j.salary_min && j.salary_max) || j.estimated_salary
        ).map(j => {
            if (j.salary_min && j.salary_max) {
                return (j.salary_min + j.salary_max) / 2;
            }
            if (j.estimated_salary) {
                return (j.estimated_salary.min + j.estimated_salary.max) / 2;
            }
            return 0;
        }).filter(salary => salary > 0);
        
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
                const company = job.company.trim();
                companyCount[company] = (companyCount[company] || 0) + 1;
            }
        });
        
        return Object.entries(companyCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([company, count]) => ({ company, count, percentage: Math.round((count / jobs.length) * 100) }));
    }

    extractTopLocations(jobs, limit) {
        const locationCount = {};
        jobs.forEach(job => {
            if (job.location && job.location !== 'Location not specified') {
                const location = job.location.trim();
                locationCount[location] = (locationCount[location] || 0) + 1;
            }
        });
        
        return Object.entries(locationCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([location, count]) => ({ location, count }));
    }

    getRecentPostings(jobs, days) {
        const cutoff = new Date(Date.now() - days * 86400000);
        return jobs.filter(job => new Date(job.created) > cutoff).length;
    }

    calculateDemandLevel(jobCount) {
        if (jobCount > 100) return { level: 'Very High', color: 'success', score: 5 };
        if (jobCount > 50) return { level: 'High', color: 'primary', score: 4 };
        if (jobCount > 20) return { level: 'Moderate', color: 'info', score: 3 };
        if (jobCount > 5) return { level: 'Low', color: 'warning', score: 2 };
        return { level: 'Very Low', color: 'secondary', score: 1 };
    }

    analyzeSkillsFrequency(jobs) {
        const skillFrequency = {};
        jobs.forEach(job => {
            if (job.extracted_skills) {
                job.extracted_skills.forEach(skill => {
                    skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
                });
            }
        });
        
        return Object.entries(skillFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / jobs.length) * 100) }));
    }

    calculateGrowthTrend(jobs) {
        // This would ideally compare with historical data
        // For now, we'll simulate based on job recency
        const recentJobs = jobs.filter(job => {
            const jobDate = new Date(job.created);
            const weekAgo = new Date(Date.now() - 7 * 86400000);
            return jobDate > weekAgo;
        });
        
        const growthRate = jobs.length > 0 ? (recentJobs.length / jobs.length) * 100 : 0;
        
        if (growthRate > 30) return 'Rapid Growth';
        if (growthRate > 15) return 'Steady Growth';
        if (growthRate > 0) return 'Slow Growth';
        return 'Stable';
    }

    getSampleJobs(careerTitle, limit) {
        const baseJobs = [
            {
                id: 'sample_1',
                title: `Senior ${careerTitle}`,
                company: 'Tech Innovations Inc.',
                location: 'San Francisco, CA',
                description: `Exciting opportunity for a Senior ${careerTitle} to join our innovative team. We're looking for someone with strong experience in the field.`,
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
                description: `Join our distributed team as a ${careerTitle}. We offer flexible hours and a great work-life balance.`,
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
                description: `Entry-level position for aspiring ${careerTitle.toLowerCase()}s. Great learning opportunity with mentorship.`,
                salary_min: 50000,
                salary_max: 70000,
                created: new Date(Date.now() - 172800000).toISOString(),
                category: 'Technology',
                is_remote: false,
                source: 'sample'
            }
        ];
        
        return baseJobs.slice(0, limit);
    }

    getSampleTrends(careerField) {
        return {
            totalJobs: 15,
            averageSalary: 85000,
            remotePercentage: 60,
            topCompanies: [
                { company: 'Tech Corp', count: 3, percentage: 20 },
                { company: 'Innovate Ltd', count: 2, percentage: 13 }
            ],
            topLocations: [
                { location: 'Remote', count: 9 },
                { location: 'San Francisco', count: 3 }
            ],
            recentPostings: 8,
            demandLevel: { level: 'Moderate', color: 'info', score: 3 },
            skillFrequency: [
                { skill: 'Communication', count: 12, percentage: 80 },
                { skill: 'Problem Solving', count: 10, percentage: 67 }
            ],
            growthTrend: 'Steady Growth'
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('Job cache cleared');
    }

    getCacheStats() {
        const cacheEntries = Array.from(this.cache.entries());
        return {
            totalEntries: cacheEntries.length,
            jobEntries: cacheEntries.filter(([key]) => key.startsWith('jobs_')).length,
            trendEntries: cacheEntries.filter(([key]) => key.startsWith('trends_')).length,
            oldestEntry: cacheEntries.length > 0 ? 
                new Date(Math.min(...cacheEntries.map(([, value]) => value.timestamp))) : null
        };
    }
}

// ============================================
// 4. ENHANCED DASHBOARD ENHANCEMENT MANAGER
// ============================================

class DashboardEnhancementManager {
    constructor() {
        this.onetAPI = new OnetAPIManager();
        this.newsManager = new NewsIntegrationManager();
        this.jobMarket = new JobMarketManager();
        this.performance = new PerformanceOptimizer();
        this.initialized = false;
        this.charts = new Map();
    }

    async initializeDashboard() {
        if (!AppState.currentUser) {
            this.showLoginPrompt();
            return;
        }
        
        if (this.initialized) {
            console.log('Dashboard already initialized');
            return;
        }
        
        console.log('Initializing enhanced dashboard...');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load all dashboard components with error handling
            await Promise.allSettled([
                this.loadUserProfile(),
                this.loadCareerInsights(),
                this.loadJobMarketData(),
                this.loadCareerNews(),
                this.loadUserProgress(),
                this.loadQuickActions(),
                this.loadPersonalizedRecommendations()
            ]);
            
            // Initialize charts after data is loaded
            this.initializeCharts();
            
            // Update UI state
            this.updateDashboardUI();
            
            // Add required attribution
            this.onetAPI.addAttribution('career-data-container');
            
            // Mark as initialized
            this.initialized = true;
            this.hideLoadingState();
            
            // Start auto-refresh timer (every 5 minutes)
            this.startAutoRefresh(5 * 60 * 1000);
            
            console.log('Dashboard initialization complete');
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showErrorState(error);
            this.hideLoadingState();
        }
    }

    async loadUserProfile() {
        try {
            const userDoc = await FirebaseServices.db
                .collection('users')
                .doc(AppState.currentUser.uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                AppState.userProfile = userData;
                
                // Update UI with user data
                this.updateUserProfileUI(userData);
                
                // Store in localStorage for offline use
                localStorage.setItem('userProfile', JSON.stringify(userData));
            }
        } catch (error) {
            console.warn('Could not load user profile:', error);
            // Try to load from localStorage
            const cachedProfile = localStorage.getItem('userProfile');
            if (cachedProfile) {
                AppState.userProfile = JSON.parse(cachedProfile);
                this.updateUserProfileUI(AppState.userProfile);
            }
        }
    }

    async loadCareerInsights() {
        try {
            const insightsContainer = document.getElementById('career-insights-container');
            if (!insightsContainer) return;
            
            // Check for recent assessment
            const assessmentsSnapshot = await FirebaseServices.db
                .collection('assessment_results')
                .where('userId', '==', AppState.currentUser.uid)
                .orderBy('completedAt', 'desc')
                .limit(1)
                .get();
            
            if (!assessmentsSnapshot.empty) {
                const latestAssessment = assessmentsSnapshot.docs[0].data();
                const riasecScores = latestAssessment.scores || {};
                
                // Get career suggestions
                const suggestions = await this.onetAPI.getCareerSuggestions(riasecScores);
                
                if (suggestions.length > 0) {
                    this.updateCareerInsights(suggestions.slice(0, 3));
                } else {
                    this.showNoInsightsMessage();
                }
                
                // Update assessment summary
                this.updateAssessmentSummary(latestAssessment);
                
            } else {
                this.showFirstAssessmentPrompt();
            }
        } catch (error) {
            console.error('Error loading career insights:', error);
            this.showInsightsError();
        }
    }

    async loadJobMarketData() {
        try {
            const interests = AppState.userProfile?.careerInterests || 
                             ['software developer', 'data analyst', 'project manager'];
            
            const marketPromises = interests.slice(0, 3).map(interest =>
                this.jobMarket.getJobMarketTrends(interest)
            );
            
            const marketData = await Promise.allSettled(marketPromises);
            
            const validData = marketData
                .filter(result => result.status === 'fulfilled' && result.value)
                .map(result => result.value);
            
            if (validData.length > 0) {
                this.updateJobMarketWidget(validData);
            } else {
                this.showJobMarketError();
            }
        } catch (error) {
            console.error('Error loading job market data:', error);
        }
    }

    async loadCareerNews() {
        try {
            // Get interests from user profile or use defaults
            const interests = AppState.userProfile?.careerInterests || 
                             ['career development', 'job market', 'professional skills'];
            
            // Add specific career interests
            if (AppState.userProfile?.careerGoals) {
                interests.push(...AppState.userProfile.careerGoals.slice(0, 2));
            }
            
            const news = await this.newsManager.fetchCareerNews(interests, 6);
            
            if (news && news.length > 0) {
                this.updateNewsWidget(news);
            } else {
                this.showNewsError();
            }
        } catch (error) {
            console.error('Error loading career news:', error);
        }
    }

    async loadUserProgress() {
        try {
            const assessmentsSnapshot = await FirebaseServices.db
                .collection('assessment_results')
                .where('userId', '==', AppState.currentUser.uid)
                .orderBy('completedAt', 'desc')
                .get();
            
            const assessments = assessmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Update progress metrics
            this.updateProgressMetrics(assessments);
            
            // Update recent activity
            this.updateRecentActivity(assessments.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading user progress:', error);
            // Use cached data if available
            const cachedAssessments = localStorage.getItem('userAssessments');
            if (cachedAssessments) {
                this.updateProgressMetrics(JSON.parse(cachedAssessments));
            }
        }
    }

    async loadQuickActions() {
        const actions = [
            {
                title: 'Take Assessment',
                description: 'Complete a new career assessment',
                icon: 'bi-clipboard-check',
                action: () => window.location.href = 'assessment.html',
                color: 'primary'
            },
            {
                title: 'Explore Careers',
                description: 'Browse career options',
                icon: 'bi-search',
                action: () => window.location.href = 'careers.html',
                color: 'success'
            },
            {
                title: 'Update Profile',
                description: 'Edit your preferences',
                icon: 'bi-person-circle',
                action: () => this.showProfileModal(),
                color: 'info'
            },
            {
                title: 'Saved Jobs',
                description: 'View saved positions',
                icon: 'bi-bookmark',
                action: () => window.location.href = 'jobs.html?saved=true',
                color: 'warning'
            }
        ];
        
        this.updateQuickActions(actions);
    }

    async loadPersonalizedRecommendations() {
        try {
            // Get user's interests and skills
            const userInterests = AppState.userProfile?.careerInterests || [];
            const userSkills = AppState.userProfile?.skills || [];
            
            if (userInterests.length === 0) return;
            
            // Get recommendations based on interests
            const recommendations = [];
            
            // Career recommendations
            if (userInterests.length > 0) {
                const careerRecs = await this.onetAPI.searchCareersByInterest(
                    userInterests[0].charAt(0).toUpperCase(), // First letter as RIASEC code
                    3
                );
                recommendations.push(...careerRecs.map(career => ({
                    type: 'career',
                    title: career.title,
                    description: 'Based on your interests',
                    match: Math.floor(Math.random() * 30) + 70 // 70-100%
                })));
            }
            
            // Learning recommendations
            const learningRecs = [
                {
                    type: 'course',
                    title: 'Advanced JavaScript',
                    description: 'Improve your coding skills',
                    platform: 'Coursera',
                    match: 85
                },
                {
                    type: 'certification',
                    title: 'Project Management Professional',
                    description: 'Boost your career prospects',
                    platform: 'PMI',
                    match: 78
                }
            ];
            recommendations.push(...learningRecs);
            
            this.updateRecommendations(recommendations.slice(0, 4));
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    updateUserProfileUI(userData) {
        // Update user name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && userData.name) {
            userNameElement.textContent = userData.name;
            document.title = `${userData.name}'s Career Dashboard`;
        }
        
        // Update user avatar
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && userData.avatar) {
            userAvatar.src = userData.avatar;
        } else if (userAvatar && userData.name) {
            // Generate initials avatar
            const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
            userAvatar.textContent = initials;
            userAvatar.classList.add('avatar-initials');
        }
        
        // Update profile completion
        const profileCompletion = this.calculateProfileCompletion(userData);
        const completionElement = document.getElementById('profile-completion');
        if (completionElement) {
            completionElement.style.width = `${profileCompletion}%`;
            completionElement.textContent = `${profileCompletion}%`;
        }
    }

    updateCareerInsights(careers) {
        const container = document.getElementById('career-insights-container');
        if (!container) return;
        
        if (careers && careers.length > 0) {
            container.innerHTML = `
                <div class="row g-3">
                    ${careers.map((career, index) => `
                        <div class="col-md-4">
                            <div class="card h-100 border-0 shadow-sm hover-lift">
                                <div class="card-body position-relative">
                                    <div class="position-absolute top-0 end-0 mt-2 me-2">
                                        <span class="badge bg-primary bg-opacity-10 text-primary">
                                            #${index + 1}
                                        </span>
                                    </div>
                                    <h6 class="card-title text-truncate" title="${career.title}">
                                        ${career.title}
                                    </h6>
                                    <div class="mb-2">
                                        <small class="text-muted">Match: ${career.matchScore || 'N/A'}%</small>
                                        <div class="progress" style="height: 4px;">
                                            <div class="progress-bar bg-success" 
                                                 style="width: ${career.matchScore || 0}%">
                                            </div>
                                        </div>
                                    </div>
                                    <p class="card-text small text-muted line-clamp-2">
                                        ${career.description?.substring(0, 120) || 'Explore this career path'}...
                                    </p>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            ${career.riasecCodes?.map(code => `
                                                <span class="badge bg-light text-dark border me-1">${code}</span>
                                            `).join('')}
                                        </div>
                                        <button class="btn btn-sm btn-outline-primary" 
                                                onclick="viewCareerDetails('${career.id || career.title}')"
                                                data-bs-toggle="tooltip" 
                                                title="View details">
                                            <i class="bi bi-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Initialize tooltips
            this.initializeTooltips();
            
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-lightbulb display-4 text-muted opacity-50"></i>
                    <p class="mt-3 text-muted">Complete an assessment to get personalized career insights</p>
                    <a href="assessment.html" class="btn btn-primary">
                        <i class="bi bi-clipboard-check me-2"></i>Take Assessment
                    </a>
                </div>
            `;
        }
    }

    updateAssessmentSummary(assessment) {
        const summaryContainer = document.getElementById('assessment-summary');
        if (!summaryContainer) return;
        
        const topInterests = Object.entries(assessment.scores || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([code, score]) => ({ code, score }));
        
        summaryContainer.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="card-title mb-3">
                        <i class="bi bi-clipboard-data me-2"></i>Latest Assessment
                    </h6>
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted d-block">Date</small>
                            <strong>${new Date(assessment.completedAt).toLocaleDateString()}</strong>
                        </div>
                        <div class="col-6">
                            <small class="text-muted d-block">Type</small>
                            <strong>${assessment.assessmentType || 'RIASEC'}</strong>
                        </div>
                    </div>
                    ${topInterests.length > 0 ? `
                        <div class="mt-3">
                            <small class="text-muted d-block mb-1">Top Interests</small>
                            <div>
                                ${topInterests.map(interest => `
                                    <span class="badge bg-primary bg-opacity-10 text-primary me-1">
                                        ${interest.code}: ${interest.score}%
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="mt-3">
                        <a href="assessment.html?result=${assessment.id}" class="btn btn-sm btn-outline-primary w-100">
                            View Full Results
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    updateJobMarketWidget(marketData) {
        const container = document.getElementById('job-market-widget');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="bi bi-graph-up me-2"></i>Market Trends
                    </h6>
                    <button class="btn btn-sm btn-link text-muted" onclick="refreshMarketData()" title="Refresh">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
                <div class="card-body">
                    ${marketData.map((data, index) => {
                        const demand = data.demandLevel || this.jobMarket.calculateDemandLevel(data.totalJobs || 0);
                        return `
                            <div class="mb-3 ${index < marketData.length - 1 ? 'pb-2 border-bottom' : ''}">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong class="text-truncate pe-2" title="${data.field || 'Unknown Field'}">
                                        ${data.field || 'Unknown Field'}
                                    </strong>
                                    <span class="badge bg-${demand.color || 'secondary'}">
                                        ${demand.level || 'Unknown'}
                                    </span>
                                </div>
                                <div class="row small text-muted">
                                    <div class="col-6">
                                        <i class="bi bi-briefcase me-1"></i> ${data.totalJobs || 0} jobs
                                    </div>
                                    <div class="col-6 text-end">
                                        <i class="bi bi-cash-coin me-1"></i> 
                                        $${(data.averageSalary || 0).toLocaleString()}
                                    </div>
                                </div>
                                ${data.remotePercentage > 0 ? `
                                    <div class="small text-muted mt-1">
                                        <i class="bi bi-house me-1"></i> ${data.remotePercentage}% remote
                                    </div>
                                ` : ''}
                                ${data.growthTrend ? `
                                    <div class="small text-muted mt-1">
                                        <i class="bi bi-arrow-up-right me-1"></i> ${data.growthTrend}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    updateNewsWidget(news) {
        const container = document.getElementById('news-widget');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="bi bi-newspaper me-2"></i>Career News
                    </h5>
                    <div>
                        <small class="text-muted me-2">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        <button class="btn btn-sm btn-link text-muted" onclick="refreshNews()" title="Refresh">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        ${news.map(article => `
                            <div class="col-md-6">
                                <div class="card h-100 border-0 shadow-sm hover-lift">
                                    ${article.image ? `
                                        <img src="${article.image}" 
                                             class="card-img-top" 
                                             style="height: 150px; object-fit: cover;"
                                             alt="${article.title}"
                                             onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop'">
                                    ` : ''}
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="card-title mb-0 text-truncate" title="${article.title}">
                                                ${article.title}
                                            </h6>
                                            ${article.sentiment === 'positive' ? `
                                                <span class="badge bg-success bg-opacity-10 text-success ms-2">
                                                    <i class="bi bi-arrow-up-right"></i>
                                                </span>
                                            ` : ''}
                                        </div>
                                        <p class="card-text small text-muted line-clamp-2">${article.description}</p>
                                        <div class="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                                <small class="text-muted">${article.source}</small>
                                                ${article.readTime ? `
                                                    <small class="text-muted ms-2">
                                                        <i class="bi bi-clock"></i> ${article.readTime} min
                                                    </small>
                                                ` : ''}
                                            </div>
                                            <a href="${article.url}" target="_blank" 
                                               class="btn btn-sm btn-outline-primary" 
                                               data-bs-toggle="tooltip" 
                                               title="Read article">
                                                <i class="bi bi-box-arrow-up-right"></i>
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
        
        this.initializeTooltips();
    }

    updateProgressMetrics(assessments) {
        const metricsContainer = document.getElementById('progress-metrics');
        if (!metricsContainer) return;
        
        const totalAssessments = assessments.length;
        const savedCareers = AppState.userProfile?.savedCareers?.length || 0;
        
        // Calculate average match score
        let totalMatch = 0;
        let scoredAssessments = 0;
        
        assessments.forEach(assessment => {
            const scores = assessment.scores || {};
            const scoreValues = Object.values(scores);
            if (scoreValues.length > 0) {
                const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
                totalMatch += avgScore;
                scoredAssessments++;
            }
        });
        
        const avgMatch = scoredAssessments > 0 ? Math.round(totalMatch / scoredAssessments) : 0;
        
        metricsContainer.innerHTML = `
            <div class="row text-center">
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <i class="bi bi-clipboard-check display-5 text-primary mb-2"></i>
                            <h3 class="mb-1">${totalAssessments}</h3>
                            <p class="text-muted mb-0">Assessments</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <i class="bi bi-bookmark-check display-5 text-success mb-2"></i>
                            <h3 class="mb-1">${savedCareers}</h3>
                            <p class="text-muted mb-0">Saved Careers</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <i class="bi bi-graph-up display-5 text-info mb-2"></i>
                            <h3 class="mb-1">${avgMatch}%</h3>
                            <p class="text-muted mb-0">Avg. Match</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        if (activities.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>Recent Activity
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            ${activities.map((activity, index) => `
                                <div class="timeline-item ${index < activities.length - 1 ? 'mb-3' : ''}">
                                    <div class="d-flex">
                                        <div class="flex-shrink-0">
                                            <div class="timeline-icon bg-primary bg-opacity-10 text-primary">
                                                <i class="bi ${activity.type === 'assessment' ? 'bi-clipboard-check' : 'bi-bookmark'}"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-0">${activity.title || 'Activity'}</h6>
                                            <p class="small text-muted mb-1">
                                                ${new Date(activity.completedAt || activity.timestamp).toLocaleDateString()}
                                            </p>
                                            ${activity.scores ? `
                                                <div class="small">
                                                    ${Object.entries(activity.scores)
                                                        .slice(0, 2)
                                                        .map(([code, score]) => `
                                                            <span class="badge bg-light text-dark border me-1">
                                                                ${code}: ${score}%
                                                            </span>
                                                        `).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-4">
                        <i class="bi bi-clock-history display-4 text-muted opacity-50"></i>
                        <p class="mt-3 text-muted">No recent activity</p>
                    </div>
                </div>
            `;
        }
    }

    updateQuickActions(actions) {
        const container = document.getElementById('quick-actions');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row g-2">
                ${actions.map(action => `
                    <div class="col-6">
                        <button class="btn btn-outline-${action.color} w-100 h-100 py-3" 
                                onclick="${action.action.toString().replace('() => ', '')}">
                            <i class="bi ${action.icon} display-6 mb-2"></i>
                            <div class="fw-bold">${action.title}</div>
                            <small class="text-muted">${action.description}</small>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateRecommendations(recommendations) {
        const container = document.getElementById('recommendations-widget');
        if (!container) return;
        
        if (recommendations.length > 0) {
            container.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-0">
                        <h6 class="mb-0">
                            <i class="bi bi-stars me-2"></i>For You
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush">
                            ${recommendations.map(rec => `
                                <div class="list-group-item border-0 px-0 py-2">
                                    <div class="d-flex align-items-center">
                                        <div class="flex-shrink-0">
                                            <div class="icon-wrapper bg-${rec.type === 'career' ? 'primary' : 'success'}-subtle">
                                                <i class="bi ${rec.type === 'career' ? 'bi-briefcase' : 'bi-mortarboard'} 
                                                   text-${rec.type === 'career' ? 'primary' : 'success'}"></i>
                                            </div>
                                        </div>
                                        <div class="flex-grow-1 ms-3">
                                            <h6 class="mb-1">${rec.title}</h6>
                                            <p class="small text-muted mb-1">${rec.description}</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <small class="text-muted">${rec.platform || ''}</small>
                                                ${rec.match ? `
                                                    <span class="badge bg-light text-dark border">
                                                        ${rec.match}% match
                                                    </span>
                                                ` : ''}
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
    }

    calculateProfileCompletion(userData) {
        const fields = [
            'name', 'email', 'careerInterests', 'education', 
            'experience', 'skills', 'careerGoals'
        ];
        
        let completed = 0;
        fields.forEach(field => {
            if (userData[field]) {
                if (Array.isArray(userData[field]) && userData[field].length > 0) {
                    completed++;
                } else if (typeof userData[field] === 'string' && userData[field].trim()) {
                    completed++;
                } else if (typeof userData[field] === 'object' && Object.keys(userData[field]).length > 0) {
                    completed++;
                }
            }
        });
        
        return Math.round((completed / fields.length) * 100);
    }

    initializeCharts() {
        this.initializeInterestChart();
        this.initializeSkillsChart();
        this.initializeProgressChart();
    }

    initializeInterestChart() {
        const ctx = document.getElementById('interest-chart');
        if (!ctx) return;
        
        // Clear existing chart
        if (this.charts.has('interest')) {
            this.charts.get('interest').destroy();
        }
        
        // Get user's assessment data
        const scores = AppState.userProfile?.latestAssessment?.scores || {
            R: 75, I: 90, A: 60, S: 85, E: 70, C: 55
        };
        
        const chart = new Chart(ctx.getContext('2d'), {
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
                    pointHoverBorderColor: 'rgb(54, 162, 235)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            backdropColor: 'transparent'
                        },
                        pointLabels: {
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
        
        this.charts.set('interest', chart);
    }

    initializeSkillsChart() {
        const ctx = document.getElementById('skills-chart');
        if (!ctx) return;
        
        // Clear existing chart
        if (this.charts.has('skills')) {
            this.charts.get('skills').destroy();
        }
        
        const skills = AppState.userProfile?.skills || [
            { name: 'Programming', level: 80 },
            { name: 'Communication', level: 75 },
            { name: 'Problem Solving', level: 85 },
            { name: 'Teamwork', level: 70 },
            { name: 'Project Management', level: 65 }
        ];
        
        const chart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: skills.map(s => s.name),
                datasets: [{
                    label: 'Skill Level',
                    data: skills.map(s => s.level),
                    backgroundColor: skills.map((_, i) => 
                        `hsla(${i * 60}, 70%, 60%, 0.7)`
                    ),
                    borderColor: skills.map((_, i) => 
                        `hsl(${i * 60}, 70%, 50%)`
                    ),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Skill Level: ${context.parsed.y}%`
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
        
        this.charts.set('skills', chart);
    }

    initializeProgressChart() {
        const ctx = document.getElementById('progress-chart');
        if (!ctx) return;
        
        // Clear existing chart
        if (this.charts.has('progress')) {
            this.charts.get('progress').destroy();
        }
        
        // Simulate progress data for the past 7 days
        const dates = [];
        const progress = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            progress.push(Math.floor(Math.random() * 30) + 70); // 70-100%
        }
        
        const chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Progress',
                    data: progress,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Progress: ${context.parsed.y}%`
                        }
                    }
                },
                maintainAspectRatio: false
            }
        });
        
        this.charts.set('progress', chart);
    }

    initializeTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
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
        
        // Update offline indicator
        if (AppState.offlineMode) {
            this.showOfflineIndicator();
        }
        
        // Trigger resize event for charts
        window.dispatchEvent(new Event('resize'));
    }

    showLoadingState() {
        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        // Add loading class to main container
        const mainContainer = document.getElementById('dashboard-container');
        if (mainContainer) {
            mainContainer.classList.add('loading');
        }
    }

    hideLoadingState() {
        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        const mainContainer = document.getElementById('dashboard-container');
        if (mainContainer) {
            mainContainer.classList.remove('loading');
        }
    }

    showErrorState(error) {
        const errorContainer = document.getElementById('dashboard-error');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error loading dashboard:</strong> ${error.message || 'Unknown error'}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    showLoginPrompt() {
        const container = document.getElementById('dashboard-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-person-circle display-1 text-muted"></i>
                    <h3 class="mt-4">Welcome to Career Guidance</h3>
                    <p class="text-muted">Please log in to access your personalized dashboard</p>
                    <div class="mt-4">
                        <a href="auth.html?redirect=dashboard.html" class="btn btn-primary btn-lg">
                            <i class="bi bi-box-arrow-in-right me-2"></i>Login
                        </a>
                    </div>
                </div>
            `;
        }
    }

    showOfflineIndicator() {
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <i class="bi bi-wifi-off me-2"></i>
                    You are currently offline. Some features may be limited.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            offlineIndicator.style.display = 'block';
        }
    }

    startAutoRefresh(interval) {
        // Clear existing interval if any
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Set new interval
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshDashboardData();
            }
        }, interval);
    }

    async refreshDashboardData() {
        console.log('Refreshing dashboard data...');
        
        try {
            // Refresh news
            const newsContainer = document.getElementById('news-widget');
            if (newsContainer) {
                const interests = AppState.userProfile?.careerInterests || 
                                 ['career development', 'job market'];
                const news = await this.newsManager.fetchCareerNews(interests, 4);
                if (news && news.length > 0) {
                    this.updateNewsWidget(news);
                }
            }
            
            // Update last refreshed time
            const lastUpdated = document.getElementById('last-updated');
            if (lastUpdated) {
                lastUpdated.textContent = new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
            
            console.log('Dashboard data refreshed');
            
        } catch (error) {
            console.warn('Dashboard refresh failed:', error);
        }
    }

    destroy() {
        // Clean up resources
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Destroy charts
        this.charts.forEach(chart => {
            try {
                chart.destroy();
            } catch (error) {
                console.warn('Error destroying chart:', error);
            }
        });
        
        this.charts.clear();
        this.initialized = false;
        
        console.log('Dashboard manager destroyed');
    }
}

// ============================================
// 5. ENHANCED PERFORMANCE OPTIMIZER
// ============================================

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.pendingRequests = new Map();
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            apiCalls: 0,
            errors: 0
        };
    }

    // Enhanced caching with serialization
    setCache(key, data, ttl = 3600000) {
        try {
            // Serialize data to handle complex objects
            const serializedData = {
                data: this.serialize(data),
                timestamp: Date.now(),
                ttl: ttl,
                size: this.calculateSize(data)
            };
            
            this.cache.set(key, serializedData);
            
            // Auto-cleanup based on TTL
            setTimeout(() => {
                if (this.cache.has(key) && 
                    Date.now() - this.cache.get(key).timestamp >= ttl) {
                    this.cache.delete(key);
                }
            }, ttl);
            
            return true;
            
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    getCache(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.metrics.cacheMisses++;
            return null;
        }
        
        // Check if cache entry is expired
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            this.metrics.cacheMisses++;
            return null;
        }
        
        this.metrics.cacheHits++;
        
        try {
            return this.deserialize(cached.data);
        } catch (error) {
            console.error('Cache deserialize error:', error);
            this.cache.delete(key);
            return null;
        }
    }

    serialize(data) {
        // Handle circular references and special types
        const replacer = (key, value) => {
            if (value instanceof Map) {
                return { __type: 'Map', value: Array.from(value.entries()) };
            }
            if (value instanceof Set) {
                return { __type: 'Set', value: Array.from(value) };
            }
            if (value instanceof Date) {
                return { __type: 'Date', value: value.toISOString() };
            }
            if (typeof value === 'function') {
                return undefined; // Skip functions
            }
            return value;
        };
        
        return JSON.stringify(data, replacer);
    }

    deserialize(data) {
        return JSON.parse(data, (key, value) => {
            if (value && typeof value === 'object' && value.__type) {
                switch (value.__type) {
                    case 'Map':
                        return new Map(value.value);
                    case 'Set':
                        return new Set(value.value);
                    case 'Date':
                        return new Date(value.value);
                }
            }
            return value;
        });
    }

    calculateSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch {
            return 0;
        }
    }

    // Enhanced debounce with immediate option
    debounce(func, delay, key, immediate = false) {
        return new Promise((resolve, reject) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key).timer);
            }
            
            const execute = async () => {
                try {
                    this.metrics.apiCalls++;
                    const result = await func();
                    resolve(result);
                } catch (error) {
                    this.metrics.errors++;
                    reject(error);
                } finally {
                    this.debounceTimers.delete(key);
                }
            };
            
            if (immediate && !this.debounceTimers.has(key)) {
                execute();
            } else {
                const timer = setTimeout(execute, delay);
                this.debounceTimers.set(key, { timer, func, delay });
            }
        });
    }

    // Request deduplication with timeout
    async deduplicateRequest(key, requestFunc, timeout = 10000) {
        if (this.pendingRequests.has(key)) {
            console.log(`Request deduplicated: ${key}`);
            return this.pendingRequests.get(key);
        }
        
        const promise = requestFunc();
        this.pendingRequests.set(key, promise);
        
        // Set timeout for request cleanup
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                this.pendingRequests.delete(key);
                reject(new Error(`Request timeout for key: ${key}`));
            }, timeout);
        });
        
        try {
            const result = await Promise.race([promise, timeoutPromise]);
            this.pendingRequests.delete(key);
            return result;
        } catch (error) {
            this.pendingRequests.delete(key);
            throw error;
        }
    }

    // Batch requests with concurrency control
    async batchRequests(requests, batchSize = 3, delayBetweenBatches = 100) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            
            try {
                const batchResults = await Promise.allSettled(
                    batch.map(req => req().catch(err => {
                        console.error('Batch request error:', err);
                        return { error: err.message };
                    }))
                );
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && !result.value.error) {
                        results.push(result.value);
                    } else {
                        errors.push({
                            index: i + index,
                            error: result.reason || result.value?.error
                        });
                    }
                });
                
            } catch (error) {
                errors.push({ batch: i / batchSize, error: error.message });
            }
            
            // Delay between batches to respect rate limits
            if (i + batchSize < requests.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        return { results, errors };
    }

    // Performance monitoring
    startPerformanceMonitor() {
        if (this.performanceObserver) return;
        
        this.performanceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                
                // Log slow operations
                if (entry.duration > 1000) {
                    console.warn(`Slow operation detected: ${entry.name}`);
                }
            });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
    }

    stopPerformanceMonitor() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0 ?
                (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
            memoryUsage: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    clearCache(pattern = null) {
        if (pattern) {
            // Clear cache entries matching pattern
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        
        console.log(`Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`);
    }

    optimizeImages() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// ============================================
// 6. ENHANCED ERROR HANDLER
// ============================================

class ErrorHandler {
    static setupGlobalHandlers() {
        // Prevent duplicate setup
        if (window.__errorHandlersSetup) return;
        
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError(event.error, 'global');
            
            // Prevent error from appearing in console
            event.preventDefault();
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError(event.reason, 'promise');
            event.preventDefault();
        });
        
        // Network error handling
        window.addEventListener('online', () => {
            console.log('Application is online');
            AppState.offlineMode = false;
            this.showToast('You are back online', 'success');
        });
        
        window.addEventListener('offline', () => {
            console.warn('Application is offline');
            AppState.offlineMode = true;
            this.showToast('You are offline. Some features may be limited.', 'warning');
        });
        
        // API error handler
        this.setupAPIErrorHandling();
        
        // Memory warning
        if (performance.memory) {
            setInterval(() => {
                const usedMemory = performance.memory.usedJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                
                if (usedMemory > limit * 0.8) {
                    console.warn('High memory usage detected');
                    this.triggerMemoryCleanup();
                }
            }, 60000); // Check every minute
        }
        
        window.__errorHandlersSetup = true;
    }
    
    static setupAPIErrorHandling() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            const requestId = Math.random().toString(36).substr(2, 9);
            
            console.log(`Fetch request [${requestId}]:`, args[0]);
            
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;
                
                console.log(`Fetch response [${requestId}]: ${response.status} (${duration.toFixed(2)}ms)`);
                
                // Log slow requests
                if (duration > 2000) {
                    console.warn(`Slow request [${requestId}]: ${duration.toFixed(2)}ms`);
                }
                
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = response.status;
                    error.url = args[0];
                    ErrorHandler.logError(error, 'api');
                    
                    // Handle specific status codes
                    if (response.status === 401) {
                        ErrorHandler.handleUnauthorized();
                    } else if (response.status === 429) {
                        ErrorHandler.handleRateLimit();
                    } else if (response.status >= 500) {
                        ErrorHandler.handleServerError();
                    }
                }
                
                return response;
                
            } catch (error) {
                const duration = performance.now() - startTime;
                console.error(`Fetch error [${requestId}]: ${error.message} (${duration.toFixed(2)}ms)`);
                
                ErrorHandler.logError(error, 'network');
                
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    ErrorHandler.handleNetworkError();
                }
                
                throw error;
            }
        };
    }
    
    static async handleAPICall(apiCall, fallback, maxRetries = 3, retryDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await apiCall();
                return result;
                
            } catch (error) {
                console.warn(`API call failed (attempt ${attempt}/${maxRetries}):`, error);
                
                if (attempt === maxRetries) {
                    console.log('Using fallback data');
                    return typeof fallback === 'function' ? fallback() : fallback;
                }
                
                // Exponential backoff with jitter
                const delay = retryDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    static logError(error, type = 'unknown') {
        const errorData = {
            type: type,
            message: error.message,
            stack: error.stack,
            name: error.name,
            status: error.status,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            user: AppState.currentUser?.email || 'anonymous',
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        // Development logging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.group('Error Logged');
            console.error('Error details:', errorData);
            if (error.cause) console.error('Error cause:', error.cause);
            console.groupEnd();
        }
        
        // Store in localStorage for debugging (limited to 50 errors)
        try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.unshift({
                ...errorData,
                // Truncate stack trace if too long
                stack: errorData.stack?.substring(0, 1000)
            });
            
            // Keep only recent errors
            localStorage.setItem('app_errors', JSON.stringify(errors.slice(0, 50)));
            
        } catch (storageError) {
            console.warn('Could not save error to localStorage:', storageError);
        }
        
        // In production, send to error tracking service
        if (!window.location.hostname.includes('localhost') && 
            !window.location.hostname.includes('127.0.0.1')) {
            this.sendToErrorService(errorData).catch(() => {
                // Silently fail if error service is unavailable
            });
        }
    }
    
    static async sendToErrorService(errorData) {
        // This would send to an error tracking service like Sentry, LogRocket, etc.
        // For now, we'll simulate it
        console.log('Error sent to tracking service:', errorData.type);
    }
    
    static showUserError(message, type = 'error', duration = 5000) {
        // Remove existing alerts of the same type
        document.querySelectorAll(`.app-alert.alert-${type}`).forEach(alert => {
            alert.remove();
        });
        
        const alertTypes = {
            error: { icon: 'exclamation-triangle', color: 'danger', title: 'Error' },
            warning: { icon: 'exclamation-circle', color: 'warning', title: 'Warning' },
            success: { icon: 'check-circle', color: 'success', title: 'Success' },
            info: { icon: 'info-circle', color: 'info', title: 'Info' }
        };
        
        const alertType = alertTypes[type] || alertTypes.error;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `app-alert alert alert-${alertType.color} alert-dismissible fade show`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        alertDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="bi bi-${alertType.icon} fs-4 me-2 flex-shrink-0"></i>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <strong class="me-2">${alertType.title}</strong>
                        <button type="button" class="btn-close btn-sm" 
                                onclick="this.parentElement.parentElement.parentElement.remove()">
                        </button>
                    </div>
                    <p class="mb-0 small mt-1">${message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
        
        // Add animation
        alertDiv.animate([
            { opacity: 0, transform: 'translateX(100px)' },
            { opacity: 1, transform: 'translateX(0)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    }
    
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
            <div id="${toastId}" class="toast align-items-center border-0 bg-${toastType.color} bg-opacity-10" 
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
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: duration
        });
        
        toast.show();
        
        // Remove from DOM after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    static handleUnauthorized() {
        console.warn('User unauthorized, redirecting to login...');
        
        // Store current location for redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        
        // Show message before redirect
        this.showUserError('Your session has expired. Please log in again.', 'warning', 3000);
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 3000);
    }
    
    static handleRateLimit() {
        console.warn('Rate limit exceeded');
        this.showUserError('Too many requests. Please try again in a few moments.', 'warning', 5000);
    }
    
    static handleServerError() {
        console.error('Server error occurred');
        this.showUserError('Server error. Please try again later.', 'error', 5000);
    }
    
    static handleNetworkError() {
        console.error('Network error occurred');
        this.showUserError('Network connection lost. Please check your connection.', 'error', 5000);
    }
    
    static triggerMemoryCleanup() {
        console.log('Performing memory cleanup...');
        
        // Clear large caches
        if (window.CareerApp?.onetAPI) {
            window.CareerApp.onetAPI.clearCache();
        }
        
        if (window.CareerApp?.newsManager) {
            window.CareerApp.newsManager.clearCache();
        }
        
        if (window.CareerApp?.jobMarket) {
            window.CareerApp.jobMarket.clearCache();
        }
        
        // Clear performance optimizer cache
        if (window.CareerApp?.performance) {
            window.CareerApp.performance.clearCache();
        }
        
        // Force garbage collection (if available)
        if (window.gc) {
            window.gc();
        }
        
        this.showToast('Memory optimized', 'info', 2000);
    }
    
    static getErrorLogs(limit = 20) {
        try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            return errors.slice(0, limit);
        } catch {
            return [];
        }
    }
    
    static clearErrorLogs() {
        localStorage.removeItem('app_errors');
        console.log('Error logs cleared');
    }
}

// ============================================
// 7. MAIN CAREER GUIDANCE APP
// ============================================

class CareerGuidanceApp {
    constructor() {
        console.log('🚀 Initializing Enhanced Career Guidance App...');
        
        // Initialize managers
        this.onetAPI = new OnetAPIManager();
        this.newsManager = new NewsIntegrationManager();
        this.jobMarket = new JobMarketManager();
        this.performance = new PerformanceOptimizer();
        this.dashboard = new DashboardEnhancementManager();
        
        // Initialize error handling first
        ErrorHandler.setupGlobalHandlers();
        
        // Set up theme
        this.setupTheme();
        
        // Initialize based on current page
        this.initPageSpecificFeatures();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Test APIs
        this.testAPIConnections();
        
        // Start performance monitoring
        this.performance.startPerformanceMonitor();
        
        console.log('✅ Career Guidance App initialized successfully');
    }
    
    setupTheme() {
        // Load saved theme or default to light
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
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: AppState.theme } 
        }));
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
                
            case 'profile.html':
                this.initProfilePage();
                break;
                
            case 'index.html':
            case '':
                this.initHomePage();
                break;
                
            default:
                console.log(`No special initialization for page: ${page}`);
        }
    }
    
    async initDashboard() {
        console.log('Initializing dashboard...');
        
        // Wait for Firebase to initialize
        if (typeof FirebaseServices !== 'undefined' && FirebaseServices.auth) {
            FirebaseServices.auth.onAuthStateChanged((user) => {
                if (user) {
                    AppState.currentUser = user;
                    setTimeout(() => {
                        this.dashboard.initializeDashboard();
                    }, 500);
                } else {
                    // Redirect to login if not authenticated
                    setTimeout(() => {
                        if (!window.location.pathname.includes('auth.html')) {
                            window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
                        }
                    }, 1000);
                }
            });
        } else {
            console.warn('Firebase not loaded yet, dashboard initialization delayed');
            setTimeout(() => this.initDashboard(), 1000);
        }
    }
    
    async initCareersPage() {
        console.log('Initializing careers page...');
        
        // Load careers data based on URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const careerId = urlParams.get('id');
        const searchQuery = urlParams.get('search');
        const category = urlParams.get('category');
        
        if (careerId) {
            await this.loadCareerDetails(careerId);
        } else if (searchQuery) {
            await this.searchCareers(searchQuery);
        } else if (category) {
            await this.loadCareersByCategory(category);
        } else {
            await this.loadFeaturedCareers();
        }
    }
    
    async initAssessmentPage() {
        console.log('Initializing assessment page...');
        
        // Check for existing assessment results
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('result');
        
        if (resultId) {
            await this.loadAssessmentResult(resultId);
        } else {
            // Initialize new assessment
            this.initNewAssessment();
        }
    }
    
    async initJobsPage() {
        console.log('Initializing jobs page...');
        
        // Load jobs based on URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const career = urlParams.get('career');
        const location = urlParams.get('location') || 'us';
        const remote = urlParams.get('remote');
        
        if (career) {
            await this.loadJobsForCareer(career, location, remote === 'true');
        } else {
            await this.loadFeaturedJobs();
        }
    }
    
    async initProfilePage() {
        console.log('Initializing profile page...');
        
        // Load user profile data
        await this.loadUserProfile();
    }
    
    async initHomePage() {
        console.log('Initializing homepage...');
        
        // Load featured content
        await this.loadFeaturedContent();
        
        // Initialize any homepage-specific components
        this.initHomepageComponents();
    }
    
    async loadFeaturedContent() {
        try {
            // Load popular careers
            const popularCareers = await this.onetAPI.searchCareersByInterest('I', 6);
            
            // Load latest career news
            const news = await this.newsManager.fetchCareerNews(['career', 'jobs'], 4);
            
            // Load job market trends
            const trends = await this.jobMarket.getJobMarketTrends('software developer');
            
            // Update homepage
            this.updateHomepageContent(popularCareers, news, trends);
            
        } catch (error) {
            console.error('Error loading featured content:', error);
            ErrorHandler.showUserError('Could not load featured content. Please try again.', 'warning');
        }
    }
    
    updateHomepageContent(careers, news, trends) {
        // Update popular careers section
        const careersContainer = document.getElementById('popular-careers');
        if (careersContainer && careers.length > 0) {
            careersContainer.innerHTML = `
                <div class="row g-4">
                    ${careers.slice(0, 6).map((career, index) => `
                        <div class="col-md-4 col-lg-2">
                            <div class="card h-100 border-0 shadow-sm hover-lift text-center">
                                <div class="card-body">
                                    <div class="icon-wrapper bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-3" 
                                         style="width: 60px; height: 60px; line-height: 60px;">
                                        <i class="bi bi-briefcase fs-4"></i>
                                    </div>
                                    <h6 class="card-title mb-2">${career.title}</h6>
                                    <p class="card-text small text-muted">
                                        ${career.description?.substring(0, 60) || 'Explore career'}...
                                    </p>
                                    <a href="careers.html?id=${career.id || '#'}" 
                                       class="stretched-link"></a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Update news section
        const newsContainer = document.getElementById('home-news');
        if (newsContainer && news.length > 0) {
            newsContainer.innerHTML = `
                <div class="row g-4">
                    ${news.slice(0, 4).map(article => `
                        <div class="col-md-6">
                            <div class="card h-100 border-0 shadow-sm hover-lift">
                                ${article.image ? `
                                    <img src="${article.image}" 
                                         class="card-img-top" 
                                         style="height: 180px; object-fit: cover;"
                                         alt="${article.title}"
                                         loading="lazy">
                                ` : ''}
                                <div class="card-body">
                                    <h5 class="card-title">${article.title}</h5>
                                    <p class="card-text text-muted">${article.description?.substring(0, 100)}...</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">${article.source}</small>
                                        <a href="${article.url}" target="_blank" 
                                           class="btn btn-sm btn-outline-primary">
                                            Read More
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Update stats section
        const statsContainer = document.getElementById('home-stats');
        if (statsContainer && trends) {
            statsContainer.innerHTML = `
                <div class="row text-center g-4">
                    <div class="col-md-3">
                        <div class="display-4 text-primary fw-bold">${trends.totalJobs || '0'}+</div>
                        <p class="text-muted mb-0">Job Opportunities</p>
                    </div>
                    <div class="col-md-3">
                        <div class="display-4 text-success fw-bold">${trends.remotePercentage || '0'}%</div>
                        <p class="text-muted mb-0">Remote Positions</p>
                    </div>
                    <div class="col-md-3">
                        <div class="display-4 text-info fw-bold">${trends.topCompanies?.[0]?.count || '0'}</div>
                        <p class="text-muted mb-0">Top Companies Hiring</p>
                    </div>
                    <div class="col-md-3">
                        <div class="display-4 text-warning fw-bold">${trends.growthTrend || 'Growing'}</div>
                        <p class="text-muted mb-0">Market Growth</p>
                    </div>
                </div>
            `;
        }
    }
    
    initHomepageComponents() {
        // Initialize any homepage-specific JavaScript components
        // For example, testimonial sliders, counters, etc.
        
        // Animate counters
        this.animateCounters();
        
        // Initialize carousels
        this.initCarousels();
        
        // Initialize scroll animations
        this.initScrollAnimations();
    }
    
    animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const step = target / (duration / 16); // 60fps
            
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current).toLocaleString();
            }, 16);
        });
    }
    
    initCarousels() {
        // Initialize Bootstrap carousels
        const carousels = document.querySelectorAll('.carousel');
        carousels.forEach(carousel => {
            new bootstrap.Carousel(carousel);
        });
    }
    
    initScrollAnimations() {
        // Add scroll-triggered animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
    
    setupEventListeners() {
        // Global search functionality
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.performance.debounce(
                async () => {
                    const query = searchInput.value.trim();
                    if (query.length > 2) {
                        await this.handleGlobalSearch(query);
                    }
                }, 
                300, 
                'global-search'
            ));
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await FirebaseServices.auth.signOut();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                    ErrorHandler.showUserError('Could not log out. Please try again.', 'error');
                }
            });
        }
        
        // Navigation active state
        this.setupNavigation();
        
        // Form submissions
        this.setupForms();
        
        // Responsive behavior
        this.setupResponsive();
    }
    
    setupNavigation() {
        // Highlight active navigation item
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                    mobileMenu.classList.toggle('show');
                }
            });
        }
    }
    
    setupForms() {
        // Handle form submissions with validation
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
        
        // Real-time form validation
        const validatedInputs = document.querySelectorAll('[data-validate]');
        validatedInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });
    }
    
    validateInput(input) {
        const value = input.value.trim();
        const type = input.getAttribute('data-validate');
        let isValid = true;
        let message = '';
        
        switch (type) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                message = isValid ? '' : 'Please enter a valid email address';
                break;
                
            case 'phone':
                isValid = /^[\d\s\-\+\(\)]{10,}$/.test(value);
                message = isValid ? '' : 'Please enter a valid phone number';
                break;
                
            case 'password':
                isValid = value.length >= 8;
                message = isValid ? '' : 'Password must be at least 8 characters';
                break;
                
            case 'required':
                isValid = value.length > 0;
                message = isValid ? '' : 'This field is required';
                break;
        }
        
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
            input.classList.toggle('is-invalid', !isValid);
            input.classList.toggle('is-valid', isValid && value.length > 0);
        }
    }
    
    setupResponsive() {
        // Handle responsive behavior
        const handleResize = this.performance.debounce(() => {
            console.log('Window resized to:', window.innerWidth);
            
            // Update any responsive elements
            this.updateResponsiveElements();
            
        }, 250, 'resize-handler');
        
        window.addEventListener('resize', handleResize);
        
        // Initial call
        this.updateResponsiveElements();
    }
    
    updateResponsiveElements() {
        // Update elements based on screen size
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 992;
        const isDesktop = window.innerWidth >= 992;
        
        // Example: Adjust number of items in carousels
        const carousels = document.querySelectorAll('[data-items-mobile]');
        carousels.forEach(carousel => {
            let items = 1;
            
            if (isDesktop) {
                items = carousel.getAttribute('data-items-desktop') || 4;
            } else if (isTablet) {
                items = carousel.getAttribute('data-items-tablet') || 2;
            } else {
                items = carousel.getAttribute('data-items-mobile') || 1;
            }
            
            // Update carousel configuration
            // This would depend on your carousel implementation
        });
    }
    
    async handleGlobalSearch(query) {
        try {
            // Show loading state
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        Searching...
                    </div>
                `;
            }
            
            // Search careers
            const careerResults = await this.onetAPI.searchCareersByInterest(query, 5);
            
            // Search jobs
            const jobResults = await this.jobMarket.fetchJobsByCareer(query, 'us', 5);
            
            // Display results
            this.displaySearchResults(query, careerResults, jobResults);
            
        } catch (error) {
            console.error('Search error:', error);
            ErrorHandler.showUserError('Search failed. Please try again.', 'error');
        }
    }
    
    displaySearchResults(query, careers, jobs) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        let html = `
            <div class="card shadow-lg border-0">
                <div class="card-header bg-white border-0">
                    <h6 class="mb-0">
                        <i class="bi bi-search me-2"></i>Results for "${query}"
                    </h6>
                </div>
                <div class="card-body">
        `;
        
        if (careers.length > 0) {
            html += `
                <div class="mb-4">
                    <h6 class="text-muted mb-3">Careers</h6>
                    <div class="list-group list-group-flush">
                        ${careers.map(career => `
                            <a href="careers.html?id=${career.id || '#'}" 
                               class="list-group-item list-group-item-action border-0 px-0 py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${career.title}</strong>
                                        <div class="small text-muted">
                                            ${career.description?.substring(0, 80) || ''}...
                                        </div>
                                    </div>
                                    <div>
                                        ${career.riasecCodes?.map(code => `
                                            <span class="badge bg-light text-dark border me-1">${code}</span>
                                        `).join('')}
                                        <i class="bi bi-chevron-right text-muted"></i>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (jobs.length > 0) {
            html += `
                <div>
                    <h6 class="text-muted mb-3">Job Opportunities</h6>
                    <div class="list-group list-group-flush">
                        ${jobs.map(job => `
                            <a href="${job.redirect_url || job.url || '#'}" 
                               target="_blank"
                               class="list-group-item list-group-item-action border-0 px-0 py-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${job.title}</strong>
                                        <div class="small text-muted">
                                            ${job.company} • ${job.location}
                                        </div>
                                    </div>
                                    <div>
                                        ${job.is_remote ? `
                                            <span class="badge bg-success bg-opacity-10 text-success me-2">
                                                Remote
                                            </span>
                                        ` : ''}
                                        <i class="bi bi-box-arrow-up-right text-muted"></i>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (careers.length === 0 && jobs.length === 0) {
            html += `
                <div class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted opacity-50"></i>
                    <p class="mt-3 text-muted">No results found for "${query}"</p>
                    <p class="small text-muted">Try different keywords or browse our career categories</p>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }
    
    async testAPIConnections() {
        console.log('Testing API connections...');
        
        const tests = [
            {
                name: 'O*NET API',
                test: async () => {
                    const result = await this.onetAPI.getCareerData('15-1252');
                    return result && result.title ? 'Connected' : 'Failed';
                }
            },
            {
                name: 'News API',
                test: async () => {
                    const result = await this.newsManager.fetchCareerNews(['test'], 1);
                    return result && Array.isArray(result) ? 'Connected' : 'Failed';
                }
            },
            {
                name: 'Job Market API',
                test: async () => {
                    const result = await this.jobMarket.fetchJobsByCareer('software', 'us', 1);
                    return result && Array.isArray(result) ? 'Connected' : 'Failed';
                }
            }
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const result = await test.test();
                results.push({ name: test.name, status: result });
                console.log(`✅ ${test.name}: ${result}`);
            } catch (error) {
                results.push({ name: test.name, status: 'Failed', error: error.message });
                console.warn(`❌ ${test.name}: Failed - ${error.message}`);
            }
        }
        
        // Store API status
        AppState.apiStatus = results;
        
        // Show warning if any API is down
        const failedAPIs = results.filter(r => r.status === 'Failed');
        if (failedAPIs.length > 0) {
            console.warn(`${failedAPIs.length} API(s) failed to connect`);
            
            if (failedAPIs.length === results.length) {
                ErrorHandler.showUserError(
                    'All external services are currently unavailable. Using limited offline mode.',
                    'warning',
                    10000
                );
                AppState.offlineMode = true;
            }
        }
        
        return results;
    }
    
    async loadCareerDetails(careerId) {
        try {
            // Show loading state
            const container = document.getElementById('career-details-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading career details...</p>
                    </div>
                `;
            }
            
            // Fetch career data
            const careerData = await this.onetAPI.getCareerData(careerId);
            
            // Fetch related jobs
            const jobs = await this.jobMarket.fetchJobsByCareer(careerData.title, 'us', 5);
            
            // Fetch related news
            const news = await this.newsManager.fetchCareerNews([careerData.title], 3);
            
            // Display career details
            this.displayCareerDetails(careerData, jobs, news);
            
        } catch (error) {
            console.error('Error loading career details:', error);
            ErrorHandler.showUserError('Could not load career details. Please try again.', 'error');
        }
    }
    
    displayCareerDetails(career, jobs, news) {
        const container = document.getElementById('career-details-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="row">
                <!-- Main Career Info -->
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h1 class="card-title mb-3">${career.title}</h1>
                            <p class="lead">${career.description}</p>
                            
                            <div class="row g-4 mt-4">
                                <div class="col-md-4">
                                    <div class="text-center p-3 bg-light rounded">
                                        <i class="bi bi-cash-coin display-6 text-primary mb-2"></i>
                                        <h3>$${career.salary.median?.toLocaleString() || 'N/A'}</h3>
                                        <p class="text-muted mb-0">Median Salary</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center p-3 bg-light rounded">
                                        <i class="bi bi-graph-up-arrow display-6 text-success mb-2"></i>
                                        <h3>${career.outlook.growth || 0}%</h3>
                                        <p class="text-muted mb-0">Growth Rate</p>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="text-center p-3 bg-light rounded">
                                        <i class="bi bi-mortarboard display-6 text-info mb-2"></i>
                                        <h3>${career.education[0]?.level || 'Varies'}</h3>
                                        <p class="text-muted mb-0">Education Required</p>
                                    </div>
                                </div>
                            </div>
                            
                            ${career.skills.length > 0 ? `
                                <div class="mt-5">
                                    <h4 class="mb-3">Key Skills</h4>
                                    <div class="row g-2">
                                        ${career.skills.map(skill => `
                                            <div class="col-auto">
                                                <div class="badge bg-primary bg-opacity-10 text-primary p-2">
                                                    ${skill.name}
                                                    ${skill.importance ? `
                                                        <span class="badge bg-primary ms-1">
                                                            ${skill.importance}%
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${career.tasks.length > 0 ? `
                                <div class="mt-5">
                                    <h4 class="mb-3">Common Tasks</h4>
                                    <ul class="list-group list-group-flush">
                                        ${career.tasks.slice(0, 5).map(task => `
                                            <li class="list-group-item border-0 px-0">
                                                <i class="bi bi-check-circle text-success me-2"></i>
                                                ${task}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Sidebar -->
                <div class="col-lg-4">
                    <!-- RIASEC Codes -->
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h5 class="card-title mb-3">
                                <i class="bi bi-person-badge me-2"></i>Personality Match
                            </h5>
                            <div class="d-flex flex-wrap gap-2">
                                ${career.riasecCodes?.map(code => `
                                    <span class="badge bg-primary bg-opacity-25 text-primary p-2">
                                        ${code}
                                    </span>
                                `).join('')}
                            </div>
                            <p class="small text-muted mt-3 mb-0">
                                RIASEC codes indicate the personality types that typically excel in this career.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Related Jobs -->
                    ${jobs.length > 0 ? `
                        <div class="card border-0 shadow-sm mb-4">
                            <div class="card-body">
                                <h5 class="card-title mb-3">
                                    <i class="bi bi-briefcase me-2"></i>Related Jobs
                                </h5>
                                <div class="list-group list-group-flush">
                                    ${jobs.slice(0, 3).map(job => `
                                        <a href="${job.redirect_url || job.url || '#'}" 
                                           target="_blank"
                                           class="list-group-item list-group-item-action border-0 px-0 py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong class="d-block">${job.title}</strong>
                                                    <small class="text-muted">${job.company}</small>
                                                </div>
                                                <i class="bi bi-box-arrow-up-right text-muted"></i>
                                            </div>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Career News -->
                    ${news.length > 0 ? `
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title mb-3">
                                    <i class="bi bi-newspaper me-2"></i>Related News
                                </h5>
                                <div class="list-group list-group-flush">
                                    ${news.slice(0, 3).map(article => `
                                        <a href="${article.url}" 
                                           target="_blank"
                                           class="list-group-item list-group-item-action border-0 px-0 py-2">
                                            <strong class="d-block">${article.title}</strong>
                                            <small class="text-muted">${article.source}</small>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- O*NET Attribution -->
            <div class="mt-4">
                ${this.onetAPI.getAttributionHTML()}
            </div>
        `;
    }
    
    async searchCareers(query) {
        try {
            // Implement career search logic
            console.log('Searching careers for:', query);
            
            // This would search through O*NET API or local database
            // For now, we'll use the interest search
            
            const results = await this.onetAPI.searchCareersByInterest(query.charAt(0).toUpperCase(), 20);
            
            this.displaySearchResults(query, results, []);
            
        } catch (error) {
            console.error('Career search error:', error);
            ErrorHandler.showUserError('Career search failed. Please try again.', 'error');
        }
    }
    
    async loadCareersByCategory(category) {
        try {
            // Load careers by category
            console.log('Loading careers for category:', category);
            
            // Map categories to RIASEC codes
            const categoryMap = {
                'technology': 'I',
                'healthcare': 'S',
                'business': 'E',
                'arts': 'A',
                'trades': 'R',
                'administration': 'C'
            };
            
            const riasecCode = categoryMap[category] || 'I';
            const careers = await this.onetAPI.searchCareersByInterest(riasecCode, 20);
            
            this.displayCategoryCareers(category, careers);
            
        } catch (error) {
            console.error('Category load error:', error);
            ErrorHandler.showUserError('Could not load category. Please try again.', 'error');
        }
    }
    
    displayCategoryCareers(category, careers) {
        const container = document.getElementById('careers-container');
        if (!container) return;
        
        const categoryNames = {
            'technology': 'Technology',
            'healthcare': 'Healthcare',
            'business': 'Business',
            'arts': 'Arts & Creative',
            'trades': 'Trades & Technical',
            'administration': 'Administration'
        };
        
        const categoryName = categoryNames[category] || 'Careers';
        
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-3">${categoryName} Careers</h1>
                <p class="lead text-muted">Explore ${careers.length} careers in ${categoryName.toLowerCase()}</p>
            </div>
            
            <div class="row g-4">
                ${careers.map(career => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm hover-lift">
                            <div class="card-body">
                                <h5 class="card-title">${career.title}</h5>
                                <p class="card-text text-muted small line-clamp-3">
                                    ${career.description?.substring(0, 150) || 'Career information available'}...
                                </p>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        ${career.riasecCodes?.map(code => `
                                            <span class="badge bg-light text-dark border me-1">${code}</span>
                                        `).join('')}
                                    </div>
                                    <a href="careers.html?id=${career.id || '#'}" 
                                       class="btn btn-sm btn-outline-primary">
                                        Details
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async loadFeaturedCareers() {
        try {
            // Load featured/popular careers
            const featuredCareers = await this.onetAPI.searchCareersByInterest('I', 12);
            
            this.displayFeaturedCareers(featuredCareers);
            
        } catch (error) {
            console.error('Featured careers load error:', error);
            ErrorHandler.showUserError('Could not load careers. Please try again.', 'error');
        }
    }
    
    displayFeaturedCareers(careers) {
        const container = document.getElementById('careers-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-3">Explore Careers</h1>
                <p class="lead text-muted">Browse popular career paths and find your perfect match</p>
            </div>
            
            <!-- Career Categories -->
            <div class="row g-4 mb-5">
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=technology" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-laptop display-6 text-primary mb-3"></i>
                                <h6 class="card-title mb-0">Technology</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=healthcare" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-heart-pulse display-6 text-danger mb-3"></i>
                                <h6 class="card-title mb-0">Healthcare</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=business" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-briefcase display-6 text-success mb-3"></i>
                                <h6 class="card-title mb-0">Business</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=arts" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-palette display-6 text-warning mb-3"></i>
                                <h6 class="card-title mb-0">Arts</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=trades" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-tools display-6 text-info mb-3"></i>
                                <h6 class="card-title mb-0">Trades</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-2 col-6">
                    <a href="careers.html?category=administration" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-clipboard-data display-6 text-secondary mb-3"></i>
                                <h6 class="card-title mb-0">Administration</h6>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            
            <!-- Featured Careers -->
            <h3 class="mb-4">Popular Career Paths</h3>
            <div class="row g-4">
                ${careers.map(career => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 border-0 shadow-sm hover-lift">
                            <div class="card-body">
                                <h5 class="card-title">${career.title}</h5>
                                <p class="card-text text-muted small line-clamp-3">
                                    ${career.description?.substring(0, 150) || 'Explore this career path'}...
                                </p>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        ${career.riasecCodes?.map(code => `
                                            <span class="badge bg-light text-dark border me-1">${code}</span>
                                        `).join('')}
                                    </div>
                                    <a href="careers.html?id=${career.id || '#'}" 
                                       class="btn btn-sm btn-outline-primary">
                                        Explore
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async loadAssessmentResult(resultId) {
        try {
            // Load assessment result from Firebase
            const resultDoc = await FirebaseServices.db
                .collection('assessment_results')
                .doc(resultId)
                .get();
            
            if (resultDoc.exists) {
                const result = resultDoc.data();
                this.displayAssessmentResult(result);
            } else {
                throw new Error('Assessment result not found');
            }
            
        } catch (error) {
            console.error('Error loading assessment result:', error);
            ErrorHandler.showUserError('Could not load assessment result. Please try again.', 'error');
        }
    }
    
    displayAssessmentResult(result) {
        const container = document.getElementById('assessment-container');
        if (!container) return;
        
        const scores = result.scores || {};
        const topCodes = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h1 class="card-title mb-4">Your Assessment Results</h1>
                    
                    <div class="row g-4">
                        <!-- Top Interests -->
                        <div class="col-md-8">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body">
                                    <h4 class="card-title mb-3">
                                        <i class="bi bi-star me-2"></i>Top Interests
                                    </h4>
                                    <div class="row g-3">
                                        ${topCodes.map(([code, score], index) => `
                                            <div class="col-md-4">
                                                <div class="text-center p-3 bg-light rounded">
                                                    <div class="display-6 text-primary mb-2">${code}</div>
                                                    <h3>${score}%</h3>
                                                    <p class="text-muted mb-0">
                                                        ${this.getRIASECDescription(code)}
                                                    </p>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Recommendations -->
                        <div class="col-md-4">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body">
                                    <h4 class="card-title mb-3">
                                        <i class="bi bi-lightbulb me-2"></i>Next Steps
                                    </h4>
                                    <div class="list-group list-group-flush">
                                        <a href="careers.html?category=technology" 
                                           class="list-group-item list-group-item-action border-0 px-0">
                                            <i class="bi bi-search me-2"></i>
                                            Explore Careers
                                        </a>
                                        <a href="jobs.html" 
                                           class="list-group-item list-group-item-action border-0 px-0">
                                            <i class="bi bi-briefcase me-2"></i>
                                            Find Jobs
                                        </a>
                                        <a href="profile.html" 
                                           class="list-group-item list-group-item-action border-0 px-0">
                                            <i class="bi bi-person-circle me-2"></i>
                                            Update Profile
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Full Results -->
                    <div class="mt-4">
                        <h4 class="mb-3">Full RIASEC Results</h4>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Description</th>
                                        <th>Score</th>
                                        <th>Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.entries(scores).map(([code, score]) => `
                                        <tr>
                                            <td><strong>${code}</strong></td>
                                            <td>${this.getRIASECDescription(code)}</td>
                                            <td>${score}%</td>
                                            <td>
                                                <span class="badge ${score > 80 ? 'bg-success' : score > 60 ? 'bg-primary' : 'bg-secondary'}">
                                                    ${score > 80 ? 'High' : score > 60 ? 'Medium' : 'Low'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getRIASECDescription(code) {
        const descriptions = {
            'R': 'Realistic - Doers who like working with tools and machines',
            'I': 'Investigative - Thinkers who like to analyze and solve problems',
            'A': 'Artistic - Creators who enjoy artistic self-expression',
            'S': 'Social - Helpers who enjoy teaching and helping others',
            'E': 'Enterprising - Persuaders who like to lead and influence people',
            'C': 'Conventional - Organizers who prefer structured, orderly work'
        };
        return descriptions[code] || 'Unknown interest area';
    }
    
    initNewAssessment() {
        // This would initialize the assessment questions and logic
        // For now, we'll just show a placeholder
        
        const container = document.getElementById('assessment-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h1 class="card-title mb-4">Career Assessment</h1>
                    <p class="lead">Discover careers that match your personality, skills, and interests.</p>
                    
                    <div class="row mt-5">
                        <div class="col-md-6">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body text-center p-5">
                                    <i class="bi bi-person-badge display-1 text-primary mb-4"></i>
                                    <h3 class="card-title mb-3">RIASEC Assessment</h3>
                                    <p class="card-text text-muted">
                                        Based on the Holland Code theory, this assessment identifies your 
                                        work personality across 6 dimensions.
                                    </p>
                                    <a href="#" class="btn btn-primary btn-lg mt-3">
                                        Start Assessment
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body text-center p-5">
                                    <i class="bi bi-clipboard-data display-1 text-success mb-4"></i>
                                    <h3 class="card-title mb-3">Skills Assessment</h3>
                                    <p class="card-text text-muted">
                                        Evaluate your technical and soft skills to find careers that match 
                                        your abilities.
                                    </p>
                                    <a href="#" class="btn btn-success btn-lg mt-3">
                                        Start Assessment
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadJobsForCareer(career, location, remoteOnly = false) {
        try {
            // Show loading state
            const container = document.getElementById('jobs-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Loading jobs...</p>
                    </div>
                `;
            }
            
            // Fetch jobs
            let jobs = await this.jobMarket.fetchJobsByCareer(career, location, 20);
            
            // Filter remote jobs if requested
            if (remoteOnly) {
                jobs = jobs.filter(job => job.is_remote === true);
            }
            
            // Display jobs
            this.displayJobs(career, jobs);
            
        } catch (error) {
            console.error('Error loading jobs:', error);
            ErrorHandler.showUserError('Could not load jobs. Please try again.', 'error');
        }
    }
    
    displayJobs(career, jobs) {
        const container = document.getElementById('jobs-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-2">${jobs.length} Jobs for "${career}"</h1>
                <p class="text-muted">Browse the latest job opportunities</p>
            </div>
            
            ${jobs.length > 0 ? `
                <div class="row g-4">
                    ${jobs.map(job => `
                        <div class="col-md-6 col-lg-4">
                            <div class="card h-100 border-0 shadow-sm hover-lift">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <h5 class="card-title mb-0">${job.title}</h5>
                                        ${job.is_remote ? `
                                            <span class="badge bg-success bg-opacity-10 text-success">
                                                Remote
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="mb-3">
                                        <div class="small text-muted">
                                            <i class="bi bi-building me-1"></i> ${job.company}
                                        </div>
                                        <div class="small text-muted">
                                            <i class="bi bi-geo-alt me-1"></i> ${job.location}
                                        </div>
                                    </div>
                                    <p class="card-text small text-muted line-clamp-2">
                                        ${job.description?.substring(0, 120) || 'Job description not available'}...
                                    </p>
                                    ${job.salary_min && job.salary_max ? `
                                        <div class="mb-3">
                                            <div class="small text-muted">Estimated Salary:</div>
                                            <strong>$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}</strong>
                                        </div>
                                    ` : ''}
                                    <a href="${job.redirect_url || job.url || '#'}" 
                                       target="_blank"
                                       class="btn btn-outline-primary w-100">
                                        Apply Now
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-5">
                    <i class="bi bi-briefcase display-4 text-muted opacity-50"></i>
                    <p class="mt-3 text-muted">No jobs found for "${career}"</p>
                    <p class="small text-muted">Try adjusting your search criteria or check back later</p>
                </div>
            `}
        `;
    }
    
    async loadFeaturedJobs() {
        try {
            // Load featured jobs for multiple categories
            const featuredJobs = [
                ...await this.jobMarket.fetchJobsByCareer('Software Developer', 'us', 4),
                ...await this.jobMarket.fetchJobsByCareer('Data Analyst', 'us', 2),
                ...await this.jobMarket.fetchJobsByCareer('Project Manager', 'us', 2)
            ];
            
            this.displayFeaturedJobs(featuredJobs);
            
        } catch (error) {
            console.error('Error loading featured jobs:', error);
            ErrorHandler.showUserError('Could not load jobs. Please try again.', 'error');
        }
    }
    
    displayFeaturedJobs(jobs) {
        const container = document.getElementById('jobs-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="mb-4">
                <h1 class="mb-2">Featured Job Opportunities</h1>
                <p class="text-muted">Browse the latest job openings across various industries</p>
            </div>
            
            <!-- Job Categories -->
            <div class="row g-4 mb-5">
                <div class="col-md-3 col-6">
                    <a href="jobs.html?career=Software+Developer" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-code-slash display-6 text-primary mb-3"></i>
                                <h6 class="card-title mb-0">Technology</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3 col-6">
                    <a href="jobs.html?career=Data+Analyst" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-bar-chart display-6 text-success mb-3"></i>
                                <h6 class="card-title mb-0">Data & Analytics</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3 col-6">
                    <a href="jobs.html?career=Project+Manager" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-clipboard-check display-6 text-info mb-3"></i>
                                <h6 class="card-title mb-0">Project Management</h6>
                            </div>
                        </div>
                    </a>
                </div>
                <div class="col-md-3 col-6">
                    <a href="jobs.html?career=Marketing+Manager" class="text-decoration-none">
                        <div class="card border-0 shadow-sm hover-lift text-center h-100">
                            <div class="card-body">
                                <i class="bi bi-megaphone display-6 text-warning mb-3"></i>
                                <h6 class="card-title mb-0">Marketing</h6>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            
            <!-- Featured Jobs -->
            <h3 class="mb-4">Recently Posted Jobs</h3>
            <div class="row g-4">
                ${jobs.slice(0, 8).map(job => `
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm hover-lift">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0 text-truncate" title="${job.title}">
                                        ${job.title}
                                    </h6>
                                    ${job.is_remote ? `
                                        <span class="badge bg-success bg-opacity-10 text-success ms-2" 
                                              style="font-size: 0.65rem;">
                                            Remote
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="small text-muted mb-2">
                                    ${job.company}
                                </div>
                                <p class="card-text small text-muted line-clamp-2">
                                    ${job.description?.substring(0, 80) || ''}...
                                </p>
                                <a href="${job.redirect_url || job.url || '#'}" 
                                   target="_blank"
                                   class="btn btn-sm btn-outline-primary w-100 mt-2">
                                    View Job
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async loadUserProfile() {
        try {
            // Load user profile data
            if (!AppState.currentUser) {
                window.location.href = 'auth.html?redirect=profile.html';
                return;
            }
            
            const userDoc = await FirebaseServices.db
                .collection('users')
                .doc(AppState.currentUser.uid)
                .get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.displayUserProfile(userData);
            }
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            ErrorHandler.showUserError('Could not load profile. Please try again.', 'error');
        }
    }
    
    displayUserProfile(userData) {
        const container = document.getElementById('profile-container');
        if (!container) return;
        
        const profileCompletion = this.calculateProfileCompletion(userData);
        
        container.innerHTML = `
            <div class="row">
                <!-- Profile Info -->
                <div class="col-lg-4">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body text-center">
                            <div class="avatar-wrapper mb-3">
                                ${userData.avatar ? `
                                    <img src="${userData.avatar}" 
                                         class="rounded-circle" 
                                         style="width: 120px; height: 120px; object-fit: cover;"
                                         alt="${userData.name}">
                                ` : `
                                    <div class="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" 
                                         style="width: 120px; height: 120px; margin: 0 auto;">
                                        <span class="display-4">
                                            ${userData.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                `}
                            </div>
                            <h3 class="card-title mb-1">${userData.name || 'User'}</h3>
                            <p class="text-muted mb-3">${userData.email || ''}</p>
                            
                            <!-- Profile Completion -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="small text-muted">Profile Completion</span>
                                    <span class="small text-muted">${profileCompletion}%</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-success" 
                                         style="width: ${profileCompletion}%"></div>
                                </div>
                            </div>
                            
                            <button class="btn btn-outline-primary w-100" onclick="editProfile()">
                                <i class="bi bi-pencil me-2"></i>Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Profile Details -->
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h4 class="card-title mb-4">Profile Information</h4>
                            
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label text-muted">Career Interests</label>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(userData.careerInterests || []).map(interest => `
                                            <span class="badge bg-primary bg-opacity-10 text-primary p-2">
                                                ${interest}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="form-label text-muted">Skills</label>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(userData.skills || []).map(skill => `
                                            <span class="badge bg-success bg-opacity-10 text-success p-2">
                                                ${typeof skill === 'object' ? skill.name : skill}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="form-label text-muted">Education</label>
                                    <div>
                                        ${userData.education || 'Not specified'}
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="form-label text-muted">Experience Level</label>
                                    <div>
                                        ${userData.experience || 'Not specified'}
                                    </div>
                                </div>
                                
                                <div class="col-md-12">
                                    <label class="form-label text-muted">Career Goals</label>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(userData.careerGoals || []).map(goal => `
                                            <span class="badge bg-info bg-opacity-10 text-info p-2">
                                                ${goal}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    calculateProfileCompletion(userData) {
        // Simplified version for display
        const fields = ['name', 'email', 'careerInterests', 'skills'];
        let completed = 0;
        
        fields.forEach(field => {
            if (userData[field]) {
                if (Array.isArray(userData[field]) && userData[field].length > 0) {
                    completed++;
                } else if (typeof userData[field] === 'string' && userData[field].trim()) {
                    completed++;
                }
            }
        });
        
        return Math.round((completed / fields.length) * 100);
    }
    
    // Utility method to calculate profile completion
    calculateProfileCompletion(userData) {
        const fields = [
            'name', 'email', 'careerInterests', 'education', 
            'experience', 'skills', 'careerGoals'
        ];
        
        let completed = 0;
        fields.forEach(field => {
            if (userData[field]) {
                if (Array.isArray(userData[field]) && userData[field].length > 0) {
                    completed++;
                } else if (typeof userData[field] === 'string' && userData[field].trim()) {
                    completed++;
                } else if (typeof userData[field] === 'object' && Object.keys(userData[field]).length > 0) {
                    completed++;
                }
            }
        });
        
        return Math.round((completed / fields.length) * 100);
    }
}

// ============================================
// 8. GLOBAL EXPORTS AND INITIALIZATION
// ============================================

// Export for use in other files
window.CareerAPIs = {
    OnetAPIManager,
    NewsIntegrationManager,
    JobMarketManager,
    DashboardEnhancementManager,
    PerformanceOptimizer,
    ErrorHandler
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    // Wait a bit for Firebase to initialize if it exists
    const initApp = () => {
        try {
            window.CareerApp = new CareerGuidanceApp();
            console.log('🎉 Career Guidance App initialized');
        } catch (error) {
            console.error('Failed to initialize Career Guidance App:', error);
            ErrorHandler.showUserError(
                'Failed to initialize application. Please refresh the page.',
                'error'
            );
        }
    };
    
    // If Firebase is already loaded, initialize immediately
    if (typeof FirebaseServices !== 'undefined' && FirebaseServices.auth) {
        initApp();
    } else {
        // Otherwise wait a bit and try again
        setTimeout(initApp, 1000);
    }
});

// Global utility functions
window.viewCareerDetails = function(careerId) {
    window.location.href = `careers.html?id=${careerId}`;
};

window.exploreJobs = function(careerTitle) {
    window.location.href = `jobs.html?career=${encodeURIComponent(careerTitle)}`;
};

window.viewJobsByField = function(field) {
    window.location.href = `jobs.html?career=${encodeURIComponent(field)}`;
};

window.refreshDashboard = function() {
    if (window.CareerApp && window.CareerApp.dashboard) {
        window.CareerApp.dashboard.initializeDashboard();
        ErrorHandler.showToast('Dashboard refreshed', 'success');
    }
};

window.refreshMarketData = function() {
    if (window.CareerApp && window.CareerApp.dashboard) {
        window.CareerApp.dashboard.loadJobMarketData();
        ErrorHandler.showToast('Market data refreshed', 'info');
    }
};

window.refreshNews = function() {
    if (window.CareerApp && window.CareerApp.dashboard) {
        window.CareerApp.dashboard.loadCareerNews();
        ErrorHandler.showToast('News refreshed', 'info');
    }
};

window.editProfile = function() {
    // This would open a profile edit modal
    console.log('Edit profile clicked');
    // Implement profile editing logic here
};

// Add CSS for enhanced styling
const style = document.createElement('style');
style.textContent = `
    /* Enhanced CSS for Career Guidance App */
    
    /* Theme variables */
    :root {
        --primary-color: #0d6efd;
        --secondary-color: #6c757d;
        --success-color: #198754;
        --info-color: #0dcaf0;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
        --light-color: #f8f9fa;
        --dark-color: #212529;
    }
    
    [data-theme="dark"] {
        --primary-color: #0d6efd;
        --secondary-color: #6c757d;
        --success-color: #198754;
        --info-color: #0dcaf0;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
        --light-color: #212529;
        --dark-color: #f8f9fa;
    }
    
    /* Line clamping */
    .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    /* Hover lift effect */
    .hover-lift {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Avatar initials */
    .avatar-initials {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--primary-color);
        color: white;
        font-weight: bold;
        border-radius: 50%;
    }
    
    /* Icon wrapper */
    .icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 10px;
    }
    
    /* Timeline */
    .timeline {
        position: relative;
        padding-left: 20px;
    }
    
    .timeline::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: #e9ecef;
    }
    
    .timeline-item {
        position: relative;
        padding-left: 30px;
    }
    
    .timeline-item::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: var(--primary-color);
        border: 3px solid white;
        box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
    }
    
    .timeline-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Loading animations */
    .dashboard.loading {
        opacity: 0.6;
        pointer-events: none;
    }
    
    /* Progress bars */
    .progress {
        overflow: hidden;
        border-radius: 10px;
    }
    
    .progress-bar {
        border-radius: 10px;
    }
    
    /* Card enhancements */
    .card {
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    .card-header {
        border-radius: 12px 12px 0 0 !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    /* Badge enhancements */
    .badge {
        border-radius: 6px;
        font-weight: 500;
        padding: 0.35em 0.65em;
    }
    
    /* Button enhancements */
    .btn {
        border-radius: 8px;
        font-weight: 500;
    }
    
    .btn-sm {
        border-radius: 6px;
    }
    
    /* Form enhancements */
    .form-control, .form-select {
        border-radius: 8px;
        border: 1px solid #dee2e6;
        padding: 0.5rem 0.75rem;
    }
    
    .form-control:focus, .form-select:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }
    
    /* Table enhancements */
    .table {
        --bs-table-striped-bg: rgba(0, 0, 0, 0.02);
    }
    
    .table-hover tbody tr:hover {
        background-color: rgba(13, 110, 253, 0.05);
    }
    
    /* Alert enhancements */
    .alert {
        border-radius: 10px;
        border: none;
    }
    
    /* Toast enhancements */
    .toast {
        border-radius: 10px;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    /* List group enhancements */
    .list-group-item {
        border-radius: 8px;
        margin-bottom: 4px;
        border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    /* Scroll animations */
    .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-on-scroll.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .display-6 {
            font-size: 2rem;
        }
        
        .card-body {
            padding: 1rem;
        }
    }
    
    /* Print styles */
    @media print {
        .no-print {
            display: none !important;
        }
        
        .card {
            border: 1px solid #ddd;
            box-shadow: none;
        }
    }
`;
document.head.appendChild(style);

// Add polyfill for older browsers
if (!window.Promise.allSettled) {
    window.Promise.allSettled = function(promises) {
        return Promise.all(promises.map(p => Promise.resolve(p).then(
            value => ({ status: 'fulfilled', value }),
            reason => ({ status: 'rejected', reason })
        )));
    };
}

// Ensure AppState exists
if (!window.AppState) {
    window.AppState = {
        currentUser: null,
        userProfile: null,
        theme: 'light',
        offlineMode: false
    };
}

// Export the main app class
window.CareerGuidanceApp = CareerGuidanceApp;

console.log('📦 Career Guidance App bundle loaded successfully');