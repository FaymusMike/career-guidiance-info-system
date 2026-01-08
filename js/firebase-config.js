// Firebase configuration - USE YOUR ACTUAL CONFIG HERE
const firebaseConfig = {
    apiKey: "AIzaSyDnqdtFHAutJgIWm_99xg0donEF4avlY4I",
    authDomain: "gods-eye-68c7a.firebaseapp.com",
    databaseURL: "https://gods-eye-68c7a-default-rtdb.firebaseio.com",
    projectId: "gods-eye-68c7a",
    storageBucket: "gods-eye-68c7a.firebasestorage.app",
    messagingSenderId: "182309364788",
    appId: "1:182309364788:web:29a684a00f950432091661"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services (Remove analytics for now as it's causing issues)
const auth = firebase.auth();
const db = firebase.firestore();
// Remove analytics line since it's not needed for basic functionality
// const analytics = firebase.analytics();

// Export Firebase services for use in other modules
const FirebaseServices = {
    auth: auth,
    db: db,
    firebase: firebase
};

// Global state management
const AppState = {
    currentUser: null,
    userProfile: null,
    isAdmin: false,
    theme: 'light'
};

// Initialize app state from localStorage
function initializeAppState() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    AppState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (user) {
        AppState.currentUser = user;
        console.log('User authenticated:', user.email);
        
        // Get user profile from Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                AppState.userProfile = userDoc.data();
                AppState.isAdmin = AppState.userProfile.role === 'admin';
                
                console.log('User profile loaded:', AppState.userProfile);
                
                // Update UI based on user state
                updateUIForAuthState(true);
                
                // Load appropriate dashboard
                if (window.location.pathname.includes('auth.html')) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                // Create user profile if it doesn't exist
                await createUserProfile(user);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    } else {
        AppState.currentUser = null;
        AppState.userProfile = null;
        AppState.isAdmin = false;
        updateUIForAuthState(false);
        console.log('User not authenticated');
    }
});

// Create user profile if it doesn't exist
async function createUserProfile(user) {
    try {
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            academicBackground: '',
            careerInterests: [],
            assessmentHistory: [],
            savedCareers: []
        });
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        AppState.userProfile = userDoc.data();
        updateUIForAuthState(true);
        
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
}

// Update UI based on authentication state
function updateUIForAuthState(isAuthenticated) {
    const authElements = document.querySelectorAll('.auth-only');
    const nonAuthElements = document.querySelectorAll('.non-auth-only');
    
    console.log('Updating UI for auth state:', isAuthenticated);
    console.log('Auth elements found:', authElements.length);
    console.log('Non-auth elements found:', nonAuthElements.length);
    
    if (isAuthenticated) {
        authElements.forEach(el => {
            console.log('Showing auth element:', el);
            el.style.display = 'block';
            el.classList.remove('d-none');
        });
        nonAuthElements.forEach(el => {
            console.log('Hiding non-auth element:', el);
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        
        // Update user info in navbar if exists
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement && AppState.userProfile) {
            userInfoElement.innerHTML = `
                <span class="me-2">${AppState.userProfile.name || AppState.currentUser.email}</span>
                ${AppState.isAdmin ? '<span class="badge bg-danger ms-1">Admin</span>' : ''}
            `;
        }
        
        // Show admin link if user is admin
        const adminLink = document.getElementById('admin-link');
        if (adminLink && AppState.isAdmin) {
            adminLink.style.display = 'block';
        }
    } else {
        authElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        nonAuthElements.forEach(el => {
            el.style.display = 'block';
            el.classList.remove('d-none');
        });
    }
}

// Toggle theme
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
    
    // Update theme toggle icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = AppState.theme === 'light' ? 
            '<i class="bi bi-moon"></i>' : 
            '<i class="bi bi-sun"></i>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app state');
    initializeAppState();
    
    // Set initial theme icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = AppState.theme === 'light' ? 
            '<i class="bi bi-moon"></i>' : 
            '<i class="bi bi-sun"></i>';
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Check if we need to redirect
    if (AppState.currentUser && window.location.pathname.includes('auth.html')) {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
});