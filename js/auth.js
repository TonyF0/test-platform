// Логика аутентификации
class AuthManager {
    constructor() {
        this.setupAuthModals();
    }

    setupAuthModals() {
        // Элементы модальных окон
        this.registerModal = document.getElementById('registerModal');
        this.loginModal = document.getElementById('loginModal');
        this.registerBtn = document.getElementById('registerBtn');
        this.loginBtn = document.getElementById('loginBtn');
        this.heroRegisterBtn = document.getElementById('heroRegisterBtn');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Открытие модальных окон
        this.registerBtn.addEventListener('click', () => this.openModal('register'));
        this.loginBtn.addEventListener('click', () => this.openModal('login'));
        this.heroRegisterBtn.addEventListener('click', () => this.openModal('register'));
        
        // Закрытие модальных окон
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.closeModal('register'));
        document.getElementById('closeLoginModal').addEventListener('click', () => this.closeModal('login'));
        
        // Переключение ролей
        document.querySelectorAll('.role-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleRoleSelection(e));
        });
        
        // Обработка форм
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        
        // Закрытие при клике вне модального окна
        window.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    openModal(type) {
        const modal = type === 'register' ? this.registerModal : this.loginModal;
        modal.style.display = 'flex';
    }

    closeModal(type) {
        const modal = type === 'register' ? this.registerModal : this.loginModal;
        modal.style.display = 'none';
    }

    handleRoleSelection(e) {
        const option = e.target.closest('.role-option');
        const modal = option.closest('.modal-content');
        const roleOptions = modal.querySelectorAll('.role-option');
        
        // Убираем активный класс у всех опций
        roleOptions.forEach(opt => opt.classList.remove('active'));
        // Добавляем активный класс к выбранной опции
        option.classList.add('active');
        
        // Показываем/скрываем поле для кода преподавателя
        const teacherCodeGroup = modal.querySelector('#teacherCodeGroup');
        if (teacherCodeGroup && option.dataset.role === 'teacher') {
            teacherCodeGroup.style.display = 'block';
        } else if (teacherCodeGroup) {
            teacherCodeGroup.style.display = 'none';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const role = e.target.querySelector('.role-option.active').dataset.role;
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: role,
            teacherCode: formData.get('teacherCode')
        };
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('authToken', result.token);
                alert('Регистрация успешно завершена!');
                this.closeModal('register');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Ошибка регистрации: ${error.message}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Ошибка соединения с сервером');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const role = e.target.querySelector('.role-option.active').dataset.role;
        
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password'),
            role: role
        };
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('authToken', result.token);
                alert('Вход выполнен успешно!');
                this.closeModal('login');
                window.location.reload();
            } else {
                const error = await response.json();
                alert(`Ошибка входа: ${error.message}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Ошибка соединения с сервером');
        }
    }

    handleOutsideClick(e) {
        if (e.target === this.registerModal) {
            this.closeModal('register');
        }
        if (e.target === this.loginModal) {
            this.closeModal('login');
        }
    }
}

// Инициализация менеджера аутентификации
const authManager = new AuthManager();