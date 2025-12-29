class AssessmentManager {
    constructor() {
        this.currentQuestion = 0;
        this.answers = {};
        this.questions = [];
        this.assessmentType = 'holland_code';
        this.riasecScores = {
            R: 0, // Realistic
            I: 0, // Investigative
            A: 0, // Artistic
            S: 0, // Social
            E: 0, // Enterprising
            C: 0  // Conventional
        };
        
        this.initAssessment();
        this.loadQuestions();
    }
    
    async loadQuestions() {
        try {
            // Try to load from localStorage first
            const cachedQuestions = localStorage.getItem('assessment_questions');
            const cacheTimestamp = localStorage.getItem('questions_timestamp');
            
            // Check if cache is valid (less than 24 hours old)
            const isCacheValid = cacheTimestamp && 
                (Date.now() - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000;
            
            if (cachedQuestions && isCacheValid) {
                this.questions = JSON.parse(cachedQuestions);
                this.renderQuestion();
                return;
            }
            
            // Load from Firestore
            const questionsSnapshot = await FirebaseServices.db
                .collection('assessments')
                .where('type', '==', this.assessmentType)
                .orderBy('order')
                .get();
            
            if (!questionsSnapshot.empty) {
                this.questions = questionsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Cache questions
                localStorage.setItem('assessment_questions', JSON.stringify(this.questions));
                localStorage.setItem('questions_timestamp', Date.now().toString());
                
                this.renderQuestion();
            } else {
                // Use default questions if none in database
                this.loadDefaultQuestions();
            }
            
        } catch (error) {
            console.error('Error loading questions:', error);
            this.loadDefaultQuestions();
        }
    }
    
    loadDefaultQuestions() {
        this.questions = [
            {
                id: 1,
                text: "I enjoy working with tools and machinery",
                category: 'R',
                options: [
                    { value: 5, text: "Strongly Agree" },
                    { value: 4, text: "Agree" },
                    { value: 3, text: "Neutral" },
                    { value: 2, text: "Disagree" },
                    { value: 1, text: "Strongly Disagree" }
                ]
            },
            {
                id: 2,
                text: "I like solving complex problems",
                category: 'I',
                options: [
                    { value: 5, text: "Strongly Agree" },
                    { value: 4, text: "Agree" },
                    { value: 3, text: "Neutral" },
                    { value: 2, text: "Disagree" },
                    { value: 1, text: "Strongly Disagree" }
                ]
            },
            // Add more default questions...
        ];
        
        this.renderQuestion();
    }
    
    initAssessment() {
        // Initialize progress bar
        this.updateProgressBar();
        
        // Initialize event listeners
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('submit-btn')?.addEventListener('click', () => this.submitAssessment());
        
        // Restore previous answers from localStorage
        this.restoreAnswers();
    }
    
    renderQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.showResults();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        const questionContainer = document.getElementById('question-container');
        
        if (!questionContainer) return;
        
        const progressPercentage = ((this.currentQuestion + 1) / this.questions.length) * 100;
        
        questionContainer.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-primary">Question ${this.currentQuestion + 1} of ${this.questions.length}</span>
                            <span class="text-muted">${question.category}</span>
                        </div>
                        
                        <div class="progress mb-4" style="height: 10px;">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                 style="width: ${progressPercentage}%"></div>
                        </div>
                        
                        <h4 class="card-title mb-4">${question.text}</h4>
                        
                        <div class="options-container">
                            ${question.options.map((option, index) => `
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="radio" 
                                           name="answer" 
                                           id="option-${index}" 
                                           value="${option.value}"
                                           ${this.answers[question.id] === option.value ? 'checked' : ''}>
                                    <label class="form-check-label" for="option-${index}">
                                        ${option.text}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-4">
                        <button id="prev-btn" class="btn btn-outline-secondary" 
                                ${this.currentQuestion === 0 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-left"></i> Previous
                        </button>
                        
                        ${this.currentQuestion < this.questions.length - 1 ? `
                            <button id="next-btn" class="btn btn-primary">
                                Next <i class="bi bi-arrow-right"></i>
                            </button>
                        ` : `
                            <button id="submit-btn" class="btn btn-success">
                                Submit Assessment <i class="bi bi-check-circle"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        
        // Re-attach event listeners
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('submit-btn')?.addEventListener('click', () => this.submitAssessment());
        
        // Update progress bar
        this.updateProgressBar();
        
        // Save answers when option is selected
        const radioInputs = document.querySelectorAll('input[name="answer"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.answers[question.id] = parseInt(e.target.value);
                this.saveAnswers();
            });
        });
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
    
    updateProgressBar() {
        const progressPercentage = ((this.currentQuestion + 1) / this.questions.length) * 100;
        const progressBar = document.getElementById('assessment-progress');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.setAttribute('aria-valuenow', progressPercentage);
        }
    }
    
    saveAnswers() {
        localStorage.setItem('assessment_answers', JSON.stringify(this.answers));
        localStorage.setItem('current_question', this.currentQuestion.toString());
    }
    
    restoreAnswers() {
        const savedAnswers = localStorage.getItem('assessment_answers');
        const savedQuestion = localStorage.getItem('current_question');
        
        if (savedAnswers) {
            this.answers = JSON.parse(savedAnswers);
        }
        
        if (savedQuestion) {
            this.currentQuestion = parseInt(savedQuestion);
        }
    }
    
    calculateScores() {
        // Reset scores
        this.riasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        
        // Calculate scores based on answers
        this.questions.forEach(question => {
            const answer = this.answers[question.id];
            if (answer && question.category) {
                this.riasecScores[question.category] += answer;
            }
        });
        
        // Normalize scores
        const totalQuestions = Object.keys(this.answers).length;
        if (totalQuestions > 0) {
            Object.keys(this.riasecScores).forEach(key => {
                this.riasecScores[key] = Math.round((this.riasecScores[key] / (totalQuestions * 5)) * 100);
            });
        }
        
        return this.riasecScores;
    }
    
    async submitAssessment() {
        if (!AppState.currentUser) {
            alert('Please login to submit your assessment');
            window.location.href = 'auth.html';
            return;
        }
        
        // Calculate final scores
        const scores = this.calculateScores();
        
        try {
            // Save assessment results to Firestore
            const resultRef = await FirebaseServices.db.collection('results').add({
                userId: AppState.currentUser.uid,
                assessmentType: this.assessmentType,
                scores: scores,
                answers: this.answers,
                totalScore: Object.values(scores).reduce((a, b) => a + b, 0),
                completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                recommendedCareers: await this.generateRecommendations(scores)
            });
            
            // Update user's assessment history
            await FirebaseServices.db.collection('users').doc(AppState.currentUser.uid).update({
                assessmentHistory: firebase.firestore.FieldValue.arrayUnion(resultRef.id)
            });
            
            // Clear localStorage
            localStorage.removeItem('assessment_answers');
            localStorage.removeItem('current_question');
            
            // Show results
            this.showResults(scores, resultRef.id);
            
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('Error submitting assessment. Please try again.');
        }
    }
    
    async generateRecommendations(scores) {
        // Get top 3 RIASEC categories
        const topCategories = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);
        
        // Query careers matching top categories
        const careersSnapshot = await FirebaseServices.db
            .collection('careers')
            .where('riasecCodes', 'array-contains-any', topCategories)
            .limit(5)
            .get();
        
        return careersSnapshot.docs.map(doc => ({
            careerId: doc.id,
            title: doc.data().title,
            matchScore: this.calculateMatchScore(doc.data(), scores)
        })).sort((a, b) => b.matchScore - a.matchScore);
    }
    
    calculateMatchScore(career, scores) {
        let matchScore = 0;
        career.riasecCodes?.forEach(code => {
            matchScore += scores[code] || 0;
        });
        return matchScore;
    }
    
    showResults(scores, resultId) {
        const questionContainer = document.getElementById('question-container');
        if (!questionContainer) return;
        
        if (!scores) {
            scores = this.calculateScores();
        }
        
        // Create radar chart
        const ctx = document.getElementById('results-chart');
        if (ctx) {
            new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
                    datasets: [{
                        label: 'Your RIASEC Scores',
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
                            suggestedMax: 100
                        }
                    }
                }
            });
        }
        
        // Show results page
        questionContainer.innerHTML = `
            <div class="card shadow-lg">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0"><i class="bi bi-trophy"></i> Assessment Complete!</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-4">
                                <h5>Your RIASEC Profile</h5>
                                <canvas id="results-chart" height="300"></canvas>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-4">
                                <h5>Top Career Categories</h5>
                                ${Object.entries(scores)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([category, score]) => `
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span class="badge bg-primary">${this.getCategoryName(category)}</span>
                                            <span class="fw-bold">${score}%</span>
                                        </div>
                                        <div class="progress mb-3" style="height: 20px;">
                                            <div class="progress-bar" role="progressbar" 
                                                 style="width: ${score}%"></div>
                                        </div>
                                    `).join('')}
                            </div>
                            
                            <div class="text-center mt-4">
                                <p class="lead">Your results have been saved!</p>
                                <div class="d-flex justify-content-center gap-2">
                                    <a href="dashboard.html" class="btn btn-primary">
                                        <i class="bi bi-house"></i> Go to Dashboard
                                    </a>
                                    <a href="careers.html" class="btn btn-outline-primary">
                                        <i class="bi bi-search"></i> Explore Careers
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize chart for results
        setTimeout(() => {
            new Chart(document.getElementById('results-chart').getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
                    datasets: [{
                        label: 'Your RIASEC Scores',
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
                            suggestedMax: 100
                        }
                    }
                }
            });
        }, 100);
    }
    
    getCategoryName(code) {
        const categories = {
            'R': 'Realistic',
            'I': 'Investigative',
            'A': 'Artistic',
            'S': 'Social',
            'E': 'Enterprising',
            'C': 'Conventional'
        };
        return categories[code] || code;
    }
}

// Initialize assessment when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AssessmentManager();
});