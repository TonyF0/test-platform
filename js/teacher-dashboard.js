class TeacherDashboard {
    constructor() {
        this.currentUser = null;
        this.classes = [];
        this.tests = [];
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        try {
            const response = await fetch('/api/auth/validate', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            this.currentUser = await response.json();
            if (this.currentUser.role !== 'teacher') {
                window.location.href = '../index.html';
                return;
            }

            document.getElementById('userName').textContent = this.currentUser.username;
        } catch (error) {
            localStorage.removeItem('authToken');
            window.location.href = '../index.html';
        }
    }

    async loadData() {
        try {
            // Загрузка классов
            const classesResponse = await apiService.request('/classes');
            this.classes = classesResponse.classes || [];
            this.renderClasses();

            // Загрузка тестов
            const testsResponse = await apiService.request('/tests');
            this.tests = testsResponse.tests || [];
            this.renderTests();

            // Загрузка классов для выпадающего списка
            this.loadClassesForSelect();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Ошибка загрузки данных');
        }
    }

    renderClasses() {
        const grid = document.getElementById('classesGrid');
        grid.innerHTML = '';

        if (this.classes.length === 0) {
            grid.innerHTML = '<p class="no-data">У вас пока нет классов</p>';
            return;
        }

        this.classes.forEach(classItem => {
            const classCard = this.createClassCard(classItem);
            grid.appendChild(classCard);
        });
    }

    createClassCard(classItem) {
        const card = document.createElement('div');
        card.className = 'class-card';
        
        card.innerHTML = `
            <div class="class-header">
                <h3 class="class-name">${classItem.name}</h3>
                <span class="class-id">ID: ${classItem.id}</span>
            </div>
            <div class="class-meta">
                <span>Учеников: ${classItem.students_count || 0}</span>
                <span>Тестов: ${classItem.tests_count || 0}</span>
                <div class="access-code">
                    Код доступа: ${classItem.access_code}
                </div>
            </div>
            <div class="class-actions">
                <button class="btn btn-outline view-students" data-id="${classItem.id}">Ученики</button>
                <button class="btn btn-primary assign-test" data-id="${classItem.id}">Назначить тест</button>
            </div>
        `;

        return card;
    }

    renderTests() {
        const grid = document.getElementById('testsGrid');
        grid.innerHTML = '';

        if (this.tests.length === 0) {
            grid.innerHTML = '<p class="no-data">У вас пока нет тестов</p>';
            return;
        }

        this.tests.forEach(test => {
            const testCard = this.createTestCard(test);
            grid.appendChild(testCard);
        });
    }

    createTestCard(test) {
        const card = document.createElement('div');
        card.className = 'test-card';
        
        card.innerHTML = `
            <div class="test-header">
                <h3 class="test-topic">${test.topic}</h3>
                <span class="test-difficulty">${this.getDifficultyIcon(test.difficulty)}</span>
            </div>
            <div class="test-meta">
                <span>Вопросов: ${test.questions_count}</span>
                <span>Создан: ${new Date(test.created_at).toLocaleDateString()}</span>
                <span>Назначен: ${test.class_name || 'Не назначен'}</span>
            </div>
            <div class="test-actions">
                <button class="btn btn-outline view-test" data-id="${test.id}">Просмотр</button>
                <button class="btn btn-primary assign-test-btn" data-id="${test.id}">Назначить</button>
            </div>
        `;

        return card;
    }

    getDifficultyIcon(difficulty) {
        const icons = {
            'легкий': '🟢',
            'средний': '🟡', 
            'сложный': '🔴'
        };
        return icons[difficulty] || '⚪';
    }

    loadClassesForSelect() {
        const select = document.getElementById('testClass');
        select.innerHTML = '<option value="">Не назначать</option>';
        
        this.classes.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.id;
            option.textContent = classItem.name;
            select.appendChild(option);
        });
    }

    updateStats() {
        document.getElementById('classesCount').textContent = this.classes.length;
        document.getElementById('testsCount').textContent = this.tests.length;
        
        const totalStudents = this.classes.reduce((sum, classItem) => 
            sum + (classItem.students_count || 0), 0);
        document.getElementById('studentsCount').textContent = totalStudents;
        
        // Здесь можно добавить логику для подсчета пройденных тестов
        document.getElementById('completedTests').textContent = '0';
    }

    setupEventListeners() {
        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = '../index.html';
        });

        // Быстрые действия
        document.getElementById('createClassBtn').addEventListener('click', () => {
            this.openCreateClassModal();
        });

        document.getElementById('createTestBtn').addEventListener('click', () => {
            this.openCreateTestModal();
        });

        // Модальные окна
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Модальное окно создания класса
        const classModal = document.getElementById('createClassModal');
        const classForm = document.getElementById('createClassForm');

        document.getElementById('addClassBtn').addEventListener('click', () => {
            this.openCreateClassModal();
        });

        classForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateClass();
        });

        // Модальное окно создания теста
        const testModal = document.getElementById('createTestModal');
        const testForm = document.getElementById('createTestForm');

        document.getElementById('addTestBtn').addEventListener('click', () => {
            this.openCreateTestModal();
        });

        testForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateTest();
        });

        // Закрытие модальных окон
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
    }

    openCreateClassModal() {
        document.getElementById('createClassModal').style.display = 'flex';
        document.getElementById('className').focus();
    }

    openCreateTestModal() {
        document.getElementById('createTestModal').style.display = 'flex';
        document.getElementById('testTopic').focus();
    }

    async handleCreateClass() {
        const className = document.getElementById('className').value.trim();
        
        if (!className) {
            alert('Введите название класса');
            return;
        }

        try {
            const result = await apiService.request('/classes/create', {
                method: 'POST',
                body: JSON.stringify({ name: className })
            });

            if (result.message) {
                alert(`Класс "${className}" создан! Код доступа: ${result.access_code}`);
                document.getElementById('createClassModal').style.display = 'none';
                document.getElementById('createClassForm').reset();
                await this.loadData(); // Перезагружаем данные
            }
        } catch (error) {
            alert('Ошибка создания класса: ' + error.message);
        }
    }

    async handleCreateTest() {
        const formData = new FormData(document.getElementById('createTestForm'));
        const testData = {
            topic: formData.get('testTopic'),
            num_questions: parseInt(formData.get('testQuestions')),
            difficulty: formData.get('testDifficulty'),
            class_id: formData.get('testClass') || null
        };

        try {
            const result = await apiService.request('/tests/create', {
                method: 'POST',
                body: JSON.stringify(testData)
            });

            if (result.message) {
                alert('Тест успешно создан!');
                document.getElementById('createTestModal').style.display = 'none';
                document.getElementById('createTestForm').reset();
                await this.loadData(); // Перезагружаем данные
            }
        } catch (error) {
            alert('Ошибка создания теста: ' + error.message);
        }
    }
}

// Инициализация дашборда при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new TeacherDashboard();
});