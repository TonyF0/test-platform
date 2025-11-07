class StudentDashboard {
    constructor() {
        this.currentUser = null;
        this.availableTests = [];
        this.myResults = [];
        this.myClass = null;
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
            if (this.currentUser.role !== 'student') {
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
            // Загрузка доступных тестов
            const testsResponse = await apiService.request('/tests');
            this.availableTests = testsResponse.tests || [];
            this.renderAvailableTests();

            // Загрузка результатов
            const resultsResponse = await apiService.request('/results');
            this.myResults = resultsResponse.results || [];
            this.renderResults();

            // Загрузка информации о классе
            const classesResponse = await apiService.request('/classes');
            this.myClass = classesResponse.classes && classesResponse.classes.length > 0 
                ? classesResponse.classes[0] 
                : null;

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Ошибка загрузки данных');
        }
    }

    renderAvailableTests() {
        const grid = document.getElementById('availableTestsGrid');
        grid.innerHTML = '';

        if (this.availableTests.length === 0) {
            grid.innerHTML = '<p class="no-data">Нет доступных тестов</p>';
            return;
        }

        this.availableTests.forEach(test => {
            const testCard = this.createTestCard(test);
            grid.appendChild(testCard);
        });
    }

    createTestCard(test) {
        const card = document.createElement('div');
        card.className = 'test-card';
        
        // Проверяем, пройден ли уже тест
        const existingResult = this.myResults.find(result => result.test_id === test.id);
        const isCompleted = !!existingResult;
        const score = isCompleted ? existingResult.score_percentage : null;
        
        card.innerHTML = `
            <div class="test-header">
                <h3 class="test-topic">${test.topic}</h3>
                <span class="test-status ${isCompleted ? 'completed' : 'available'}">
                    ${isCompleted ? '✅ Пройден' : '🟢 Доступен'}
                </span>
            </div>
            <div class="test-meta">
                <span>Вопросов: ${test.questions_count}</span>
                <span>Сложность: ${this.getDifficultyIcon(test.difficulty)} ${test.difficulty}</span>
                ${isCompleted ? `<span>Результат: ${score}%</span>` : ''}
            </div>
            <div class="test-actions">
                ${!isCompleted ? 
                    `<button class="btn btn-primary start-test" data-id="${test.id}">Начать тест</button>` :
                    `<button class="btn btn-outline view-result" data-id="${test.id}">Посмотреть результат</button>`
                }
            </div>
        `;

        return card;
    }

    renderResults() {
        const list = document.getElementById('resultsList');
        list.innerHTML = '';

        if (this.myResults.length === 0) {
            list.innerHTML = '<p class="no-data">У вас пока нет результатов тестов</p>';
            return;
        }

        this.myResults.forEach(result => {
            const resultCard = this.createResultCard(result);
            list.appendChild(resultCard);
        });
    }

    createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        const scoreClass = result.score_percentage >= 80 ? 'excellent' : 
                          result.score_percentage >= 60 ? 'good' : 'poor';
        
        card.innerHTML = `
            <div class="result-header">
                <h3 class="result-topic">${result.test_topic}</h3>
                <div class="result-score ${scoreClass}">
                    ${result.correct_answers}/${result.total_questions} (${result.score_percentage}%)
                </div>
            </div>
            <div class="result-details">
                <span>Сложность: ${result.test_difficulty}</span>
                <span>Завершен: ${new Date(result.completed_at).toLocaleDateString()}</span>
            </div>
            ${result.wrong_answers && result.wrong_answers.length > 0 ? `
                <div class="wrong-answers">
                    <strong>Ошибки: ${result.wrong_answers.length}</strong>
                    ${result.wrong_answers.slice(0, 2).map(error => `
                        <div class="wrong-answer-item">
                            <div class="wrong-question">${error.question}</div>
                            <div class="wrong-answer">Ваш ответ: ${error.user_answer}</div>
                            <div class="correct-answer">Правильный: ${error.correct_answer}</div>
                        </div>
                    `).join('')}
                    ${result.wrong_answers.length > 2 ? 
                        `<p>... и еще ${result.wrong_answers.length - 2} ошибок</p>` : ''
                    }
                </div>
            ` : ''}
            <div class="result-actions">
                <button class="btn btn-outline view-details" data-id="${result.id}">Подробнее</button>
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

    updateStats() {
        document.getElementById('availableTestsCount').textContent = this.availableTests.length;
        document.getElementById('completedTestsCount').textContent = this.myResults.length;
        
        // Расчет среднего балла
        const averageScore = this.myResults.length > 0 
            ? Math.round(this.myResults.reduce((sum, result) => sum + result.score_percentage, 0) / this.myResults.length)
            : 0;
        document.getElementById('averageScore').textContent = averageScore + '%';
        
        // Информация о классе
        document.getElementById('className').textContent = this.myClass ? this.myClass.name : 'Не в классе';
    }

    setupEventListeners() {
        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = '../index.html';
        });

        // Обработчики для карточек тестов
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-test')) {
                const testId = e.target.dataset.id;
                this.startTest(testId);
            }
            
            if (e.target.classList.contains('view-result')) {
                const testId = e.target.dataset.id;
                this.viewTestResult(testId);
            }
            
            if (e.target.classList.contains('view-details')) {
                const resultId = e.target.dataset.id;
                this.viewResultDetails(resultId);
            }
        });
    }

    startTest(testId) {
        // Переход на страницу прохождения теста
        window.location.href = `test-taking.html?testId=${testId}`;
    }

    async viewTestResult(testId) {
        try {
            // Находим результат для этого теста
            const result = this.myResults.find(r => r.test_id === testId);
            if (result) {
                this.showResultModal(result);
            }
        } catch (error) {
            console.error('Error viewing test result:', error);
            alert('Ошибка загрузки результата');
        }
    }

    async viewResultDetails(resultId) {
        try {
            const response = await apiService.request(`/results/${resultId}`);
            if (response.result) {
                this.showDetailedResultModal(response.result);
            }
        } catch (error) {
            console.error('Error loading result details:', error);
            alert('Ошибка загрузки деталей результата');
        }
    }

    showResultModal(result) {
        // Создаем модальное окно для показа результата
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Результат теста</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="result-summary">
                        <h3>${result.test_topic}</h3>
                        <div class="score-display">
                            <span class="score">${result.correct_answers}</span>
                            <span class="score-separator">/</span>
                            <span class="total">${result.total_questions}</span>
                        </div>
                        <div class="percentage">${result.score_percentage}%</div>
                    </div>
                    
                    ${result.wrong_answers && result.wrong_answers.length > 0 ? `
                        <div class="wrong-answers-section">
                            <h4>Допущенные ошибки:</h4>
                            <div class="wrong-answers-list">
                                ${result.wrong_answers.map((error, index) => `
                                    <div class="wrong-answer-item">
                                        <div class="question-number">Вопрос ${index + 1}:</div>
                                        <div class="question-text">${error.question}</div>
                                        <div class="answer wrong">❌ Ваш ответ: ${error.user_answer}</div>
                                        <div class="answer correct">✅ Правильный: ${error.correct_answer}</div>
                                        ${error.explanation ? `<div class="explanation">💡 ${error.explanation}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="perfect-score">
                            🎉 Поздравляем! Вы ответили правильно на все вопросы!
                        </div>
                    `}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary close-modal-btn">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики для модального окна
        modal.querySelector('.close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Закрытие при клике вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showDetailedResultModal(result) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Детальный результат</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="test-info">
                        <h3>${result.test_topic}</h3>
                        <div class="test-stats">
                            <div class="stat">
                                <span class="label">Правильных ответов:</span>
                                <span class="value">${result.correct_answers}/${result.total_questions}</span>
                            </div>
                            <div class="stat">
                                <span class="label">Результат:</span>
                                <span class="value">${result.score_percentage}%</span>
                            </div>
                            <div class="stat">
                                <span class="label">Дата прохождения:</span>
                                <span class="value">${new Date(result.completed_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="questions-review">
                        <h4>Разбор вопросов:</h4>
                        <div class="questions-list">
                            ${result.question_details.map((question, index) => `
                                <div class="question-review-item ${question.is_correct ? 'correct' : 'wrong'}">
                                    <div class="question-header">
                                        <span class="question-number">Вопрос ${index + 1}</span>
                                        <span class="question-status">
                                            ${question.is_correct ? '✅ Правильно' : '❌ Неправильно'}
                                        </span>
                                    </div>
                                    <div class="question-text">${question.question}</div>
                                    <div class="options-list">
                                        ${question.options.map((option, optIndex) => {
                                            let optionClass = 'option';
                                            if (optIndex === question.correct_answer) {
                                                optionClass += ' correct-option';
                                            }
                                            if (optIndex === question.user_answer && !question.is_correct) {
                                                optionClass += ' wrong-option';
                                            }
                                            return `
                                                <div class="${optionClass}">
                                                    ${optIndex + 1}. ${option}
                                                    ${optIndex === question.correct_answer ? ' ✅' : ''}
                                                    ${optIndex === question.user_answer && !question.is_correct ? ' ❌' : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                    ${question.explanation ? `
                                        <div class="explanation">
                                            <strong>Объяснение:</strong> ${question.explanation}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary close-modal-btn">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Обработчики для модального окна
        const closeModal = () => document.body.removeChild(modal);
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
}

// Инициализация дашборда при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new StudentDashboard();
});