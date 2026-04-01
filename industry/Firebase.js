            import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
            import {
                getFirestore, collection, getDocs, query, where, doc, updateDoc, increment
            } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

            // Combined all Auth imports into one line to prevent "Redeclaration" errors
            import {
                getAuth,
                onAuthStateChanged,
                signInWithPopup,
                GoogleAuthProvider,
                signInWithEmailAndPassword,
                createUserWithEmailAndPassword, 
                signOut
            } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

            /* ---------------- FIREBASE CONFIG ---------------- */
            const firebaseConfig = {
                apiKey: "AIzaSyDXyQl8pfoSlcAE-1zbyhGMExrbn_eNyPM",
                authDomain: "microtemplates-eb2e7.firebaseapp.com",
                projectId: "microtemplates-eb2e7",
                storageBucket: "microtemplates-eb2e7.firebasestorage.app",
                messagingSenderId: "673841508032",
                appId: "1:673841508032:web:11d735db56be6505254725"
            };

            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const auth = getAuth(app);
            // 3. DEFINE GLOBAL VARIABLES INSIDE THE MODULE
            let masterData = [];
            let currentViewData = [];
            let debounceTimer;
            
     /* ---------------- GOOGLE AUTH LOGIC ---------------- */
window.loginWithGoogle = async function () {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Logged in user:", result.user.displayName);

        if (window.closeAuthModal) window.closeAuthModal();

        // Replaced alert with showSuccessToast
        window.showSuccessToast("Successfully signed in! You can now download.");

    } catch (error) {
        if (error.code === "auth/popup-blocked") {
            window.showErrorToast("Please allow popups to sign in with Google.");
        } else if (error.code !== "auth/popup-closed-by-user") {
            console.error("Google Auth Error:", error.code);
            window.showErrorToast("Google Sign-in failed. Please try again.");
        }
    }
};

/* ---------------- EMAIL AUTH LOGIC ---------------- */
window.loginWithEmail = async function () {
    const emailInput = document.getElementById('authEmail');
    const passwordInput = document.getElementById('authPassword');
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const ErrorMsg = document.getElementById("Error"); 

    // Reset UI
    emailInput?.classList.remove('input-error');
    passwordInput?.classList.remove('input-error');
    if (ErrorMsg) ErrorMsg.style.display = "none";
  
    // 1. Validation Check (Empty Fields)
    if (!email || !password) {
        if (!email) emailInput?.classList.add('input-error');
        if (!password) passwordInput?.classList.add('input-error');
        window.showErrorToast("Please enter both email and password.");
        return;
    }

    try {
        // 2. Try login
        await signInWithEmailAndPassword(auth, email, password);
        if (window.closeAuthModal) window.closeAuthModal();
        window.showSuccessToast("Welcome back! Signed in successfully.");

    } catch (loginError) {
        console.warn("Login failed, trying signup...");

        try {
            // 3. Try creating account (Signup)
            await createUserWithEmailAndPassword(auth, email, password);
            if (window.closeAuthModal) window.closeAuthModal();
            window.showSuccessToast("Account created successfully!");

        } catch (signupError) {
            console.error("Auth Error:", signupError.code);

            // 4. Specific Error Handling with Toasts
            if (signupError.code === 'auth/email-already-in-use' || loginError.code === 'auth/wrong-password') {
                passwordInput?.classList.add('input-error');
                window.showErrorToast("Incorrect password. Please try again.");
            } else if (signupError.code === 'auth/invalid-email') {
                emailInput?.classList.add('input-error');
                window.showErrorToast("Invalid email format.");
            } else {
                // If it's a generic error, show the hidden Error div OR a toast
                if (ErrorMsg) {
                    ErrorMsg.style.display = "block";
                } else {
                    window.showErrorToast("Authentication failed. Please try again.");
                }
            }
        }
    }
};

// Clear errors on input
document.querySelectorAll('.email-form input').forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('input-error');
    });
});
// Success Toast (Green Glassmorphism)
window.showSuccessToast = function(message) {
    createToast(message, 'success');
};

// Error Toast (Red Glassmorphism)
window.showErrorToast = function(message) {
    createToast(message, 'error');
};

function createToast(message, type) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // Assigns class based on type
    toast.className = type === 'success' ? 'success-alert' : 'error-alert';
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

            /* ---------------- LOGOUT FUNCTION ---------------- */
            window.handleLogout = async function () {
                try {
                    // This tells Firebase to end the session
                    await signOut(auth);

                    // Optional: Show a message or just reload
                    console.log("User signed out");

                    // Reload the page to reset the UI (hides profile, shows "Join Now")
                    window.location.reload();

                } catch (error) {
                    console.error("Error signing out:", error);
                    alert("Failed to log out. Please try again.");
                }
            };
            /* ---------------- AUTH STATE OBSERVER ---------------- */
            // This keeps the user logged in even if they refresh the page
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log("Persistence: User is logged in as", user.email);
                    // You can update your navbar here (e.g., change "Login" to "Logout")
                }
            });
            /* ---------------- INITIAL DATA LOAD ---------------- */
            async function loadInitialData() {
                try {
                    const colRef = collection(db, "microassets");
                    const snapshot = await getDocs(colRef);

                    masterData = [];
                    snapshot.forEach(doc => {
                        masterData.push({ id: doc.id, ...doc.data() });
                    });

                    console.log("Total Assets Loaded:", masterData.length);
                  const Fetch = document.getElementById("Fetch").value
                    // Filter for "Bussiness" for the initial home grid
                    currentViewData = masterData.filter(item =>
                        (item.industry || item.Industry || "") === Fetch
                    );

                    renderGrid(currentViewData);
                    handleRouting(); // Check if we should open a specific template from URL

                } catch (err) {
                    console.error("Firebase Load Error:", err);
                }
            }

            /* ---------------- GRID RENDER ---------------- */
            function renderGrid(dataList) {
                const container = document.getElementById('template-list');
                if (!container) return;
                container.innerHTML = "";

                if (dataList.length === 0) {
                    container.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; justify-content: center; width: 100%; padding: 60px 20px;">
                <div style="
                 
                  
                    
                    padding: 40px; 
                    max-width: 500px; 
                    text-align: center;
                   
                ">
                    <div style="font-size: 3rem; color: #8E6BCB; margin-bottom: 20px;">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <h2 style="color: white; margin-bottom: 10px;">Coming Soon to Micro<span>assets</span></h2>
                    <p style="color: #b0b0b0; line-height: 1.6; margin-bottom: 25px;">
                        We are currently curating premium assets for this category. 
                        Check back shortly for high-quality SVG & AI templates!
                    </p>
                    <button onclick="showHomeView()" style="
                        background: #8E6BCB; 
                        color: white; 
                        border: none; 
                        padding: 10px 25px; 
                        border-radius: 30px; 
                        cursor: pointer;
                        font-weight: 600;
                        transition: 0.3s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        Browse Available Assets
                    </button>
                </div>
            </div>`;
                    return;
                }

                dataList.forEach(data => {
                    const card = `
            <div class="asset-card loading" data-id="${data.id}" onclick="openAssetModal(this)">
                <img src="${data.Thumbnail}" alt="${data.Title}" class="asset-img" 
                     onload="imgLoaded(this)">
                <div class="hover-overlay">
                    <div class="overlay-content">
                        <h3>${data.Title}</h3>
                        <p>${data.Categorey || data.Category || "Template"}</p>
                    </div>
                </div>
            </div>`;
                    container.insertAdjacentHTML('beforeend', card);
                });
            }


            /* ---------------- SHOW DETAIL VIEW ---------------- */
            function showDetailView(id) {
                const asset = masterData.find(item => item.id === id);
                if (!asset) return;

                const detailView = document.getElementById("detail-view");
                const homeView = document.getElementById("home-view");

                // 1. START ANIMATION (Fade Out/Slide Down)
                detailView.classList.add('switching');

                setTimeout(() => {
                    // 2. TOGGLE VIEWS
                    homeView.style.display = "none";
                    detailView.style.display = "block";

                    // 3. AUTO-SCROLL TO PREVIEW
                    // We target the image container or the title display
                    const scrollTarget = document.getElementById("detail-view") || document.getElementById("asset-title-display");
                    if (scrollTarget) {
                        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }

                    // 4. RESET SKELETON & IMAGE
                    const imgDisplay = document.getElementById("asset-img-display");
                    const imgWrapper = document.getElementById("detail-img-container");

                    if (imgDisplay) {
                        imgDisplay.classList.remove('loaded');
                        imgDisplay.src = asset.Thumbnail;
                    }
                    if (imgWrapper) imgWrapper.classList.add('loading');

                    // 5. INJECT DATA
                    document.title = `${asset.Title} | MicroTemplates`;
                    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

                    setEl("asset-title-display", asset.Title);
                    setEl("info-name", asset.Title);
                    setEl("info-industry", asset.industry || asset.Industry || "General");
                    setEl("info-category", asset.Categorey || asset.Category || "Template");
                    setEl("count", asset.Count || "0");
                    setEl("info-type", asset["File Type"] || "ZIP");

                    /// 6. DOWNLOAD LOGIC
const desktopDl = document.getElementById("info-download-link");
const mobileDl  = document.getElementById("dlLink_m");

// Create an array of the buttons that actually exist on the page
const buttons = [desktopDl, mobileDl].filter(btn => btn !== null);

buttons.forEach(btn => {
    // Prevent automatic download behavior
    btn.removeAttribute('href');
    btn.style.cursor = "pointer";

    btn.onclick = (e) => {
        e.preventDefault();
        
        // Safety check for the link in your database
        const fileUrl = asset["Download link"] || asset["Dowload link"];
        
        if (fileUrl) {
            registerDownload(asset.id, fileUrl);
        } else {
            console.error("No download link found for this asset.");
            alert("Download link is currently unavailable.");
        }
    };
});
                    // 7. REFRESH RELATED SECTION
                    renderRelatedTemplates(
                        asset.industry || asset.Industry,
                        asset.Categorey || asset.Category,
                        asset.Title
                    );

                    // 8. END ANIMATION (Fade In/Slide Up)
                    detailView.classList.remove('switching');

                }, 150); // Small delay to let the transition happen
                // ... inside showDetailView(id) after asset is found ...

                const currentUrl = window.location.href;
                const assetTitle = `${asset.Title} | MicroTemplates`;
                const assetDesc = `Download ${asset.Title}. High quality ${asset.Categorey} template for ${asset.industry}.`;
                const assetImg = asset.Thumbnail;

                // Update Standard Tags
                document.title = assetTitle;

                // Update OG Tags (For browsers/modern apps)
                document.querySelector('meta[property="og:url"]')?.setAttribute("content", currentUrl);
                document.querySelector('meta[property="og:title"]')?.setAttribute("content", assetTitle);
                document.querySelector('meta[property="og:description"]')?.setAttribute("content", assetDesc);
                document.querySelector('meta[property="og:image"]')?.setAttribute("content", assetImg);

                // Update Twitter Tags
                document.querySelector('meta[property="twitter:title"]')?.setAttribute("content", assetTitle);
                document.querySelector('meta[property="twitter:image"]')?.setAttribute("content", assetImg);
            }
            /* ---------------- DOWNLOAD TRACKER ---------------- */
            // Variable to store the asset they wanted to download before logging in
            let pendingDownload = null;

            window.registerDownload = async function (docId, fileUrl) {
                const user = auth.currentUser;

                if (!user) {
                    // Save the info so we can resume after login
                    pendingDownload = { docId, fileUrl };
                    window.showAuthModal();
                    return;
                }

                // If already logged in, just proceed
                executeDownload(docId, fileUrl);
            };

            // Separate the logic so it can be called twice
            async function executeDownload(docId, fileUrl) {
                try {
                    const assetRef = doc(db, "microassets", docId);
                    await updateDoc(assetRef, { Count: increment(1) });

                    if (fileUrl && fileUrl !== "#") {
                        window.open(fileUrl, "_blank");
                    }
                } catch (error) {
                    console.error("Download error:", error);
                }
            }

            // Update the observer to "Resume" the download
      onAuthStateChanged(auth, (user) => {
    // 1. Handle Pending Downloads
    if (user && pendingDownload) {
        console.log("Resuming download for:", user.email);
        executeDownload(pendingDownload.docId, pendingDownload.fileUrl);
        pendingDownload = null; 
    }

    // 2. Select Elements (Note the corrected ID: 'Auth-button')
    const loggedOutBtn = document.getElementById('loggedOutBtn');
    const loggedInUI = document.getElementById('loggedInUI');
    const userAvatar = document.getElementById('userAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const authButtonContainer = document.getElementById('Auth-button');

    if (user) {
        // User is Logged In
        if (loggedOutBtn) loggedOutBtn.style.display = "none";
        if (loggedInUI) loggedInUI.style.display = "flex";
        
        // Fixed: Removed extra () and updated ID usage
        if (authButtonContainer) {
            authButtonContainer.innerHTML = `
                <button style=" background-color: red; onclick="handleLogout()" class="btn-primary">Log out</button>
            `;
        }

        if (userAvatar) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=8E6BCB&color=fff`;
        }
        if (userNameDisplay) {
            userNameDisplay.innerText = user.displayName || "User";
        }

    } else {
        // User is Logged Out
        if (loggedOutBtn) loggedOutBtn.style.display = "block";
        if (loggedInUI) loggedInUI.style.display = "none";
        
        // Fixed: Restore the "Get Started" button when logged out
        if (authButtonContainer) {
            authButtonContainer.innerHTML = `
                <button onclick="showAuthModal()" class="btn-primary">Get Started</button>
            `;
        }
    }
});
            /* ---------------- RELATED TEMPLATES ---------------- */
            function renderRelatedTemplates(industry, incomingCategory, title) {
                const container = document.getElementById("related-grid");
                if (!container) return;
                container.innerHTML = "";

                let related = masterData.filter(asset => {
                    const assetCat = (asset.Categorey || asset.Category || "").toLowerCase().trim();
                    const assetInd = (asset.industry || asset.Industry || "").toLowerCase().trim();
                    const targetCat = (incomingCategory || "").toLowerCase().trim();
                    const targetInd = (industry || "").toLowerCase().trim();

                    return assetCat === targetCat && assetInd === targetInd && asset.Title !== title;
                });

                if (related.length < 3) {
                    const extra = masterData.filter(asset =>
                        (asset.Categorey || asset.Category || "").toLowerCase() === (incomingCategory || "").toLowerCase() &&
                        asset.Title !== title && !related.includes(asset)
                    );
                    related = [...related, ...extra];
                }

                related.sort(() => 0.5 - Math.random()).slice(0, 6).forEach(data => {
                    const card = `
        <div class="asset-card loading" data-id="${data.id}" onclick="openAssetModal(this)">
            <img src="${data.Thumbnail}" class="asset-img" onload="imgLoaded(this)">
            <div class="hover-overlay">
                <div class="overlay-content">
                    <h3>${data.Title}</h3>
                    <p>${data.Categorey || data.Category}</p>
                </div>
            </div>
        </div>`;
                    container.insertAdjacentHTML("beforeend", card);
                });
            }

            /* ---------------- HELPERS & ROUTING ---------------- */
            window.imgLoaded = function (img) {
                img.classList.add('loaded');
                if (img.parentElement) img.parentElement.classList.remove('loading');
            };

            function handleRouting() {
                const params = new URLSearchParams(window.location.search);
                const id = params.get("id");
                if (id) {
                    showDetailView(id);
                } else {
                    document.getElementById("home-view").style.display = "block";
                    document.getElementById("detail-view").style.display = "none";
                }
            }

            window.openAssetModal = function (element) {
                const id = element.getAttribute("data-id");
                window.history.pushState({ id }, "", `?id=${id}`);
                showDetailView(id);
            };

            window.showHomeView = function () {
                window.history.pushState({}, "", window.location.pathname);
                handleRouting();
            };

            window.addEventListener("popstate", handleRouting);

            /* ---------------- SEARCH & FILTERS ---------------- */
         /* ---------------- SEARCH & FILTERS ---------------- */
/* ---------------- UNIVERSAL SEARCH ---------------- */
/* ---------------- DYNAMIC UNIVERSAL SEARCH ---------------- */
const searchBar = document.getElementById('search-bar');
const sectionTitle = document.querySelector('.title h2'); 
// This gets the unique title for whatever page the user is on
const defaultTitleEl = document.getElementById('default');

if (searchBar) {
    searchBar.addEventListener('input', (e) => {
        // Ensure let debounceTimer; is at the very top of your file
        clearTimeout(debounceTimer); 
        
        debounceTimer = setTimeout(() => {
            const term = e.target.value.toLowerCase().trim();
            
            // 1. DYNAMIC RESET: If search is empty, restore page-specific title
            if (!term) {
                if (sectionTitle && defaultTitleEl) {
                    sectionTitle.innerText = defaultTitleEl.textContent;
                }
                renderGrid(currentViewData);
                return;
            }

            // 2. UNIVERSAL SEARCH: Filter across all loaded assets
            const results = masterData.filter(item => {
                const title = (item.Title || "").toLowerCase();
                const industry = (item.industry || item.Industry || "").toLowerCase();
                const category = (item.Categorey || item.Category || "").toLowerCase();
                
                return title.includes(term) || 
                       industry.includes(term) || 
                       category.includes(term);
            });

            // 3. Update the Page Heading
            if (sectionTitle) {
                sectionTitle.innerHTML = results.length > 0 
                    ? `Search Results for "<span>${e.target.value}</span>" (${results.length})`
                    : `No results for "<span>${e.target.value}</span>"`;
            }

            // 4. Render results (your function handles the "Coming Soon" look)
            renderGrid(results);
            
        }, 500);
    });
}

            // Category Filter Chips
          document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function () {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        const selectedCategory = this.innerText.toLowerCase().trim();

        if (selectedCategory.includes("all")) {
            renderGrid(currentViewData);
        } else {
            const filtered = currentViewData.filter(item => {
                const itemCat = (item.Categorey || item.Category || "").toLowerCase().trim();

                return itemCat.includes(selectedCategory) || selectedCategory.includes(itemCat);
            });

            renderGrid(filtered);
        }
    });
});
            // Function to toggle dropdown
            window.toggleUserDropdown = function () {
                document.getElementById('userDropdown').classList.toggle('active');
            };

            // Close dropdown if clicked outside
            window.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-container')) {
                    document.getElementById('userDropdown')?.classList.remove('active');
                }
            });
            /* ---------------- INITIALIZE ---------------- */
            window.addEventListener("DOMContentLoaded", loadInitialData);
       const passwordInput = document.getElementById("authPassword");
const toggleIcon = document.getElementById("togglePassword");

toggleIcon.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    // Toggle input type
    passwordInput.type = isPassword ? "text" : "password";

    // Toggle icon (eye / eye-slash)
    toggleIcon.classList.toggle("fa-eye");
    toggleIcon.classList.toggle("fa-eye-slash");
});
            // Make sure this is outside of any other functions or wrappers
            function imgLoaded(img) {
                // 1. Fade the image in
                img.classList.add('loaded');

                // 2. Remove the skeleton pulse from the parent card
                img.parentElement.classList.remove('loading');
            }
 
            window.imgLoaded = function (imgElement) {
                // 1. Reveal the image
                imgElement.classList.add('loaded');

                // 2. Remove the skeleton pulse from the parent
                const wrapper = imgElement.parentElement;
                if (wrapper) {
                    wrapper.classList.remove('loading');
                }
                console.log("Image fully loaded and pulse removed.");
            };
            const openBtn = document.getElementById('openBtn');
            const closeBtn = document.getElementById('closeBtn');
            const mobileMenu = document.getElementById('mobileMenu');

            // Open Menu
            openBtn.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling while menu is open
            });

            // Close Menu
            closeBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            });

            // Close menu if a link is clicked
            document.querySelectorAll('.mobile-nav-links a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = 'auto';
                });
            });
            const categoryToggle = document.getElementById('categoryToggle');
            const parentLi = categoryToggle.parentElement;

            categoryToggle.addEventListener('click', (e) => {
                e.preventDefault(); // Stop the "#" link from jumping the page
                parentLi.classList.toggle('active');
            });

            // Close categories if main menu is closed
            closeBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                parentLi.classList.remove('active'); // Reset dropdown state
                document.body.style.overflow = '';
            });
            // Use window.functionName to ensure HTML buttons can "see" them
            window.showAuthModal = function () {
                const overlay = document.getElementById('authOverlay');
                if (overlay) {
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevents background scrolling
                } else {
                    console.error("Error: Element with ID 'authOverlay' not found.");
                }
            };

            window.closeAuthModal = function () {
                const overlay = document.getElementById('authOverlay');
                if (overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = ''; // Re-enables scrolling
                }
            };

            // Close modal if user clicks the dark background area
            window.addEventListener('click', function (event) {
                const overlay = document.getElementById('authOverlay');
                if (event.target === overlay) {
                    closeAuthModal();
                }
            });
            window.toggleNotifDropdown = function (event) {
                event.stopPropagation(); // Prevent immediate closing
                // Close profile dropdown if it's open
                document.getElementById('userDropdown')?.classList.remove('active');

                // Toggle notification dropdown
                document.getElementById('notifDropdown').classList.toggle('active');
            };

            // Update your global click listener to close BOTH dropdowns
            window.addEventListener('click', (e) => {
                // If clicking outside profile, close it
                if (!e.target.closest('.profile-container')) {
                    document.getElementById('userDropdown')?.classList.remove('active');
                }
                // If clicking outside notifications, close it
                if (!e.target.closest('.notif-container')) {
                    document.getElementById('notifDropdown')?.classList.remove('active');
                }
            });

            // Update the toggleUserDropdown to close notification menu first
            window.toggleUserDropdown = function (event) {
                if (event) event.stopPropagation();
                document.getElementById('notifDropdown')?.classList.remove('active');
                document.getElementById('userDropdown').classList.toggle('active');
            };