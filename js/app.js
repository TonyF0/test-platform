// Основная логика приложения
class TestPlatform {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            this.validateToken(token);
        }
    }

    async validateToken(token) {
        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                this.showDashboard();
            } else {
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Token validation failed:', error);
        }
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', this.smoothScroll.bind(this));
        });
    }

    smoothScroll(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    showDashboard() {
        if (this.currentUser.role === 'teacher') {
            window.location.href = '/pages/teacher-dashboard.html';
        } else {
            window.location.href = '/pages/student-dashboard.html';
        }
    }
}

// Инициализация приложения
const app = new TestPlatform();