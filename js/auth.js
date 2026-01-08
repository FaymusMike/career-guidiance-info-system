class AuthManager {
    constructor() {
        console.log('AuthManager initialized');
        this.initAuthListeners();
    }
    
    initAuthListeners() {
        console.log('Initializing auth listeners');
        
        // Email/Password Signup
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            console.log('Found signup form');
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            console.log('Found login form');
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Google Sign-In
        const googleBtn = document.getElementById('google-signin');
        if (googleBtn) {
            console.log('Found Google signin button');
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            console.log('Found logout button');
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        console.log('Handling signup');
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        
        console.log('Signup details:', { email, name });
        
        try {
            // Create user in Firebase Auth
            const userCredential = await FirebaseServices.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log('User created:', user.uid);
            
            // Create user profile in Firestore
            await FirebaseServices.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                name: name,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                academicBackground: '',
                careerInterests: [],
                assessmentHistory: [],
                savedCareers: []
            });
            
            console.log('User profile created in Firestore');
            
            // Show success message
            this.showAlert('Signup successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = error.message;
            
            // Friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please login instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }
            
            this.showAlert(errorMessage, 'error');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        console.log('Handling login');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log('Login attempt for:', email);
        
        try {
            await FirebaseServices.auth.signInWithEmailAndPassword(email, password);
            console.log('Login successful');
            this.showAlert('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = error.message;
            
            // Friendly error messages
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            }
            
            this.showAlert(errorMessage, 'error');
        }
    }
    
    async handleGoogleSignIn() {
        try {
            console.log('Starting Google Sign-In');
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await FirebaseServices.auth.signInWithPopup(provider);
            const user = result.user;
            
            console.log('Google Sign-In successful:', user.email);
            
            // Check if user profile exists, create if not
            const userDoc = await FirebaseServices.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                console.log('Creating new user profile for Google user');
                await FirebaseServices.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    academicBackground: '',
                    careerInterests: [],
                    assessmentHistory: [],
                    savedCareers: []
                });
            }
            
            this.showAlert('Google Sign-In successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.showAlert('Error with Google Sign-In: ' + error.message, 'error');
        }
    }
    
    async handleLogout() {
        try {
            await FirebaseServices.auth.signOut();
            console.log('Logout successful');
            this.showAlert('Logged out successfully', 'success');
            
            // Clear local storage
            localStorage.removeItem('theme');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('Error logging out: ' + error.message, 'error');
        }
    }
    
    showAlert(message, type) {
        console.log('Showing alert:', message, type);
        
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Try different container locations
        const containers = [
            document.querySelector('.auth-container'),
            document.querySelector('.container-fluid'),
            document.querySelector('.container'),
            document.querySelector('main'),
            document.body
        ];
        
        let container = containers.find(c => c);
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize Auth Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthManager');
    new AuthManager();
    
    // Debug: Log Firebase services
    console.log('Firebase services:', FirebaseServices);
    console.log('Firebase auth state:', FirebaseServices.auth.currentUser);
});