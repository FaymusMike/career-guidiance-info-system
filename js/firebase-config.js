// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDnqdtFHAutJgIWm_99xg0donEF4avlY4I",
    authDomain: "gods-eye-68c7a.firebaseapp.com",
    projectId: "gods-eye-68c7a",
    storageBucket: "gods-eye-68c7a.firebasestorage.app",
    messagingSenderId: "182309364788",
    appId: "1:182309364788:web:29a684a00f950432091661"
};

// Check if Firebase is already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export Firebase services
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

// Initialize app state
function initializeAppState() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    AppState.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Authentication state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        AppState.currentUser = user;
        console.log('User authenticated:', user.email);
        
        try {
            // Check if user profile exists
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                AppState.userProfile = userDoc.data();
                AppState.isAdmin = AppState.userProfile.role === 'admin';
                console.log('User profile loaded');
            } else {
                // Create user profile if it doesn't exist
                await createUserProfile(user);
            }
            
            updateUIForAuthState(true);
            
        } catch (error) {
            console.error('Error in auth state change:', error);
        }
    } else {
        AppState.currentUser = null;
        AppState.userProfile = null;
        AppState.isAdmin = false;
        updateUIForAuthState(false);
    }
});

// Create user profile
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
        console.log('New user profile created');
        
    } catch (error) {
        console.error('Error creating user profile:', error);
    }
}

// Update UI based on auth state
function updateUIForAuthState(isAuthenticated) {
    const authElements = document.querySelectorAll('.auth-only');
    const nonAuthElements = document.querySelectorAll('.non-auth-only');
    
    if (isAuthenticated) {
        authElements.forEach(el => {
            el.style.display = 'block';
            el.classList.remove('d-none');
        });
        nonAuthElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('d-none');
        });
        
        // Update user info
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement && AppState.userProfile) {
            userInfoElement.innerHTML = `
                ${AppState.userProfile.name || AppState.currentUser.email}
                ${AppState.isAdmin ? '<span class="badge bg-danger ms-1">Admin</span>' : ''}
            `;
        }
        
        // Show admin link if admin
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

// Theme toggle
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', AppState.theme);
    localStorage.setItem('theme', AppState.theme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = AppState.theme === 'light' ? 
            '<i class="bi bi-moon"></i>' : 
            '<i class="bi bi-sun"></i>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing app...');
    initializeAppState();
    
    // Set theme toggle icon
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = AppState.theme === 'light' ? 
            '<i class="bi bi-moon"></i>' : 
            '<i class="bi bi-sun"></i>';
        themeToggle.addEventListener('click', toggleTheme);
    }
});