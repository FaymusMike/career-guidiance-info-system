class AuthManager {
    constructor() {
        this.initAuthListeners();
    }
    
    initAuthListeners() {
        // Email/Password Signup
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Login
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
    
    async handleSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;
        
        try {
            // Create user in Firebase Auth
            const userCredential = await FirebaseServices.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user profile in Firestore
            await FirebaseServices.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: email,
                name: name,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                academicBackground: '',
                careerInterests: [],
                assessmentHistory: []
            });
            
            // Show success message
            this.showAlert('Signup successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            await FirebaseServices.auth.signInWithEmailAndPassword(email, password);
            this.showAlert('Login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }
    
    async handleGoogleSignIn() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await FirebaseServices.auth.signInWithPopup(provider);
            
            // Check if user profile exists, create if not
            const user = FirebaseServices.auth.currentUser;
            const userDoc = await FirebaseServices.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                await FirebaseServices.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    role: 'user',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    academicBackground: '',
                    careerInterests: [],
                    assessmentHistory: []
                });
            }
            
            this.showAlert('Google Sign-In successful!', 'success');
            
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }
    
    async handleLogout() {
        try {
            await FirebaseServices.auth.signOut();
            this.showAlert('Logged out successfully', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }
    
    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.auth-container') || document.body;
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize Auth Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});