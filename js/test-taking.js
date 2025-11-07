class TestTaking {
    constructor() {
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.timerInterval = null;
        this.timeSpent = 0;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadTest();
        this.setupEventListeners();
        this.startTimer();
        this.showQuestion(0);
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
        } catch (error) {
            localStorage.removeItem('authToken');
            window.location.href = '../index.html';
        }
    }

    async loadTest() {
        try {
            // Получаем ID теста из URL параметров
            const urlParams = new URLSearchParams(window.location.search);
            const testId = urlParams.get('testId');

            if (!testId) {
                throw new Error('Test ID not specified');
            }

            // Загружаем данные теста
            const response = await apiService.request(`/tests/${testId}`);
            this.currentTest = response;
            
            // Инициализируем массив ответов
            this.userAnswers = new Array(this.currentTest.questions.length).fill(-1);
            
            // Обновляем информацию о тесте
            this.updateTestInfo();
            
        } catch (error) {
            console.error('Error loading test:', error);
            alert('Ошибка загрузки теста: ' + error.message);
            window.location.href = 'student-dashboard.html';
        }
    }

    updateTestInfo() {
        document.getElementById('testTopic').textContent = this.currentTest.topic;
        document.getElementById('testDifficulty').textContent = `Сложность: ${this.currentTest.difficulty}`;
        document.getElementById('totalQuestions').textContent = this.currentTest.questions.length;
        this.updateProgress();
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.currentTest.questions.length) * 100;
        
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
        document.getElementById('progressFill').style.width = progress + '%';
        
        // Обновляем кнопки навигации
        document.getElementById('prevBtn').disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.currentTest.questions.length - 1) {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('finishBtn').style.display = 'block';
        } else {
            document.getElementById('nextBtn').style.display = 'block';
            document.getElementById('finishBtn').style.display = 'none';
        }
    }

    showQuestion(questionIndex) {
        this.currentQuestionIndex = questionIndex;
        const question = this.currentTest.questions[questionIndex];
        
        document.getElementById('questionText').textContent = question.question;
        
        this.renderOptions(question.options, this.userAnswers[questionIndex]);
        this.updateProgress();
    }

    renderOptions(options, selectedAnswer) {
        const optionsGrid = document.getElementById('optionsGrid');
        optionsGrid.innerHTML = '';
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option-item ${selectedAnswer === index ? 'selected' : ''}`;
            optionElement.innerHTML = `
                <div class="option-text">${index + 1}. ${option}</div>
            `;
            
            optionElement.addEventListener('click', () => {
                this.selectAnswer(index);
            });
            
            optionsGrid.appendChild(optionElement);
        });
    }

    selectAnswer(answerIndex) {
        this.userAnswers[this.currentQuestionIndex] = answerIndex;
        
        // Обновляем отображение выбранного ответа
        const options = document.querySelectorAll('.option-item');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === answerIndex);
        });
        
        // Добавляем анимацию
        const selectedOption = document.querySelector('.option-item.selected');
        if (selectedOption) {
            selectedOption.classList.add('pulse');
            setTimeout(() => {
                selectedOption.classList.remove('pulse');
            }, 500);
        }
    }

    setupEventListeners() {
        // Навигация по вопросам
        document.getElementById('prevBtn').addEventListener('click', () => {
            if (this.currentQuestionIndex > 0) {
                this.showQuestion(this.currentQuestionIndex - 1);
            }
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            if (this.currentQuestionIndex < this.currentTest.questions.length - 1) {
                this.showQuestion(this.currentQuestionIndex + 1);
            }
        });

        // Завершение теста
        document.getElementById('finishBtn').addEventListener('click', () => {
            this.showFinishConfirmation();
        });

        document.getElementById('confirmFinishBtn').addEventListener('click', () => {
            this.finishTest();
        });

        document.getElementById('cancelFinishBtn').addEventListener('click', () => {
            document.getElementById('finishModal').style.display = 'none';
        });

        // Возврат в кабинет
        document.getElementById('backToDashboardBtn').addEventListener('click', () => {
            window.location.href = 'student-dashboard.html';
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    handleKeyboardNavigation(e) {
        // Стрелки влево/вправо для навигации
        if (e.key === 'ArrowLeft' && this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        } else if (e.key === 'ArrowRight' && this.currentQuestionIndex < this.currentTest.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
        
        // Цифры 1-4 для выбора ответа
        if (e.key >= '1' && e.key <= '4') {
            const answerIndex = parseInt(e.key) - 1;
            if (answerIndex < this.currentTest.questions[this.currentQuestionIndex].options.length) {
                this.selectAnswer(answerIndex);
            }
        }
        
        // Enter для завершения теста на последнем вопросе
        if (e.key === 'Enter' && this.currentQuestionIndex === this.currentTest.questions.length - 1) {
            this.showFinishConfirmation();
        }
    }

    showFinishConfirmation() {
        const answeredCount = this.userAnswers.filter(answer => answer !== -1).length;
        const totalCount = this.currentTest.questions.length;
        
        document.getElementById('answeredCount').textContent = answeredCount;
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('finishModal').style.display = 'flex';
    }

    async finishTest() {
        try {
            // Останавливаем таймер
            this.stopTimer();
            
            // Проверяем, что все вопросы отвечены
            const unansweredQuestions = this.userAnswers.filter(answer => answer === -1).length;
            
            if (unansweredQuestions > 0 && !confirm(`Вы не ответили на ${unansweredQuestions} вопросов. Завершить тест?`)) {
                document.getElementById('finishModal').style.display = 'none';
                this.startTimer();
                return;
            }
            
            // Отправляем результаты
            const result = await apiService.request('/results/submit', {
                method: 'POST',
                body: JSON.stringify({
                    testId: this.currentTest.id,
                    answers: this.userAnswers
                })
            });
            
            if (result.message) {
                this.showResults(result.result);
            }
            
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Ошибка отправки результатов: ' + error.message);
            document.getElementById('finishModal').style.display = 'none';
            this.startTimer();
        }
    }

    showResults(result) {
        document.getElementById('finalScore').textContent = result.correct_answers;
        document.getElementById('finalTotal').textContent = result.total_questions;
        document.getElementById('resultPercentage').textContent = result.score_percentage + '%';
        
        // Показываем ошибки, если они есть
        const wrongAnswersSection = document.getElementById('wrongAnswersSection');
        const wrongAnswersList = document.getElementById('wrongAnswersList');
        
        if (result.wrong_answers && result.wrong_answers.length > 0) {
            wrongAnswersSection.style.display = 'block';
            wrongAnswersList.innerHTML = '';
            
            result.wrong_answers.forEach((error, index) => {
                const wrongAnswerItem = document.createElement('div');
                wrongAnswerItem.className = 'wrong-answer-item';
                wrongAnswerItem.innerHTML = `
                    <div class="wrong-question">${error.question}</div>
                    <div class="wrong-answer">❌ Ваш ответ: ${error.user_answer}</div>
                    <div class="correct-answer">✅ Правильный ответ: ${error.correct_answer}</div>
                    ${error.explanation ? `<div class="explanation">💡 ${error.explanation}</div>` : ''}
                `;
                wrongAnswersList.appendChild(wrongAnswerItem);
            });
        } else {
            wrongAnswersSection.style.display = 'none';
        }
        
        document.getElementById('finishModal').style.display = 'none';
        document.getElementById('resultsModal').style.display = 'flex';
    }

    startTimer() {
        this.startTime = new Date();
        this.timerInterval = setInterval(() => {
            this.timeSpent++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.timeSpent / 60);
        const seconds = this.timeSpent % 60;
        const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = timerText;
    }

    // Автосохранение прогресса
    enableAutoSave() {
        setInterval(() => {
            this.saveProgress();
        }, 30000); // Сохраняем каждые 30 секунд
    }

    saveProgress() {
        const progress = {
            testId: this.currentTest.id,
            currentQuestion: this.currentQuestionIndex,
            answers: this.userAnswers,
            timeSpent: this.timeSpent
        };
        
        localStorage.setItem(`testProgress_${this.currentTest.id}`, JSON.stringify(progress));
    }

    loadProgress() {
        const savedProgress = localStorage.getItem(`testProgress_${this.currentTest.id}`);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            
            if (confirm('Обнаружен незавершенный тест. Продолжить?')) {
                this.currentQuestionIndex = progress.currentQuestion;
                this.userAnswers = progress.answers;
                this.timeSpent = progress.timeSpent;
                this.updateTimer();
                return true;
            } else {
                localStorage.removeItem(`testProgress_${this.currentTest.id}`);
            }
        }
        return false;
    }

    // Валидация перед уходом со страницы
    setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.timerInterval) {
                e.preventDefault();
                e.returnValue = 'Тест еще не завершен. Вы уверены, что хотите уйти?';
                return e.returnValue;
            }
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new TestTaking();
});