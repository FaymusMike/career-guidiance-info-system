class AuthManager {
    constructor() {
        console.log('AuthManager initialized');
        this.initAuthListeners();
    }
    
    initAuthListeners() {
        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Google Sign-In
        const googleBtn = document.getElementById('google-signin');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    
    getPostAuthRedirect() {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        const allowedRedirects = {
            dashboard: 'dashboard.html',
            assessment: 'assessment.html',
            profile: 'profile.html',
            careers: 'careers.html',
            admin: 'admin.html'
        };

        return allowedRedirects[redirect] || 'dashboard.html';
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        
        // Validate inputs
        if (!this.validateEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (!name.trim()) {
            this.showAlert('Please enter your name', 'error');
            return;
        }
        
        try {
            // Create user
            const userCredential = await FirebaseServices.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user profile
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
            
            this.showAlert('Account created successfully! Redirecting...', 'success');
            
            // Auto-login and redirect
            const target = this.getPostAuthRedirect();
            setTimeout(() => {
                window.location.href = target;
            }, 2000);
            
        } catch (error) {
            console.error('Signup error:', error.code, error.message);
            this.handleAuthError(error);
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!this.validateEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            await FirebaseServices.auth.signInWithEmailAndPassword(email, password);
            this.showAlert('Login successful! Redirecting...', 'success');
            
            const target = this.getPostAuthRedirect();
            setTimeout(() => {
                window.location.href = target;
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error.code, error.message);
            this.handleAuthError(error);
        }
    }
    
    async handleGoogleSignIn() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await FirebaseServices.auth.signInWithPopup(provider);
            
            this.showAlert('Google Sign-In successful! Redirecting...', 'success');
            
            const target = this.getPostAuthRedirect();
            setTimeout(() => {
                window.location.href = target;
            }, 1500);
            
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.showAlert('Google Sign-In failed: ' + error.message, 'error');
        }
    }
    
    async handleLogout() {
        try {
            await FirebaseServices.auth.signOut();
            this.showAlert('Logged out successfully', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('Error logging out: ' + error.message, 'error');
        }
    }
    
    handleAuthError(error) {
        let message = error.message;
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'This email is already registered. Please login instead.';
                break;
            case 'auth/invalid-email':
                message = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                message = 'Password should be at least 6 characters.';
                break;
            case 'auth/user-not-found':
                message = 'No account found with this email. Please sign up first.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/user-disabled':
                message = 'This account has been disabled.';
                break;
            case 'auth/network-request-failed':
                message = 'Network error. Please check your internet connection.';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later.';
                break;
        }
        
        this.showAlert(message, 'error');
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) existingAlert.remove();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AuthManager());
} else {
    new AuthManager();
}