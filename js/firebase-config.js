// Firebase configuration
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

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// Export Firebase services for use in other modules
const FirebaseServices = {
    auth: auth,
    db: db,
    analytics: analytics,
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
        
        // Get user profile from Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                AppState.userProfile = userDoc.data();
                AppState.isAdmin = AppState.userProfile.role === 'admin';
                
                // Update UI based on user state
                updateUIForAuthState(true);
                
                // Load appropriate dashboard
                if (window.location.pathname.includes('auth.html')) {
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    } else {
        AppState.currentUser = null;
        AppState.userProfile = null;
        AppState.isAdmin = false;
        updateUIForAuthState(false);
    }
});

// Update UI based on authentication state
function updateUIForAuthState(isAuthenticated) {
    const authElements = document.querySelectorAll('.auth-only');
    const nonAuthElements = document.querySelectorAll('.non-auth-only');
    
    if (isAuthenticated) {
        authElements.forEach(el => el.style.display = 'block');
        nonAuthElements.forEach(el => el.style.display = 'none');
        
        // Update user info in navbar if exists
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement && AppState.userProfile) {
            userInfoElement.innerHTML = `
                <span class="me-2">${AppState.userProfile.name || AppState.currentUser.email}</span>
                ${AppState.isAdmin ? '<span class="badge bg-danger">Admin</span>' : ''}
            `;
        }
    } else {
        authElements.forEach(el => el.style.display = 'none');
        nonAuthElements.forEach(el => el.style.display = 'block');
    }
}

// Toggle theme
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAppState);