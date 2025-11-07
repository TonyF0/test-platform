// API взаимодействие с бэкендом
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.reload();
                return;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Методы для тестов
    async createTest(testData) {
        return this.request('/tests/create', {
            method: 'POST',
            body: JSON.stringify(testData)
        });
    }

    async getTests() {
        return this.request('/tests');
    }

    async getTest(testId) {
        return this.request(`/tests/${testId}`);
    }

    async assignTest(testId, classId) {
        return this.request('/tests/assign', {
            method: 'POST',
            body: JSON.stringify({ testId, classId })
        });
    }

    // Методы для классов
    async createClass(className) {
        return this.request('/classes/create', {
            method: 'POST',
            body: JSON.stringify({ name: className })
        });
    }

    async getClasses() {
        return this.request('/classes');
    }

    // Методы для результатов
    async submitTestResults(testId, answers) {
        return this.request('/results/submit', {
            method: 'POST',
            body: JSON.stringify({ testId, answers })
        });
    }

    async getResults() {
        return this.request('/results');
    }
}

// Создаем глобальный экземпляр API сервиса
const apiService = new ApiService();