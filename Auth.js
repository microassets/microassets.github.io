import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDXyQl8pfoSlcAE-1zbyhGMExrbn_eNyPM",
    authDomain: "microtemplates-eb2e7.firebaseapp.com",
    projectId: "microtemplates-eb2e7",
    storageBucket: "microtemplates-eb2e7.firebasestorage.app",
    messagingSenderId: "673841508032",
    appId: "1:673841508032:web:11d735db56be6505254725"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ---------------- GOOGLE AUTH LOGIC ---------------- */
window.loginWithGoogle = async function () {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        if (window.closeAuthModal) window.closeAuthModal();
        window.showSuccessToast("Successfully signed in!");
    } catch (error) {
        if (error.code === "auth/popup-blocked") {
            window.showErrorToast("Please allow popups to sign in.");
        } else if (error.code !== "auth/popup-closed-by-user") {
            window.showErrorToast("Google Sign-in failed.");
        }
    }
};

/* ---------------- EMAIL AUTH LOGIC (Merged & Cleaned) ---------------- */
window.loginWithEmail = async function () {
    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
        if (!email) emailInput?.classList.add('input-error');
        if (!password) passwordInput?.classList.add('input-error');
        window.showErrorToast("Please enter both email and password.");
        return;
    }

    try {
        // Try login
        await signInWithEmailAndPassword(auth, email, password);
        if (window.closeAuthModal) window.closeAuthModal();
        window.showSuccessToast("Welcome back!");
    } catch (loginError) {
        // If user doesn't exist, try to sign them up automatically
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                if (window.closeAuthModal) window.closeAuthModal();
                window.showSuccessToast("Account created successfully!");
            } catch (signupError) {
                handleAuthErrors(signupError, emailInput, passwordInput);
            }
        } else {
            handleAuthErrors(loginError, emailInput, passwordInput);
        }
    }
};

function handleAuthErrors(error, emailInput, passwordInput) {
    console.error("Auth Error:", error.code);
    if (error.code === 'auth/wrong-password') {
        passwordInput?.classList.add('input-error');
        window.showErrorToast("Incorrect password.");
    } else if (error.code === 'auth/invalid-email') {
        emailInput?.classList.add('input-error');
        window.showErrorToast("Invalid email format.");
    } else {
        window.showErrorToast("Authentication failed: " + error.message);
    }
}

/* ---------------- UI CONTROLS ---------------- */
window.showAuthModal = () => document.querySelector('.auth-overlay')?.classList.add('active');
window.closeAuthModal = () => document.querySelector('.auth-overlay')?.classList.remove('active');

window.handleLogout = async function () {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        window.showErrorToast("Failed to log out.");
    }
};

window.toggleUserDropdown = function (event) {
    if (event) event.stopPropagation();
    document.getElementById('notifDropdown')?.classList.remove('active');
    document.getElementById('userDropdown')?.classList.toggle('active');
};

/* ---------------- TOAST SYSTEM ---------------- */
window.showSuccessToast = (msg) => createToast(msg, 'success');
window.showErrorToast = (msg) => createToast(msg, 'error');

function createToast(message, type) {
    let container = document.getElementById('toast-container') || Object.assign(document.createElement('div'), {id: 'toast-container'});
    if (!container.parentElement) document.body.appendChild(container);

    const toast = document.createElement('div');
    toast.className = type === 'success' ? 'success-alert' : 'error-alert';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/* ---------------- DOM READY LISTENERS ---------------- */
document.addEventListener('DOMContentLoaded', () => {
    // Auth Modal Triggers
    document.getElementById('loggedOutBtn')?.addEventListener('click', window.showAuthModal);
    document.querySelector('.close-auth')?.addEventListener('click', window.closeAuthModal);

    // Mobile Menu Logic (Fixed missing variables)
    const openBtn = document.getElementById('mobileMenuOpen'); // Ensure this ID exists in HTML
    const closeBtn = document.getElementById('mobileMenuClose'); // Ensure this ID exists in HTML
    const mobileMenu = document.getElementById('mobileMenu');
    const categoryToggle = document.getElementById('categoryToggle');

    if (openBtn && mobileMenu) {
        openBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn && mobileMenu) {
        closeBtn.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (categoryToggle) {
        categoryToggle.addEventListener('click', (e) => {
            e.preventDefault();
            categoryToggle.parentElement.classList.toggle('active');
        });
    }
});

/* ---------------- AUTH STATE OBSERVER ---------------- */
onAuthStateChanged(auth, (user) => {
    const loggedOutBtn = document.getElementById('loggedOutBtn');
    const loggedInUI = document.getElementById('loggedInUI');
    const userAvatar = document.getElementById('userAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
        const authButtonContainer = document.getElementById('Auth-button');

    if (user) {
        if (loggedOutBtn) loggedOutBtn.style.display = "none";
        if (loggedInUI) loggedInUI.style.display = "flex";
        if (userAvatar) userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=8E6BCB&color=fff`;
        if (userNameDisplay) userNameDisplay.innerText = user.displayName || user.email.split('@')[0];
          // Fixed: Removed extra () and updated ID usage
        if (authButtonContainer) {
            authButtonContainer.innerHTML = `
                <button style=" background-color: red; onclick="handleLogout()" class="btn-primary">Log out</button>
            `;
        }

    } else {
        if (loggedOutBtn) loggedOutBtn.style.display = "block";
        if (loggedInUI) loggedInUI.style.display = "none";
    }
});