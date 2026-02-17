// ============================================
// ASSESSMENT.JS - Complete RIASEC Career Assessment
// ============================================

// Assessment State
const AssessmentState = {
    currentQuestion: 0,
    answers: {},
    questions: [],
    results: null,
    completed: false
};

// RIASEC Assessment Questions (Based on Holland Code theory)
const RIASECQuestions = [
    // Realistic (R) - 4 questions
    { text: "I enjoy working with tools, machines, or equipment.", type: "R", category: "Realistic" },
    { text: "I prefer hands-on activities like building or repairing things.", type: "R", category: "Realistic" },
    { text: "I like working outdoors or being physically active.", type: "R", category: "Realistic" },
    { text: "I enjoy practical, systematic work that produces tangible results.", type: "R", category: "Realistic" },
    
    // Investigative (I) - 4 questions
    { text: "I enjoy solving complex problems and puzzles.", type: "I", category: "Investigative" },
    { text: "I like analyzing data and conducting research.", type: "I", category: "Investigative" },
    { text: "I prefer working independently on intellectual challenges.", type: "I", category: "Investigative" },
    { text: "I enjoy learning about scientific or mathematical concepts.", type: "I", category: "Investigative" },
    
    // Artistic (A) - 4 questions
    { text: "I enjoy creative activities like writing, art, or music.", type: "A", category: "Artistic" },
    { text: "I like expressing myself through original ideas.", type: "A", category: "Artistic" },
    { text: "I prefer flexible, unstructured work environments.", type: "A", category: "Artistic" },
    { text: "I enjoy designing or creating new things.", type: "A", category: "Artistic" },
    
    // Social (S) - 4 questions
    { text: "I enjoy helping, teaching, or counseling others.", type: "S", category: "Social" },
    { text: "I like working in teams and collaborating with people.", type: "S", category: "Social" },
    { text: "I prefer jobs that involve personal interaction and service.", type: "S", category: "Social" },
    { text: "I am empathetic and enjoy understanding others' feelings.", type: "S", category: "Social" },
    
    // Enterprising (E) - 4 questions
    { text: "I enjoy leading, persuading, or influencing people.", type: "E", category: "Enterprising" },
    { text: "I like taking risks and starting new projects.", type: "E", category: "Enterprising" },
    { text: "I prefer competitive environments with clear goals.", type: "E", category: "Enterprising" },
    { text: "I enjoy selling, negotiating, or public speaking.", type: "E", category: "Enterprising" },
    
    // Conventional (C) - 4 questions
    { text: "I enjoy organizing data and working with details.", type: "C", category: "Conventional" },
    { text: "I prefer structured tasks with clear instructions.", type: "C", category: "Conventional" },
    { text: "I like maintaining records and following procedures.", type: "C", category: "Conventional" },
    { text: "I value accuracy, orderliness, and efficiency.", type: "C", category: "Conventional" }
];

// Initialize assessment when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on assessment page
    if (window.location.pathname.includes('assessment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('result');

        if (resultId) {
            // Show results page
            loadAssessmentResult(resultId);
        }
    }
});

function getAssessmentContainer() {
    return document.getElementById('assessment-container') || document.getElementById('question-container');
}

function initializeAssessment() {
    AssessmentState.questions = RIASECQuestions;
    AssessmentState.currentQuestion = 0;
    AssessmentState.answers = {};
    
    renderQuestion();
    updateProgress();
}

function renderQuestion() {
    const container = getAssessmentContainer();
    if (!container) return;

    const q = AssessmentState.questions[AssessmentState.currentQuestion];
    const questionNumber = AssessmentState.currentQuestion + 1;
    const totalQuestions = AssessmentState.questions.length;

    container.innerHTML = `
        <div class="assessment-card">
            <div class="progress mb-4" style="height: 8px;">
                <div class="progress-bar bg-primary" 
                     style="width: ${(questionNumber / totalQuestions) * 100}%"></div>
            </div>
            
            <div class="text-center mb-4">
                <span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                    Question ${questionNumber} of ${totalQuestions}
                </span>
                <h5 class="mt-3 text-muted">${q.category}</h5>
            </div>
            
            <div class="question-card p-5 text-center">
                <i class="bi bi-question-circle display-1 text-primary mb-4"></i>
                <h3 class="mb-5">${q.text}</h3>
                
                <div class="row g-3 justify-content-center">
                    <div class="col-md-3">
                        <div class="rating-option" onclick="selectOption(1)">
                            <div class="rating-circle">1</div>
                            <small class="text-muted">Strongly<br>Disagree</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="rating-option" onclick="selectOption(2)">
                            <div class="rating-circle">2</div>
                            <small class="text-muted">Disagree</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="rating-option" onclick="selectOption(3)">
                            <div class="rating-circle">3</div>
                            <small class="text-muted">Neutral</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="rating-option" onclick="selectOption(4)">
                            <div class="rating-circle">4</div>
                            <small class="text-muted">Agree</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="rating-option" onclick="selectOption(5)">
                            <div class="rating-circle">5</div>
                            <small class="text-muted">Strongly<br>Agree</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-between mt-4">
                <button class="btn btn-outline-secondary px-4" 
                        onclick="previousQuestion()" 
                        ${AssessmentState.currentQuestion === 0 ? 'disabled' : ''}>
                    <i class="bi bi-arrow-left me-2"></i>Previous
                </button>
                <button class="btn btn-primary px-4" 
                        onclick="nextQuestion()"
                        ${!AssessmentState.answers[AssessmentState.currentQuestion] ? 'disabled' : ''}>
                    ${AssessmentState.currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'} 
                    <i class="bi bi-arrow-right ms-2"></i>
                </button>
            </div>
        </div>
    `;

    // Highlight selected option if exists
    if (AssessmentState.answers[AssessmentState.currentQuestion]) {
        const selected = AssessmentState.answers[AssessmentState.currentQuestion];
        highlightSelectedOption(selected);
    }
}

function selectOption(value) {
    AssessmentState.answers[AssessmentState.currentQuestion] = value;
    
    // Highlight the selected option
    highlightSelectedOption(value);
    
    // Enable next button
    const nextBtn = document.querySelector('.btn-primary');
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

function highlightSelectedOption(value) {
    // Remove previous highlights
    document.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Highlight selected
    const selectedOption = document.querySelectorAll('.rating-option')[value - 1];
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

function nextQuestion() {
    // Save current answer
    if (!AssessmentState.answers[AssessmentState.currentQuestion]) {
        alert('Please select an answer before proceeding.');
        return;
    }
    
    // Check if this is the last question
    if (AssessmentState.currentQuestion === AssessmentState.questions.length - 1) {
        calculateResults();
    } else {
        // Move to next question
        AssessmentState.currentQuestion++;
        renderQuestion();
    }
}

function previousQuestion() {
    if (AssessmentState.currentQuestion > 0) {
        AssessmentState.currentQuestion--;
        renderQuestion();
    }
}

function calculateResults() {
    // Calculate scores for each RIASEC type
    const scores = {
        'R': 0, // Realistic
        'I': 0, // Investigative
        'A': 0, // Artistic
        'S': 0, // Social
        'E': 0, // Enterprising
        'C': 0  // Conventional
    };
    
    // Sum up scores for each type
    AssessmentState.answers.forEach((score, index) => {
        const type = AssessmentState.questions[index].type;
        scores[type] += score * 20; // Convert 1-5 scale to 20-100
    });
    
    // Average scores (divide by number of questions per type - 4)
    Object.keys(scores).forEach(type => {
        scores[type] = Math.round(scores[type] / 4);
    });
    
    // Generate AI-powered career recommendations
    const recommendations = generateCareerRecommendations(scores);
    
    // Save results
    AssessmentState.results = {
        scores: scores,
        recommendations: recommendations,
        completedAt: new Date().toISOString(),
        assessmentType: 'RIASEC'
    };
    
    // Save to localStorage for persistence
    saveAssessmentResults(AssessmentState.results);
    
    // Display results
    displayResults(AssessmentState.results);
}

function generateCareerRecommendations(scores) {
    // Get top 3 RIASEC codes
    const sortedTypes = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code, score]) => ({ code, score }));
    
    // Career database with RIASEC matching
    const careerDatabase = [
        // Investigative (I) - High
        { title: 'Software Developer', riasec: ['I', 'R', 'C'], salary: '$110,000', growth: '22%', description: 'Develop applications and systems software using programming languages and frameworks.' },
        { title: 'Data Scientist', riasec: ['I', 'C', 'R'], salary: '$120,000', growth: '31%', description: 'Analyze complex data to help organizations make better decisions.' },
        { title: 'Research Scientist', riasec: ['I', 'R'], salary: '$95,000', growth: '10%', description: 'Conduct experiments and research in various scientific fields.' },
        { title: 'Medical Doctor', riasec: ['I', 'S'], salary: '$208,000', growth: '7%', description: 'Diagnose and treat illnesses and injuries.' },
        
        // Social (S) - High
        { title: 'Registered Nurse', riasec: ['S', 'I', 'C'], salary: '$77,000', growth: '9%', description: 'Provide and coordinate patient care, educate patients about health conditions.' },
        { title: 'Teacher', riasec: ['S', 'A'], salary: '$60,000', growth: '5%', description: 'Educate students in various subjects and grade levels.' },
        { title: 'Counselor', riasec: ['S', 'E'], salary: '$58,000', growth: '11%', description: 'Help people with personal, social, and psychological issues.' },
        { title: 'Social Worker', riasec: ['S', 'I'], salary: '$51,000', growth: '12%', description: 'Help individuals and families cope with challenges.' },
        
        // Realistic (R) - High
        { title: 'Mechanical Engineer', riasec: ['R', 'I'], salary: '$95,000', growth: '7%', description: 'Design and develop mechanical systems and devices.' },
        { title: 'Electrician', riasec: ['R', 'C'], salary: '$60,000', growth: '9%', description: 'Install and maintain electrical systems in buildings.' },
        { title: 'Pilot', riasec: ['R', 'E'], salary: '$130,000', growth: '5%', description: 'Operate aircraft and ensure passenger safety.' },
        { title: 'Construction Manager', riasec: ['R', 'E'], salary: '$97,000', growth: '11%', description: 'Plan and coordinate construction projects.' },
        
        // Artistic (A) - High
        { title: 'Graphic Designer', riasec: ['A', 'E'], salary: '$53,000', growth: '3%', description: 'Create visual concepts using computer software or by hand.' },
        { title: 'Writer', riasec: ['A', 'I'], salary: '$63,000', growth: '5%', description: 'Write content for books, articles, or digital media.' },
        { title: 'Architect', riasec: ['A', 'R'], salary: '$82,000', growth: '8%', description: 'Design buildings and structures.' },
        { title: 'Musician', riasec: ['A', 'S'], salary: '$60,000', growth: '4%', description: 'Perform or compose music for audiences.' },
        
        // Enterprising (E) - High
        { title: 'Marketing Manager', riasec: ['E', 'A'], salary: '$135,000', growth: '10%', description: 'Plan and execute marketing campaigns for organizations.' },
        { title: 'Entrepreneur', riasec: ['E', 'I'], salary: 'Varies', growth: 'High', description: 'Start and run your own business venture.' },
        { title: 'Sales Manager', riasec: ['E', 'S'], salary: '$127,000', growth: '7%', description: 'Lead sales teams and develop strategies.' },
        { title: 'Financial Advisor', riasec: ['E', 'C'], salary: '$89,000', growth: '15%', description: 'Help clients plan for their financial future.' },
        
        // Conventional (C) - High
        { title: 'Accountant', riasec: ['C', 'E'], salary: '$77,000', growth: '6%', description: 'Prepare and examine financial records.' },
        { title: 'Financial Analyst', riasec: ['C', 'I'], salary: '$83,000', growth: '9%', description: 'Analyze financial data for investment decisions.' },
        { title: 'Office Manager', riasec: ['C', 'S'], salary: '$55,000', growth: '5%', description: 'Coordinate administrative tasks and office operations.' },
        { title: 'HR Specialist', riasec: ['C', 'S'], salary: '$62,000', growth: '8%', description: 'Manage recruitment, benefits, and employee relations.' }
    ];
    
    // Score careers based on RIASEC match
    const scoredCareers = careerDatabase.map(career => {
        let matchScore = 0;
        career.riasec.forEach(code => {
            matchScore += scores[code] || 0;
        });
        matchScore = Math.round(matchScore / career.riasec.length);
        
        return {
            ...career,
            matchScore,
            compatibility: matchScore > 80 ? 'Excellent' : matchScore > 60 ? 'Good' : 'Potential'
        };
    });
    
    // Sort by match score and get top recommendations
    return scoredCareers
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
}

function displayResults(results) {
    const container = getAssessmentContainer();
    if (!container) return;
    
    const scores = results.scores;
    const recommendations = results.recommendations;
    
    // Find top interests
    const topTypes = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([code, score]) => ({ code, score }));
    
    const typeDescriptions = {
        'R': { name: 'Realistic', desc: 'Doers who enjoy working with tools and machines' },
        'I': { name: 'Investigative', desc: 'Thinkers who like to analyze and solve problems' },
        'A': { name: 'Artistic', desc: 'Creators who enjoy artistic self-expression' },
        'S': { name: 'Social', desc: 'Helpers who enjoy teaching and assisting others' },
        'E': { name: 'Enterprising', desc: 'Persuaders who like to lead and influence' },
        'C': { name: 'Conventional', desc: 'Organizers who prefer structured work' }
    };
    
    container.innerHTML = `
        <div class="assessment-results">
            <div class="text-center mb-5">
                <i class="bi bi-trophy display-1 text-warning mb-3"></i>
                <h2>Your Career Profile Results</h2>
                <p class="lead text-muted">Based on your responses, here's your personalized career analysis</p>
            </div>
            
            <!-- RIASEC Scores -->
            <div class="row mb-5">
                <div class="col-lg-8 mx-auto">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h4 class="mb-4">Your RIASEC Scores</h4>
                            <div class="scores-chart">
                                ${Object.entries(scores).map(([code, score]) => `
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between mb-1">
                                            <span><strong>${code}</strong> - ${typeDescriptions[code].name}</span>
                                            <span>${score}%</span>
                                        </div>
                                        <div class="progress" style="height: 10px;">
                                            <div class="progress-bar ${score > 80 ? 'bg-success' : score > 60 ? 'bg-primary' : 'bg-info'}" 
                                                 style="width: ${score}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Top Interests -->
            <div class="row mb-5">
                <div class="col-lg-8 mx-auto">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h4 class="mb-4">Your Top Career Interests</h4>
                            <div class="row g-4">
                                ${topTypes.slice(0, 3).map(type => `
                                    <div class="col-md-4">
                                        <div class="interest-card text-center p-4 bg-light rounded">
                                            <div class="display-4 mb-2">${type.code}</div>
                                            <h5>${typeDescriptions[type.code].name}</h5>
                                            <p class="small text-muted">${typeDescriptions[type.code].desc}</p>
                                            <span class="badge bg-primary">${type.score}%</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Career Recommendations -->
            <div class="row mb-5">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h4 class="mb-4">Recommended Career Paths</h4>
                            <div class="row g-4">
                                ${recommendations.map((career, index) => `
                                    <div class="col-md-6 col-lg-4">
                                        <div class="career-card h-100 border-0 shadow-sm p-3 ${index < 3 ? 'recommended' : ''}">
                                            ${index < 3 ? '<div class="ribbon">Top Match</div>' : ''}
                                            <div class="d-flex justify-content-between align-items-start mb-3">
                                                <h5 class="mb-0">${career.title}</h5>
                                                <span class="badge bg-${career.matchScore > 80 ? 'success' : 'primary'}">
                                                    ${career.matchScore}% Match
                                                </span>
                                            </div>
                                            <p class="text-muted small">${career.description}</p>
                                            <div class="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    <span class="badge bg-light text-dark me-1">💰 ${career.salary}</span>
                                                    <span class="badge bg-light text-dark">📈 ${career.growth}</span>
                                                </div>
                                                <button class="btn btn-sm btn-outline-primary" 
                                                        onclick="viewCareer('${career.title}')">
                                                    Explore <i class="bi bi-arrow-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Next Steps -->
            <div class="row">
                <div class="col-12">
                    <div class="card border-0 shadow-sm bg-primary bg-opacity-10">
                        <div class="card-body text-center p-5">
                            <h4 class="mb-3">Ready to Take the Next Step?</h4>
                            <p class="mb-4">Explore detailed career paths or find current job opportunities</p>
                            <div class="d-flex justify-content-center gap-3">
                                <a href="careers.html" class="btn btn-primary">
                                    <i class="bi bi-search me-2"></i>Explore Careers
                                </a>
                                <a href="jobs.html" class="btn btn-outline-primary">
                                    <i class="bi bi-briefcase me-2"></i>Find Jobs
                                </a>
                                <button class="btn btn-outline-secondary" onclick="startNewAssessment()">
                                    <i class="bi bi-arrow-repeat me-2"></i>Take Again
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function saveAssessmentResults(results) {
    // Save to localStorage
    const history = JSON.parse(localStorage.getItem('assessmentHistory') || '[]');
    const newResult = {
        id: 'result_' + Date.now(),
        ...results
    };
    history.unshift(newResult);
    localStorage.setItem('assessmentHistory', JSON.stringify(history.slice(0, 10)));
    localStorage.setItem('latestResult', JSON.stringify(newResult));
    
    // Update assessment count
    localStorage.setItem('totalAssessments', history.length.toString());
}

function loadAssessmentResult(resultId) {
    const history = JSON.parse(localStorage.getItem('assessmentHistory') || '[]');
    const result = history.find(r => r.id === resultId) || 
                   JSON.parse(localStorage.getItem('latestResult'));
    
    if (result) {
        displayResults(result);
    } else {
        initializeAssessment();
    }
}

function startNewAssessment() {
    window.location.href = 'assessment.html';
}

function viewCareer(careerTitle) {
    window.location.href = `careers.html?search=${encodeURIComponent(careerTitle)}`;
}

// Make functions globally available
window.selectOption = selectOption;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.startNewAssessment = startNewAssessment;
window.viewCareer = viewCareer;

// expose initializer for pages that use a start button
window.initializeAssessment = initializeAssessment;