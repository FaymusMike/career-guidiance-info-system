// ============================================
// ASSESSMENT.JS - AI-Enhanced Assessment Engine
// ============================================

class AIEnhancedAssessment {
    constructor() {
        this.questions = [];
        this.currentQuestion = 0;
        this.answers = {};
        this.riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        this.aiEnabled = true; // Toggle AI question generation
        
        this.init();
    }
    
    async init() {
        await this.loadQuestions();
        this.setupAssessmentUI();
        this.setupEventListeners();
    }
    
    async loadQuestions() {
        // Try to load from cache first
        const cachedQuestions = localStorage.getItem('assessment_questions');
        const cacheTime = localStorage.getItem('questions_cache_time');
        
        if (cachedQuestions && cacheTime && 
            (Date.now() - parseInt(cacheTime)) < 7 * 24 * 60 * 60 * 1000) {
            this.questions = JSON.parse(cachedQuestions);
            return;
        }
        
        // Generate questions using AI or fallback
        this.questions = await this.generateQuestionsWithAI();
        
        // Cache the questions
        localStorage.setItem('assessment_questions', JSON.stringify(this.questions));
        localStorage.setItem('questions_cache_time', Date.now().toString());
    }
    
    async generateQuestionsWithAI() {
        if (!this.aiEnabled) {
            return this.getStandardQuestions();
        }
        
        try {
            // Using a free AI service (Example using OpenRouter with free tier)
            const aiQuestions = await this.fetchAIQuestions();
            if (aiQuestions && aiQuestions.length >= 30) {
                return aiQuestions;
            }
        } catch (error) {
            console.warn('AI question generation failed:', error);
        }
        
        // Fallback to standard questions
        return this.getStandardQuestions();
    }
    
    async fetchAIQuestions() {
        // Using a free AI API (OpenRouter, Hugging Face, etc.)
        // IMPORTANT: Use only free tiers and respect rate limits
        
        const apiConfig = {
            // Example using Hugging Face Inference API (free)
            HUGGING_FACE: {
                url: 'https://api-inference.huggingface.co/models/gpt2',
                apiKey: 'YOUR_HUGGING_FACE_TOKEN' // Get from huggingface.co
            },
            // Alternative: OpenRouter (has free tier)
            OPENROUTER: {
                url: 'https://openrouter.ai/api/v1/chat/completions',
                apiKey: 'YOUR_OPENROUTER_KEY' // Get from openrouter.ai
            }
        };
        
        try {
            // Simple prompt for career assessment questions
            const prompt = `Generate 30 career assessment questions based on the RIASEC model (Realistic, Investigative, Artistic, Social, Enterprising, Conventional). 
            Each question should help identify a person's interests and aptitudes.
            Return as JSON array with: id, text, category (R/I/A/S/E/C), and options array with value (1-5) and text.
            Distribute questions evenly across all 6 categories.`;
            
            // Using Hugging Face Inference API
            const response = await fetch(apiConfig.HUGGING_FACE.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiConfig.HUGGING_FACE.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_length: 2000,
                        temperature: 0.7
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('AI API error');
            }
            
            const result = await response.json();
            
            // Parse AI response (simplified - adjust based on actual API response)
            return this.parseAIResponse(result);
            
        } catch (error) {
            console.error('AI fetch error:', error);
            throw error;
        }
    }
    
    parseAIResponse(aiData) {
        // This is a simplified parser - adjust based on actual API response format
        try {
            // Extract text from response
            const text = aiData[0]?.generated_text || JSON.stringify(aiData);
            
            // Try to extract JSON array
            const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                if (Array.isArray(questions) && questions.length >= 30) {
                    return questions.slice(0, 30);
                }
            }
            
            // If no valid JSON, generate from template
            return this.generateFromTemplate(text);
            
        } catch (error) {
            console.error('AI response parsing error:', error);
            return this.getStandardQuestions();
        }
    }
    
    generateFromTemplate(aiText) {
        // Extract keywords and generate questions
        const categories = {
            'R': ['tools', 'machinery', 'hands-on', 'physical', 'building', 'repairing'],
            'I': ['analyzing', 'researching', 'investigating', 'solving', 'experimenting'],
            'A': ['creating', 'designing', 'expressing', 'performing', 'improvising'],
            'S': ['helping', 'teaching', 'caring', 'listening', 'cooperating'],
            'E': ['leading', 'persuading', 'organizing', 'managing', 'negotiating'],
            'C': ['organizing', 'calculating', 'systematizing', 'detail-oriented', 'following procedures']
        };
        
        const questions = [];
        let id = 1;
        
        Object.entries(categories).forEach(([category, keywords]) => {
            for (let i = 0; i < 5; i++) {
                questions.push({
                    id: id++,
                    text: this.generateQuestionText(category, keywords, i),
                    category: category,
                    options: this.getStandardOptions()
                });
            }
        });
        
        return questions;
    }
    
    generateQuestionText(category, keywords, index) {
        const templates = {
            'R': [
                `I enjoy working with ${keywords[0]} and ${keywords[1]}`,
                `Using ${keywords[2]} to fix or build things appeals to me`,
                `I prefer ${keywords[3]} activities over desk work`,
                `Working with ${keywords[4]} gives me satisfaction`,
                `I like seeing ${keywords[5]} results from my work`
            ],
            'I': [
                `I enjoy ${keywords[0]} complex problems`,
                `${keywords[1]} new information excites me`,
                `I like ${keywords[2]} how things work`,
                `${keywords[3]} with data and statistics interests me`,
                `I prefer ${keywords[4]} to guessing`
            ],
            'A': [
                `I enjoy ${keywords[0]} artistic works`,
                `${keywords[1]} original content appeals to me`,
                `I like ${keywords[2]} myself creatively`,
                `${keywords[3]} in front of others is enjoyable`,
                `I appreciate ${keywords[4]} in art and design`
            ],
            'S': [
                `I enjoy ${keywords[0]} others with their problems`,
                `${keywords[1]} skills to others is rewarding`,
                `I like ${keywords[2]} for people in need`,
                `${keywords[3]} to people's concerns comes naturally`,
                `I prefer ${keywords[4]} with others over working alone`
            ],
            'E': [
                `I enjoy ${keywords[0]} teams or projects`,
                `${keywords[1]} others to see my point of view is natural`,
                `I like ${keywords[2]} events or activities`,
                `${keywords[3]} resources effectively is a strength`,
                `I enjoy ${keywords[4]} deals or agreements`
            ],
            'C': [
                `I enjoy ${keywords[0]} information systematically`,
                `${keywords[1]} numbers accurately is important to me`,
                `I like ${keywords[2]} processes and procedures`,
                `${keywords[3]} work appeals to me`,
                `I prefer ${keywords[4]} established guidelines`
            ]
        };
        
        return templates[category][index] || `Question about ${category} interests`;
    }
    
    getStandardQuestions() {
        return [
            // Realistic (R) - 5 questions
            { id: 1, text: "I enjoy working with tools and machinery", category: 'R', options: this.getStandardOptions() },
            { id: 2, text: "Building or fixing things gives me satisfaction", category: 'R', options: this.getStandardOptions() },
            { id: 3, text: "I prefer hands-on work to desk work", category: 'R', options: this.getStandardOptions() },
            { id: 4, text: "Working outdoors appeals to me", category: 'R', options: this.getStandardOptions() },
            { id: 5, text: "I enjoy seeing tangible results from my work", category: 'R', options: this.getStandardOptions() },
            
            // Investigative (I) - 5 questions
            { id: 6, text: "I enjoy solving complex problems", category: 'I', options: this.getStandardOptions() },
            { id: 7, text: "Researching new information excites me", category: 'I', options: this.getStandardOptions() },
            { id: 8, text: "I like analyzing data and statistics", category: 'I', options: this.getStandardOptions() },
            { id: 9, text: "Understanding how things work interests me", category: 'I', options: this.getStandardOptions() },
            { id: 10, text: "I prefer scientific thinking to guessing", category: 'I', options: this.getStandardOptions() },
            
            // Artistic (A) - 5 questions
            { id: 11, text: "I enjoy creating artistic works", category: 'A', options: this.getStandardOptions() },
            { id: 12, text: "Designing original content appeals to me", category: 'A', options: this.getStandardOptions() },
            { id: 13, text: "I like expressing myself creatively", category: 'A', options: this.getStandardOptions() },
            { id: 14, text: "Performing in front of others is enjoyable", category: 'A', options: this.getStandardOptions() },
            { id: 15, text: "I appreciate innovation in art and design", category: 'A', options: this.getStandardOptions() },
            
            // Social (S) - 5 questions
            { id: 16, text: "I enjoy helping others with their problems", category: 'S', options: this.getStandardOptions() },
            { id: 17, text: "Teaching skills to others is rewarding", category: 'S', options: this.getStandardOptions() },
            { id: 18, text: "I like caring for people in need", category: 'S', options: this.getStandardOptions() },
            { id: 19, text: "Listening to people's concerns comes naturally", category: 'S', options: this.getStandardOptions() },
            { id: 20, text: "I prefer working with others over working alone", category: 'S', options: this.getStandardOptions() },
            
            // Enterprising (E) - 5 questions
            { id: 21, text: "I enjoy leading teams or projects", category: 'E', options: this.getStandardOptions() },
            { id: 22, text: "Persuading others to see my point of view is natural", category: 'E', options: this.getStandardOptions() },
            { id: 23, text: "I like organizing events or activities", category: 'E', options: this.getStandardOptions() },
            { id: 24, text: "Managing resources effectively is a strength", category: 'E', options: this.getStandardOptions() },
            { id: 25, text: "I enjoy negotiating deals or agreements", category: 'E', options: this.getStandardOptions() },
            
            // Conventional (C) - 5 questions
            { id: 26, text: "I enjoy organizing information systematically", category: 'C', options: this.getStandardOptions() },
            { id: 27, text: "Calculating numbers accurately is important to me", category: 'C', options: this.getStandardOptions() },
            { id: 28, text: "I like following processes and procedures", category: 'C', options: this.getStandardOptions() },
            { id: 29, text: "Detail-oriented work appeals to me", category: 'C', options: this.getStandardOptions() },
            { id: 30, text: "I prefer following established guidelines", category: 'C', options: this.getStandardOptions() }
        ];
    }
    
    getStandardOptions() {
        return [
            { value: 5, text: "Strongly Agree" },
            { value: 4, text: "Agree" },
            { value: 3, text: "Neutral" },
            { value: 2, text: "Disagree" },
            { value: 1, text: "Strongly Disagree" }
        ];
    }
    
    setupAssessmentUI() {
        const container = document.getElementById('question-container');
        if (!container) return;
        
        this.renderQuestion();
    }
    
    renderQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        const container = document.getElementById('question-container');
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        
        container.innerHTML = `
            <div class="card shadow-lg border-0">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Career Assessment</h5>
                        <span class="badge bg-light text-primary">${question.category} Category</span>
                    </div>
                </div>
                <div class="card-body p-4">
                    <!-- Progress -->
                    <div class="mb-4">
                        <div class="d-flex justify-content-between mb-2">
                            <small>Question ${this.currentQuestion + 1} of ${this.questions.length}</small>
                            <small>${Math.round(progress)}% Complete</small>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-success" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <!-- Question -->
                    <h4 class="card-title mb-4">${question.text}</h4>
                    
                    <!-- Options -->
                    <div class="options-container">
                        ${question.options.map((option, index) => `
                            <div class="option-card mb-3 ${this.answers[question.id] === option.value ? 'selected' : ''}"
                                 onclick="assessmentEngine.selectOption(${question.id}, ${option.value})">
                                <div class="d-flex align-items-center p-3 rounded border">
                                    <div class="form-check mb-0 flex-grow-1">
                                        <input class="form-check-input" type="radio" 
                                               name="q${question.id}" 
                                               id="opt${question.id}_${index}"
                                               value="${option.value}"
                                               ${this.answers[question.id] === option.value ? 'checked' : ''}>
                                        <label class="form-check-label ms-2" for="opt${question.id}_${index}">
                                            ${option.text}
                                        </label>
                                    </div>
                                    <div class="option-value">
                                        <span class="badge bg-primary">${option.value}/5</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Navigation -->
                    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
                        <button class="btn btn-outline-secondary ${this.currentQuestion === 0 ? 'disabled' : ''}"
                                onclick="assessmentEngine.prevQuestion()">
                            <i class="bi bi-arrow-left me-2"></i>Previous
                        </button>
                        
                        ${this.currentQuestion < this.questions.length - 1 ? `
                            <button class="btn btn-primary" onclick="assessmentEngine.nextQuestion()">
                                Next Question <i class="bi bi-arrow-right ms-2"></i>
                            </button>
                        ` : `
                            <button class="btn btn-success btn-lg" onclick="assessmentEngine.completeAssessment()">
                                <i class="bi bi-check-circle me-2"></i>Complete Assessment
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    selectOption(questionId, value) {
        this.answers[questionId] = value;
        
        // Update UI
        const optionCards = document.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`input[value="${value}"]`)?.closest('.option-card');
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Save to localStorage
        this.saveProgress();
    }
    
    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        }
    }
    
    prevQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }
    
    async completeAssessment() {
        if (!AppState.currentUser) {
            alert('Please login to save your assessment results');
            window.location.href = 'auth.html';
            return;
        }
        
        // Calculate scores
        this.calculateScores();
        
        try {
            // Save to Firestore
            await this.saveResults();
            
            // Show results
            this.showResults();
            
            // Clear progress
            localStorage.removeItem('assessment_progress');
            
        } catch (error) {
            console.error('Assessment completion error:', error);
            alert('Error saving assessment. Please try again.');
        }
    }
    
    calculateScores() {
        // Reset scores
        this.riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        
        // Calculate for each answered question
        Object.entries(this.answers).forEach(([questionId, value]) => {
            const question = this.questions.find(q => q.id == questionId);
            if (question && question.category) {
                this.riasecScores[question.category] += value;
            }
        });
        
        // Normalize to percentage (max possible score = questions per category * 5)
        const questionsPerCategory = this.questions.length / 6;
        Object.keys(this.riasecScores).forEach(key => {
            this.riasecScores[key] = Math.round((this.riasecScores[key] / (questionsPerCategory * 5)) * 100);
        });
    }
    
    async saveResults() {
        const result = {
            userId: AppState.currentUser.uid,
            scores: this.riasecScores,
            answers: this.answers,
            completedAt: new Date().toISOString(),
            assessmentType: 'RIASEC',
            totalQuestions: this.questions.length,
            answeredQuestions: Object.keys(this.answers).length
        };
        
        // Save to Firestore
        await FirebaseServices.db.collection('assessment_results').add(result);
        
        // Update user profile
        await FirebaseServices.db.collection('users').doc(AppState.currentUser.uid).update({
            lastAssessment: new Date().toISOString(),
            assessmentCount: firebase.firestore.FieldValue.increment(1)
        });
    }
    
    showResults() {
        const container = document.getElementById('question-container');
        if (!container) return;
        
        // Get top 3 categories
        const topCategories = Object.entries(this.riasecScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        container.innerHTML = `
            <div class="card shadow-lg border-0">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0"><i class="bi bi-trophy me-2"></i>Assessment Complete!</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-7">
                            <div class="mb-4">
                                <h5>Your RIASEC Profile</h5>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="results-radar-chart"></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-5">
                            <div class="mb-4">
                                <h5>Top Career Categories</h5>
                                ${topCategories.map(([category, score]) => `
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between mb-1">
                                            <strong>${this.getCategoryName(category)}</strong>
                                            <span>${score}%</span>
                                        </div>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar bg-${this.getCategoryColor(category)}" 
                                                 style="width: ${score}%"></div>
                                        </div>
                                        <small class="text-muted">${this.getCategoryDescription(category)}</small>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="alert alert-info">
                                <h6><i class="bi bi-lightbulb me-2"></i>What This Means:</h6>
                                <p class="mb-0">Your highest scores indicate careers that match your interests. 
                                Explore careers in your top categories for the best fit.</p>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="exploreRecommendedCareers()">
                                    <i class="bi bi-search me-2"></i>Explore Recommended Careers
                                </button>
                                <button class="btn btn-outline-primary" onclick="downloadResults()">
                                    <i class="bi bi-download me-2"></i>Download Results
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- O*NET Attribution -->
                    <div id="assessment-attribution"></div>
                </div>
            </div>
        `;
        
        // Initialize chart
        this.initResultsChart();
        
        // Add O*NET attribution
        if (window.CareerApp && window.CareerApp.onetAPI) {
            window.CareerApp.onetAPI.addAttribution('assessment-attribution');
        }
    }
    
    initResultsChart() {
        const ctx = document.getElementById('results-radar-chart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
                datasets: [{
                    label: 'Your Scores',
                    data: Object.values(this.riasecScores),
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
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
    
    getCategoryName(code) {
        const names = {
            'R': 'Realistic',
            'I': 'Investigative',
            'A': 'Artistic',
            'S': 'Social',
            'E': 'Enterprising',
            'C': 'Conventional'
        };
        return names[code] || code;
    }
    
    getCategoryColor(code) {
        const colors = {
            'R': 'danger',
            'I': 'primary',
            'A': 'warning',
            'S': 'success',
            'E': 'info',
            'C': 'secondary'
        };
        return colors[code] || 'primary';
    }
    
    getCategoryDescription(code) {
        const descriptions = {
            'R': 'Practical, hands-on, technical work',
            'I': 'Analytical, scientific, investigative work',
            'A': 'Creative, artistic, expressive work',
            'S': 'Helping, teaching, caring for others',
            'E': 'Leading, persuading, business-oriented work',
            'C': 'Organized, detail-oriented, systematic work'
        };
        return descriptions[code] || '';
    }
    
    saveProgress() {
        const progress = {
            currentQuestion: this.currentQuestion,
            answers: this.answers,
            timestamp: Date.now()
        };
        localStorage.setItem('assessment_progress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('assessment_progress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentQuestion = progress.currentQuestion || 0;
            this.answers = progress.answers || {};
        }
    }
    
    setupEventListeners() {
        // Load any saved progress
        this.loadProgress();
    }
}

// Global instance
let assessmentEngine = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('assessment.html')) {
        assessmentEngine = new AIEnhancedAssessment();
        window.assessmentEngine = assessmentEngine;
    }
});

// Global functions for HTML onclick
window.exploreRecommendedCareers = function() {
    if (assessmentEngine && assessmentEngine.riasecScores) {
        const topCode = Object.entries(assessmentEngine.riasecScores)
            .sort((a, b) => b[1] - a[1])[0][0];
        window.location.href = `careers.html?interest=${topCode}`;
    } else {
        window.location.href = 'careers.html';
    }
};

window.downloadResults = function() {
    if (!assessmentEngine) return;
    
    const results = {
        assessmentDate: new Date().toISOString(),
        scores: assessmentEngine.riasecScores,
        topCategories: Object.entries(assessmentEngine.riasecScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([code, score]) => ({
                code,
                name: assessmentEngine.getCategoryName(code),
                score,
                description: assessmentEngine.getCategoryDescription(code)
            }))
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `career-assessment-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Results downloaded successfully!');
};