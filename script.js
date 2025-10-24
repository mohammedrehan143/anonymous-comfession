// Anonymous Confession Website JavaScript

class AnonymousConfession {
    constructor() {
        this.confessions = [];
        this.userConfessions = JSON.parse(localStorage.getItem('userConfessions')) || [];
        this.currentFilter = 'all';
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.colleges = JSON.parse(localStorage.getItem('colleges')) || [];
        this.adminConfessions = JSON.parse(localStorage.getItem('adminConfessions')) || [];
        this.blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
        this.vulgarWords = [
            'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'crap', 'stupid', 'idiot',
            'moron', 'retard', 'fucking', 'shitty', 'bullshit', 'piss', 'pissed', 'dick',
            'cock', 'pussy', 'whore', 'slut', 'bastard', 'son of a bitch', 'motherfucker',
            'faggot', 'nigger', 'chink', 'spic', 'kike', 'wetback', 'towelhead'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleConfessions();
        this.updateUserConfessions();
        this.setupSmoothScrolling();
        
        // Small delay to ensure DOM is fully loaded
        setTimeout(() => {
            this.checkAuthenticationStatus();
        }, 100);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href');
                this.scrollToSection(target);
                this.updateActiveNavLink(e.target);
            });
        });

        // Mobile menu
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Confession filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterButtons(e.target);
                this.filterConfessions();
            });
        });

        // Load more confessions
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreConfessions());
        }

        // Confession form (only on new-confession.html)
        const confessionForm = document.getElementById('confessionForm');
        if (confessionForm) {
            confessionForm.addEventListener('submit', (e) => this.handleConfessionSubmit(e));
        }

        // Character counter
        const confessionText = document.getElementById('confessionText');
        const charCount = document.getElementById('charCount');
        if (confessionText && charCount) {
            confessionText.addEventListener('input', () => {
                const count = confessionText.value.length;
                charCount.textContent = count;
                if (count > 1000) {
                    charCount.style.color = '#dc3545';
                } else {
                    charCount.style.color = '#999';
                }
            });
        }

        // Priority selection
        document.querySelectorAll('.priority-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectPriority(option);
            });
        });

        // Track form
        const trackForm = document.getElementById('trackForm');
        if (trackForm) {
            trackForm.addEventListener('submit', (e) => this.handleTrackSubmit(e));
        }

        // Add passkey button
        const addPasskeyBtn = document.getElementById('addPasskeyBtn');
        if (addPasskeyBtn) {
            addPasskeyBtn.addEventListener('click', () => this.showAddPasskeyModal());
        }

        // Modal events
        this.setupModalEvents();

        // Passkey input formatting
        const passkeyInput = document.getElementById('passkey');
        if (passkeyInput) {
            passkeyInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
            });
        }

        // Authentication forms
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            console.log('Register form found, adding event listener');
            registerForm.addEventListener('submit', (e) => {
                console.log('Form submit event triggered');
                this.handleRegister(e);
            });
        } else {
            console.log('Register form not found');
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // College suggestions
        const collegeInput = document.getElementById('college');
        if (collegeInput) {
            collegeInput.addEventListener('input', (e) => this.handleCollegeInput(e));
        }

        // User type change
        const userTypeSelect = document.getElementById('userType');
        if (userTypeSelect) {
            userTypeSelect.addEventListener('change', (e) => this.handleUserTypeChange(e));
        }

        // Password strength
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.checkPasswordStrength(e));
        }

        // Admin functionality
        if (window.location.pathname.includes('admin-dashboard.html')) {
            this.initAdminDashboard();
        }

        // Check if user is logged in
        this.checkAuthStatus();
    }

    setupModalEvents() {
        // Payment modal
        const paymentModal = document.getElementById('paymentModal');
        const processPaymentBtn = document.getElementById('processPayment');
        
        if (processPaymentBtn) {
            processPaymentBtn.addEventListener('click', () => this.processPayment());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 70; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    scrollToSection(target) {
        const element = document.querySelector(target);
        if (element) {
            const offsetTop = element.offsetTop - 70; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    loadSampleConfessions() {
        // Load sample confessions
        const sampleConfessions = [
            {
                id: 1,
                title: "I've been living a double life",
                text: "For the past three years, I've been leading two completely different lives. My family thinks I'm a successful business owner, but I'm actually struggling to make ends meet. The pressure is crushing me, but I can't bring myself to tell them the truth.",
                date: "2024-01-15",
                status: "approved",
                reactions: { likes: 23, support: 15, comments: 8 }
            },
            {
                id: 2,
                title: "I'm afraid of being alone forever",
                text: "I'm 28 and I've never been in a serious relationship. Everyone around me is getting married or having kids, and I feel like there's something wrong with me. I put on a brave face, but I'm terrified I'll end up alone.",
                date: "2024-01-14",
                status: "approved",
                reactions: { likes: 45, support: 32, comments: 12 }
            },
            {
                id: 3,
                title: "I regret my career choice",
                text: "I became a doctor because my parents wanted me to, but I hate it. I'm good at it, but it's not fulfilling. I want to pursue art, but I'm afraid of disappointing everyone and wasting all the years I've invested in medicine.",
                date: "2024-01-13",
                status: "approved",
                reactions: { likes: 18, support: 22, comments: 6 }
            },
            {
                id: 4,
                title: "I'm struggling with addiction",
                text: "I've been hiding my addiction from everyone for two years. I know I need help, but I'm ashamed and afraid of what people will think. I want to get better, but I don't know where to start.",
                date: "2024-01-12",
                status: "approved",
                reactions: { likes: 67, support: 89, comments: 25 }
            },
            {
                id: 5,
                title: "I feel like I'm failing as a parent",
                text: "My kids are wonderful, but I feel like I'm constantly messing up. I lose my temper too often, and I worry I'm damaging them. I love them more than anything, but I don't know if I'm cut out for this.",
                date: "2024-01-11",
                status: "approved",
                reactions: { likes: 34, support: 28, comments: 15 }
            }
        ];

        // Load user-submitted confessions from localStorage
        const userConfessions = JSON.parse(localStorage.getItem('userConfessions') || '[]');
        const approvedConfessions = userConfessions.filter(confession => confession.status === 'approved');
        
        // Combine sample and user confessions
        this.confessions = [...sampleConfessions, ...approvedConfessions];
        
        console.log('Loaded confessions:', this.confessions.length);
        this.displayConfessions();
    }

    displayConfessions() {
        const grid = document.getElementById('confessionsGrid');
        if (!grid) return;

        const filteredConfessions = this.getFilteredConfessions();
        
        grid.innerHTML = filteredConfessions.map(confession => `
            <div class="confession-card">
                <h3 class="confession-title">${confession.title}</h3>
                <p class="confession-text">${confession.text}</p>
                <div class="confession-meta">
                    <div class="confession-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(confession.date)}
                    </div>
                    <div class="confession-reactions">
                        <button class="reaction-btn" onclick="this.classList.toggle('active')">
                            <i class="fas fa-heart"></i>
                            ${confession.reactions.likes}
                        </button>
                        <button class="reaction-btn" onclick="this.classList.toggle('active')">
                            <i class="fas fa-hands-helping"></i>
                            ${confession.reactions.support}
                        </button>
                        <button class="reaction-btn">
                            <i class="fas fa-comment"></i>
                            ${confession.reactions.comments}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getFilteredConfessions() {
        let filtered = [...this.confessions];
        
        switch (this.currentFilter) {
            case 'recent':
                filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'popular':
                filtered = filtered.sort((a, b) => (b.reactions.likes + b.reactions.support) - (a.reactions.likes + a.reactions.support));
                break;
            default:
                break;
        }
        
        return filtered;
    }

    filterConfessions() {
        this.displayConfessions();
    }

    updateFilterButtons(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    loadMoreConfessions() {
        // Simulate loading more confessions
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<span class="loading"></span> Loading...';
            loadMoreBtn.disabled = true;
            
            setTimeout(() => {
                loadMoreBtn.innerHTML = 'Load More Confessions';
                loadMoreBtn.disabled = false;
                // In a real app, you would load more data here
            }, 1500);
        }
    }

    selectPriority(option) {
        document.querySelectorAll('.priority-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
    }

    handleConfessionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = document.getElementById('confessionTitle').value;
        const text = document.getElementById('confessionText').value;
        const selectedPriority = document.querySelector('.priority-option.selected');
        
        if (!selectedPriority) {
            alert('Please select a priority level');
            return;
        }
        
        const priority = selectedPriority.dataset.priority;
        
        if (priority === 'high' || priority === 'mid') {
            this.showPaymentModal(priority);
        } else {
            this.submitConfession(title, text, priority);
        }
    }

    showPaymentModal(priority) {
        const modal = document.getElementById('paymentModal');
        const priorityElement = document.getElementById('paymentPriority');
        const amountElement = document.getElementById('paymentAmount');
        
        const prices = {
            'mid': '$2.99',
            'high': '$9.99'
        };
        
        const priorityNames = {
            'mid': 'Mid Priority',
            'high': 'High Priority'
        };
        
        priorityElement.textContent = priorityNames[priority];
        amountElement.textContent = prices[priority];
        
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Store the confession data for after payment
        this.pendingConfession = {
            title: document.getElementById('confessionTitle').value,
            text: document.getElementById('confessionText').value,
            priority: priority
        };
    }

    processPayment() {
        // Simulate payment processing
        const processBtn = document.getElementById('processPayment');
        processBtn.innerHTML = '<span class="loading"></span> Processing...';
        processBtn.disabled = true;
        
        setTimeout(() => {
            this.closeModal();
            this.submitConfession(
                this.pendingConfession.title,
                this.pendingConfession.text,
                this.pendingConfession.priority
            );
        }, 2000);
    }

    submitConfession(title, text, priority) {
        const passkey = this.generatePasskey();
        const confession = {
            id: Date.now(),
            title,
            text,
            priority,
            passkey,
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        this.userConfessions.push(confession);
        localStorage.setItem('userConfessions', JSON.stringify(this.userConfessions));
        
        this.showSuccessModal(passkey);
        this.resetForm();
        this.updateUserConfessions();
    }

    generatePasskey() {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    showSuccessModal(passkey) {
        const modal = document.getElementById('successModal');
        const passkeyElement = document.getElementById('generatedPasskey');
        
        passkeyElement.textContent = passkey;
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    resetForm() {
        document.getElementById('confessionForm').reset();
        document.getElementById('charCount').textContent = '0';
        document.querySelectorAll('.priority-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    }

    handleTrackSubmit(e) {
        e.preventDefault();
        
        const passkey = document.getElementById('passkey').value;
        const resultDiv = document.getElementById('trackResult');
        
        if (passkey.length !== 10) {
            alert('Please enter a valid 10-digit passkey');
            return;
        }
        
        const confession = this.userConfessions.find(c => c.passkey === passkey);
        
        if (confession) {
            resultDiv.innerHTML = `
                <div class="track-result">
                    <h3>Confession Found</h3>
                    <div class="confession-details">
                        <h4>${confession.title}</h4>
                        <p>${confession.text}</p>
                        <div class="confession-info">
                            <p><strong>Priority:</strong> ${confession.priority.charAt(0).toUpperCase() + confession.priority.slice(1)}</p>
                            <p><strong>Submitted:</strong> ${this.formatDate(confession.date)}</p>
                            <p><strong>Status:</strong> 
                                <span class="status-badge status-${confession.status}">
                                    ${confession.status.charAt(0).toUpperCase() + confession.status.slice(1)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="track-result">
                    <h3>Confession Not Found</h3>
                    <p>No confession found with the provided passkey. Please check your passkey and try again.</p>
                </div>
            `;
        }
        
        resultDiv.style.display = 'block';
    }

    updateUserConfessions() {
        const container = document.getElementById('userConfessions');
        if (!container) return;
        
        // Load user confessions from localStorage
        const userConfessions = JSON.parse(localStorage.getItem('userConfessions') || '[]');
        this.userConfessions = userConfessions;
        
        if (this.userConfessions.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>No confessions submitted yet. <a href="new-confession.html">Submit your first confession</a></p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.userConfessions.map(confession => `
            <div class="user-confession-item">
                <div class="user-confession-header">
                    <h4 class="user-confession-title">${confession.title}</h4>
                    <span class="user-confession-passkey">${confession.passkey}</span>
                </div>
                <p class="user-confession-text">${confession.text}</p>
                <div class="user-confession-meta">
                    <span>Priority: ${confession.priority.charAt(0).toUpperCase() + confession.priority.slice(1)}</span>
                    <span>Status: 
                        <span class="status-badge status-${confession.status}">
                            ${confession.status.charAt(0).toUpperCase() + confession.status.slice(1)}
                        </span>
                    </span>
                    <span>Submitted: ${this.formatDate(confession.date)}</span>
                </div>
            </div>
        `).join('');
        
        console.log('Updated user confessions:', this.userConfessions.length);
    }

    refreshConfessions() {
        // Refresh both main confessions and user confessions
        this.loadSampleConfessions();
        this.updateUserConfessions();
    }

    // Vulgar language detection
    detectVulgarLanguage(text) {
        const lowerText = text.toLowerCase();
        const foundWords = [];
        
        for (const word of this.vulgarWords) {
            if (lowerText.includes(word.toLowerCase())) {
                foundWords.push(word);
            }
        }
        
        return {
            hasVulgarLanguage: foundWords.length > 0,
            foundWords: foundWords
        };
    }

    // Block user for vulgar language
    blockUser(userId, reason = 'Inappropriate content detected') {
        if (!this.blockedUsers.includes(userId)) {
            this.blockedUsers.push(userId);
            localStorage.setItem('blockedUsers', JSON.stringify(this.blockedUsers));
            console.log('User blocked:', userId, 'Reason:', reason);
        }
    }

    // Unblock user (admin only)
    unblockUser(userId) {
        const index = this.blockedUsers.indexOf(userId);
        if (index > -1) {
            this.blockedUsers.splice(index, 1);
            localStorage.setItem('blockedUsers', JSON.stringify(this.blockedUsers));
            console.log('User unblocked:', userId);
            return true;
        }
        return false;
    }

    // Check if user is blocked
    isUserBlocked(userId) {
        return this.blockedUsers.includes(userId);
    }

    // Get blocked users list (admin only)
    getBlockedUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.filter(user => this.blockedUsers.includes(user.id));
    }

    showAddPasskeyModal() {
        const passkey = prompt('Enter a 10-digit passkey to track:');
        if (passkey && passkey.length === 10 && /^\d{10}$/.test(passkey)) {
            // Add to user confessions for tracking
            const newConfession = {
                id: Date.now(),
                title: 'Tracked Confession',
                text: 'Confession tracked via passkey',
                priority: 'unknown',
                passkey: passkey,
                date: new Date().toISOString().split('T')[0],
                status: 'tracking'
            };
            
            this.userConfessions.push(newConfession);
            localStorage.setItem('userConfessions', JSON.stringify(this.userConfessions));
            this.updateUserConfessions();
        } else if (passkey) {
            alert('Please enter a valid 10-digit numeric passkey');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Authentication Methods
    handleRegister(e) {
        e.preventDefault();
        console.log('Registration form submitted'); // Debug log
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const college = document.getElementById('college').value;
        const userType = document.getElementById('userType').value;
        
        console.log('Form data:', { email, college, userType }); // Debug log
        
        // Validate password strength
        if (this.getPasswordStrength(password) < 2) {
            alert('Please choose a stronger password');
            return;
        }
        
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(user => user.email === email)) {
            alert('Email already registered. Please login instead.');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            email,
            password, // In real app, this should be hashed
            college,
            userType,
            createdAt: new Date().toISOString(),
            isActive: userType === 'user' // Admins need approval
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Add college to suggestions if not exists
        if (!this.colleges.includes(college)) {
            this.colleges.push(college);
            localStorage.setItem('colleges', JSON.stringify(this.colleges));
        }
        
        // Show success message
        const successMessage = userType === 'admin' 
            ? 'Your admin account has been created and is pending approval. You will be notified once approved.'
            : 'Your account has been created successfully! You can now login.';
        
        document.getElementById('successMessage').textContent = successMessage;
        this.showSuccessModal();
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            this.showErrorModal('Invalid email or password. Please try again.');
            return;
        }
        
        if (user.userType === 'admin' && !user.isActive) {
            this.showErrorModal('Your admin account is pending approval. Please contact support.');
            return;
        }
        
        // Login successful
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect based on user type
        if (user.userType === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    handleCollegeInput(e) {
        const query = e.target.value.toLowerCase();
        const suggestions = this.colleges.filter(college => 
            college.toLowerCase().includes(query)
        );
        
        this.showCollegeSuggestions(suggestions);
    }

    showCollegeSuggestions(suggestions) {
        const container = document.getElementById('collegeSuggestions');
        if (!container) return;
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.innerHTML = suggestions.map(college => `
            <div class="suggestion-item" onclick="app.selectCollege('${college}')">
                ${college}
            </div>
        `).join('');
        
        container.style.display = 'block';
    }

    selectCollege(college) {
        document.getElementById('college').value = college;
        const suggestions = document.getElementById('collegeSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    handleUserTypeChange(e) {
        const adminNote = document.getElementById('adminNote');
        if (e.target.value === 'admin') {
            adminNote.style.display = 'flex';
        } else {
            adminNote.style.display = 'none';
        }
    }

    checkPasswordStrength(e) {
        const password = e.target.value;
        const strength = this.getPasswordStrength(password);
        const fill = document.getElementById('strengthFill');
        const text = document.getElementById('strengthText');
        
        if (!fill || !text) return;
        
        const colors = ['#dc3545', '#ffc107', '#28a745'];
        const labels = ['Weak', 'Medium', 'Strong'];
        
        fill.style.width = `${(strength + 1) * 33.33}%`;
        fill.style.background = colors[strength];
        text.textContent = labels[strength];
    }

    getPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return Math.min(strength - 1, 2);
    }

    checkAuthStatus() {
        if (this.currentUser) {
            this.updateNavigation();
        }
    }

    checkAuthenticationStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        this.currentUser = currentUser;
        
        console.log('Authentication check:', currentUser ? 'Logged in' : 'Not logged in');
        
        // Always update navigation based on current state
        this.updateNavigation();
        
        if (currentUser && currentUser.email) {
            this.removeBlurFromConfessions();
            this.hideLoginPrompts();
            console.log('User authenticated, removing blur');
        } else {
            this.addBlurToConfessions();
            this.showLoginPrompt();
            console.log('User not authenticated, adding blur');
        }
    }

    addBlurToConfessions() {
        const confessionsSection = document.getElementById('confessions');
        if (confessionsSection) {
            confessionsSection.classList.add('blurred-section');
        }
        
        const newConfessionCard = document.querySelector('.new-confession-card');
        if (newConfessionCard) {
            newConfessionCard.classList.add('blurred-section');
        }
    }

    removeBlurFromConfessions() {
        const confessionsSection = document.getElementById('confessions');
        if (confessionsSection) {
            confessionsSection.classList.remove('blurred-section');
        }
        
        const newConfessionCard = document.querySelector('.new-confession-card');
        if (newConfessionCard) {
            newConfessionCard.classList.remove('blurred-section');
        }
    }

    showLoginPrompt() {
        // Add login prompt overlay to confession sections
        const confessionsSection = document.getElementById('confessions');
        if (confessionsSection && !document.getElementById('loginPrompt')) {
            const loginPrompt = document.createElement('div');
            loginPrompt.id = 'loginPrompt';
            loginPrompt.className = 'login-prompt';
            loginPrompt.innerHTML = `
                <div class="login-prompt-content">
                    <i class="fas fa-lock"></i>
                    <h3>Login Required</h3>
                    <p>Please login or register to view and submit confessions</p>
                    <div class="login-prompt-buttons">
                        <a href="login.html" class="btn btn-primary">Login</a>
                        <a href="register.html" class="btn btn-outline">Register</a>
                    </div>
                </div>
            `;
            confessionsSection.appendChild(loginPrompt);
        }

        const newConfessionCard = document.querySelector('.new-confession-card');
        if (newConfessionCard && !document.getElementById('newConfessionPrompt')) {
            const newConfessionPrompt = document.createElement('div');
            newConfessionPrompt.id = 'newConfessionPrompt';
            newConfessionPrompt.className = 'login-prompt';
            newConfessionPrompt.innerHTML = `
                <div class="login-prompt-content">
                    <i class="fas fa-lock"></i>
                    <h3>Login Required</h3>
                    <p>Please login or register to submit confessions</p>
                    <div class="login-prompt-buttons">
                        <a href="login.html" class="btn btn-primary">Login</a>
                        <a href="register.html" class="btn btn-outline">Register</a>
                    </div>
                </div>
            `;
            newConfessionCard.appendChild(newConfessionPrompt);
        }
    }

    hideLoginPrompts() {
        const loginPrompt = document.getElementById('loginPrompt');
        if (loginPrompt) {
            loginPrompt.remove();
        }
        
        const newConfessionPrompt = document.getElementById('newConfessionPrompt');
        if (newConfessionPrompt) {
            newConfessionPrompt.remove();
        }
    }

    showLoginRegisterButtons() {
        const navAuth = document.querySelector('.nav-auth');
        if (navAuth) {
            navAuth.innerHTML = `
                <a href="login.html" class="btn btn-outline">Login</a>
                <a href="register.html" class="btn btn-primary">Register</a>
            `;
        }
    }

    updateNavigation() {
        const navAuth = document.querySelector('.nav-auth');
        if (!navAuth) {
            console.log('Navigation auth element not found');
            return;
        }
        
        if (this.currentUser && this.currentUser.email) {
            navAuth.innerHTML = `
                <span class="user-info">Welcome, ${this.currentUser.email}</span>
                <button class="btn btn-outline" onclick="logout()">Logout</button>
            `;
            console.log('Navigation updated: Logged in state');
        } else {
            navAuth.innerHTML = `
                <a href="login.html" class="btn btn-outline">Login</a>
                <a href="register.html" class="btn btn-primary">Register</a>
            `;
            console.log('Navigation updated: Not logged in state');
        }
    }

    showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const messageEl = document.getElementById('errorMessage');
        if (modal && messageEl) {
            messageEl.textContent = message;
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // Admin Dashboard Methods
    initAdminDashboard() {
        this.loadAdminConfessions();
        this.updateAdminStats();
        this.setupAdminFilters();
        this.displayAdminConfessions();
    }

    loadAdminConfessions() {
        // Load all confessions for admin review
        const allConfessions = JSON.parse(localStorage.getItem('userConfessions')) || [];
        this.adminConfessions = allConfessions.map(confession => ({
            ...confession,
            adminReviewed: false,
            adminNotes: ''
        }));
        localStorage.setItem('adminConfessions', JSON.stringify(this.adminConfessions));
    }

    updateAdminStats() {
        const pending = this.adminConfessions.filter(c => c.status === 'pending').length;
        const approved = this.adminConfessions.filter(c => c.status === 'approved').length;
        const rejected = this.adminConfessions.filter(c => c.status === 'rejected').length;
        const total = this.adminConfessions.length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;
        document.getElementById('totalCount').textContent = total;
    }

    setupAdminFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const searchInput = document.getElementById('searchInput');

        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterAdminConfessions());
        }
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.filterAdminConfessions());
        }
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterAdminConfessions());
        }
    }

    filterAdminConfessions() {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'all';
        const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

        let filtered = [...this.adminConfessions];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(c => c.priority === priorityFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(c => 
                c.title.toLowerCase().includes(searchQuery) ||
                c.text.toLowerCase().includes(searchQuery)
            );
        }

        this.displayAdminConfessions(filtered);
    }

    displayAdminConfessions(confessions = this.adminConfessions) {
        const container = document.getElementById('adminConfessions');
        if (!container) return;

        if (confessions.length === 0) {
            container.innerHTML = '<div class="text-center"><p>No confessions found.</p></div>';
            return;
        }

        container.innerHTML = confessions.map(confession => `
            <div class="admin-confession-item">
                <div class="admin-confession-header">
                    <div>
                        <h3 class="admin-confession-title">${confession.title}</h3>
                        <div class="admin-confession-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(confession.date)}
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-key"></i>
                                ${confession.passkey}
                            </div>
                            <span class="status-badge status-${confession.status}">
                                ${confession.status.charAt(0).toUpperCase() + confession.status.slice(1)}
                            </span>
                            <span class="priority-badge priority-${confession.priority}">
                                ${confession.priority.charAt(0).toUpperCase() + confession.priority.slice(1)} Priority
                            </span>
                        </div>
                    </div>
                </div>
                <div class="admin-confession-text" id="text-${confession.id}">
                    ${confession.text}
                    ${confession.text.length > 200 ? '<span class="read-more" onclick="this.toggleText(' + confession.id + ')">Read more</span>' : ''}
                </div>
                <div class="admin-confession-actions">
                    <button class="btn btn-success" onclick="app.approveConfession('${confession.passkey}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-warning" onclick="app.holdConfession('${confession.passkey}')">
                        <i class="fas fa-pause"></i> Hold
                    </button>
                    <button class="btn btn-danger" onclick="app.rejectConfession('${confession.passkey}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    approveConfession(passkey) {
        this.updateConfessionStatus(passkey, 'approved');
    }

    holdConfession(passkey) {
        this.updateConfessionStatus(passkey, 'pending');
    }

    rejectConfession(passkey) {
        this.updateConfessionStatus(passkey, 'rejected');
    }

    updateConfessionStatus(passkey, status) {
        const confession = this.adminConfessions.find(c => c.passkey === passkey);
        if (confession) {
            confession.status = status;
            confession.adminReviewed = true;
            confession.reviewedAt = new Date().toISOString();
            
            localStorage.setItem('adminConfessions', JSON.stringify(this.adminConfessions));
            
            // Also update user confessions
            const userConfessions = JSON.parse(localStorage.getItem('userConfessions')) || [];
            const userConfession = userConfessions.find(c => c.passkey === passkey);
            if (userConfession) {
                userConfession.status = status;
                localStorage.setItem('userConfessions', JSON.stringify(userConfessions));
            }
            
            this.updateAdminStats();
            this.filterAdminConfessions();
        }
    }
}

// Global functions
function logout() {
    // Clear all user data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionData');
    localStorage.removeItem('users');
    localStorage.removeItem('confessions');
    localStorage.removeItem('adminConfessions');
    
    // Force page reload to ensure clean state
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        // If already on home page, reload it
        window.location.reload();
    } else {
        // If on other pages, redirect to home
        window.location.href = 'index.html';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AnonymousConfession();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling to navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    });

    // Add animation to cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    document.querySelectorAll('.confession-card, .priority-card, .user-confession-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});
