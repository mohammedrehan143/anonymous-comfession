// Anonymous Confession Backend System
// Pure JavaScript Backend with Device Memory Storage

class BackendAPI {
    constructor() {
        this.initializeStorage();
        this.setupEventListeners();
    }

    initializeStorage() {
        // Initialize all required storage keys
        const storageKeys = [
            'users',
            'colleges', 
            'confessions',
            'adminConfessions',
            'currentUser',
            'sessionData',
            'appSettings'
        ];

        storageKeys.forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(key === 'appSettings' ? {
                    version: '1.0.0',
                    lastBackup: null,
                    totalUsers: 0,
                    totalConfessions: 0
                } : []));
            }
        });

        console.log('Backend initialized with device memory storage');
    }

    setupEventListeners() {
        // Listen for storage changes across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'users' || e.key === 'confessions') {
                this.notifyDataChange(e.key);
            }
        });
    }

    // User Management
    async registerUser(userData) {
        try {
            const { email, password, college, userType } = userData;
            
            // Validate input
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            
            if (!this.validatePassword(password)) {
                throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
            }

            if (!college || college.trim().length < 2) {
                throw new Error('College name is required');
            }

            if (!userType || !['user', 'admin'].includes(userType)) {
                throw new Error('Invalid user type');
            }

            // Check if email already exists
            const users = this.getUsers();
            if (users.find(user => user.email.toLowerCase() === email.toLowerCase())) {
                throw new Error('Email already registered');
            }

            // Create new user
            const newUser = {
                id: this.generateId(),
                email: email.toLowerCase().trim(),
                password: this.hashPassword(password),
                college: college.trim(),
                userType,
                isActive: userType === 'user', // Admins need approval
                createdAt: new Date().toISOString(),
                lastLogin: null,
                profile: {
                    totalConfessions: 0,
                    approvedConfessions: 0,
                    rejectedConfessions: 0
                }
            };

            // Save user
            users.push(newUser);
            this.saveUsers(users);

            // Add college to suggestions
            this.addCollege(college.trim());

            // Update app statistics
            this.updateAppStats('user');

            console.log('User registered successfully:', newUser.email);
            return {
                success: true,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    college: newUser.college,
                    userType: newUser.userType,
                    isActive: newUser.isActive
                },
                message: userType === 'admin' 
                    ? 'Admin account created and pending approval'
                    : 'Account created successfully'
            };

        } catch (error) {
            console.error('Registration error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loginUser(email, password) {
        try {
            const users = this.getUsers();
            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                this.verifyPassword(password, u.password)
            );

            if (!user) {
                throw new Error('Invalid email or password');
            }

            if (user.userType === 'admin' && !user.isActive) {
                throw new Error('Admin account pending approval');
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers(users);

            // Set current user session
            this.setCurrentUser(user);

            console.log('User logged in:', user.email);
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    college: user.college,
                    userType: user.userType,
                    isActive: user.isActive
                },
                redirectTo: user.userType === 'admin' ? 'admin-dashboard.html' : 'index.html'
            };

        } catch (error) {
            console.error('Login error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async logoutUser() {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionData');
            console.log('User logged out');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Confession Management
    async submitConfession(confessionData) {
        try {
            const { title, text, priority, userId } = confessionData;
            
            if (!title || title.trim().length < 3) {
                throw new Error('Title must be at least 3 characters');
            }
            
            if (!text || text.trim().length < 10) {
                throw new Error('Confession must be at least 10 characters');
            }

            if (!['low', 'mid', 'high'].includes(priority)) {
                throw new Error('Invalid priority level');
            }

            const confession = {
                id: this.generateId(),
                title: title.trim(),
                text: text.trim(),
                priority,
                userId: userId || 'anonymous',
                passkey: this.generatePasskey(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                reviewedAt: null,
                adminNotes: '',
                reactions: {
                    likes: 0,
                    support: 0,
                    comments: 0
                }
            };

            // Save confession
            const confessions = this.getConfessions();
            confessions.push(confession);
            this.saveConfessions(confessions);

            // Update user stats
            if (userId && userId !== 'anonymous') {
                this.updateUserStats(userId, 'confession_submitted');
            }

            // Update app statistics
            this.updateAppStats('confession');

            console.log('Confession submitted:', confession.passkey);
            return {
                success: true,
                confession: {
                    id: confession.id,
                    passkey: confession.passkey,
                    status: confession.status,
                    priority: confession.priority
                },
                message: 'Confession submitted successfully'
            };

        } catch (error) {
            console.error('Confession submission error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getConfessions(filter = {}) {
        try {
            let confessions = this.getConfessions();
            
            // Apply filters
            if (filter.status) {
                confessions = confessions.filter(c => c.status === filter.status);
            }
            
            if (filter.priority) {
                confessions = confessions.filter(c => c.priority === filter.priority);
            }
            
            if (filter.search) {
                const searchTerm = filter.search.toLowerCase();
                confessions = confessions.filter(c => 
                    c.title.toLowerCase().includes(searchTerm) ||
                    c.text.toLowerCase().includes(searchTerm)
                );
            }

            // Sort by creation date (newest first)
            confessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return {
                success: true,
                confessions: confessions,
                total: confessions.length
            };

        } catch (error) {
            console.error('Get confessions error:', error.message);
            return {
                success: false,
                error: error.message,
                confessions: []
            };
        }
    }

    async trackConfession(passkey) {
        try {
            const confessions = this.getConfessions();
            const confession = confessions.find(c => c.passkey === passkey);

            if (!confession) {
                throw new Error('Confession not found');
            }

            return {
                success: true,
                confession: {
                    id: confession.id,
                    title: confession.title,
                    text: confession.text,
                    status: confession.status,
                    priority: confession.priority,
                    createdAt: confession.createdAt,
                    reviewedAt: confession.reviewedAt
                }
            };

        } catch (error) {
            console.error('Track confession error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Admin Functions
    async updateConfessionStatus(passkey, status, adminNotes = '') {
        try {
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                throw new Error('Invalid status');
            }

            const confessions = this.getConfessions();
            const confession = confessions.find(c => c.passkey === passkey);

            if (!confession) {
                throw new Error('Confession not found');
            }

            confession.status = status;
            confession.reviewedAt = new Date().toISOString();
            confession.adminNotes = adminNotes;

            this.saveConfessions(confessions);

            // Update user stats if applicable
            if (confession.userId && confession.userId !== 'anonymous') {
                this.updateUserStats(confession.userId, `confession_${status}`);
            }

            console.log('Confession status updated:', passkey, status);
            return {
                success: true,
                message: `Confession ${status} successfully`
            };

        } catch (error) {
            console.error('Update confession status error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility Functions
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /[0-9]/.test(password);
    }

    hashPassword(password) {
        // Simple hash function (in production, use proper hashing)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generatePasskey() {
        return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    // Storage Functions
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
        this.notifyDataChange('users');
    }

    getConfessions() {
        return JSON.parse(localStorage.getItem('confessions') || '[]');
    }

    saveConfessions(confessions) {
        localStorage.setItem('confessions', JSON.stringify(confessions));
        this.notifyDataChange('confessions');
    }

    getColleges() {
        return JSON.parse(localStorage.getItem('colleges') || '[]');
    }

    addCollege(college) {
        const colleges = this.getColleges();
        if (!colleges.includes(college)) {
            colleges.push(college);
            localStorage.setItem('colleges', JSON.stringify(colleges));
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    updateAppStats(type) {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
        if (type === 'user') {
            settings.totalUsers = (settings.totalUsers || 0) + 1;
        } else if (type === 'confession') {
            settings.totalConfessions = (settings.totalConfessions || 0) + 1;
        }
        settings.lastBackup = new Date().toISOString();
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }

    updateUserStats(userId, action) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user && user.profile) {
            switch (action) {
                case 'confession_submitted':
                    user.profile.totalConfessions++;
                    break;
                case 'confession_approved':
                    user.profile.approvedConfessions++;
                    break;
                case 'confession_rejected':
                    user.profile.rejectedConfessions++;
                    break;
            }
            this.saveUsers(users);
        }
    }

    notifyDataChange(dataType) {
        // Notify other parts of the app about data changes
        window.dispatchEvent(new CustomEvent('dataChanged', {
            detail: { dataType, timestamp: new Date().toISOString() }
        }));
    }

    // Backup and Restore
    async backupData() {
        try {
            const backup = {
                users: this.getUsers(),
                confessions: this.getConfessions(),
                colleges: this.getColleges(),
                settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                timestamp: new Date().toISOString()
            };
            
            const backupData = JSON.stringify(backup);
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `confession-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'Backup created successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async restoreData(file) {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            if (backup.users) localStorage.setItem('users', JSON.stringify(backup.users));
            if (backup.confessions) localStorage.setItem('confessions', JSON.stringify(backup.confessions));
            if (backup.colleges) localStorage.setItem('colleges', JSON.stringify(backup.colleges));
            if (backup.settings) localStorage.setItem('appSettings', JSON.stringify(backup.settings));
            
            this.notifyDataChange('all');
            return { success: true, message: 'Data restored successfully' };
        } catch (error) {
            return { success: false, error: 'Invalid backup file' };
        }
    }
}

// Initialize backend
window.backend = new BackendAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendAPI;
}
