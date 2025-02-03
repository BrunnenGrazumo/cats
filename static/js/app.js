document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const loadButton = document.getElementById('loadCats');
    const preloader = document.querySelector('.preloader');
    const extendedLoader = document.getElementById('extendedLoader');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmButton = document.getElementById('confirmButton');
    const header = document.querySelector('.header-bar');
    const mainContent = document.querySelector('.main-content');
    let ticking = false;
    let lastScroll = 0;

    // Состояние приложения
    let state = {
        isFirstClick: true,
        currentImage: null,
        currentPhrase: null,
        buttonText: 'Получить предсказание от котика'
    };
        window.scrollTo(0, 1);

    // Дополнительный фикс для Safari
    setTimeout(() => {
        window.scrollTo(0, 1);
        window.scrollTo(0, 0);
    }, 100);

    // Инициализация
    try {
        // Восстановление состояния
        const savedState = JSON.parse(localStorage.getItem('catAppState'));
        if (savedState) {
            state = savedState;
            updateUI();
        }

        // Проверка элементов
        if (!loadButton || !preloader || !extendedLoader) {
            throw new Error('Критические элементы DOM не найдены');
        }

        // Обработчики событий
        loadButton.addEventListener('click', handleMainButtonClick);
        confirmButton.addEventListener('click', handleConfirmation);

    } catch (error) {
        console.error('Фатальная ошибка:', error);
        showFatalError(error.message);
    }

    function updateUI() {
        // Восстановление данных
        const catImage = document.querySelector('.cat-image');
        const catPhrase = document.querySelector('.cat-phrase');

        if (state.currentImage) {
            catImage.onload = () => catImage.style.display = 'block';
            catImage.src = state.currentImage;
        }

        if (state.currentPhrase) {
            catPhrase.textContent = state.currentPhrase;
        }

        // Обновление кнопки
        loadButton.textContent = state.buttonText;
        loadButton.classList.toggle('clicked', !state.isFirstClick);
    }

    async function handleMainButtonClick() {
        try {
            if (state.isFirstClick) {
                await fetchCat();
                state.isFirstClick = false;
                state.buttonText = 'Получить другое предсказание';
                saveState();
                updateUI();
            } else {
                showModal();
            }
        } catch (error) {
            handleError(error);
        }
    }

    async function fetchCat() {
        togglePreloader(true);
        try {
            const response = await fetch('/api/cats/?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);

            const data = await response.json();

            // Обработка серверного сброса
            if (data.is_daily_reset) {
                localStorage.removeItem('catAppState');
                window.location.reload();
                return;
            }

            state.currentImage = data.image_url;
            state.currentPhrase = data.phrase;

            saveState();
            updateCat(data);

        } finally {
            togglePreloader(false);
        }
    }

    function updateCat(data) {
        const catImage = document.querySelector('.cat-image');
        const catPhrase = document.querySelector('.cat-phrase');

        catImage.src = data.image_url;
        catImage.alt = data.phrase || 'Изображение котика';
        catPhrase.textContent = data.phrase;
    }

    // Работа с состоянием
    function saveState() {
        localStorage.setItem('catAppState', JSON.stringify({
            isFirstClick: state.isFirstClick,
            currentImage: state.currentImage,
            currentPhrase: state.currentPhrase,
            buttonText: state.buttonText,
            timestamp: Date.now()
        }));
    }

    // Модальное окно
    function showModal() {
        confirmationModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        confirmationModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async function handleConfirmation() {
        hideModal();
        await startExtendedLoading();
    }

    // Расширенная загрузка
    async function startExtendedLoading() {
        toggleExtendedLoader(true);

        try {
            const data = await loadWithProgress();
            state.currentImage = data.image_url;
            state.currentPhrase = data.phrase;
            saveState();
            updateCat(data);
        } catch (error) {
            handleError(error);
        } finally {
            toggleExtendedLoader(false);
        }
    }

    function loadWithProgress() {
        return new Promise((resolve, reject) => {
            const countdownElement = document.getElementById('countdown');
            let seconds = 30;

            const interval = setInterval(async () => {
                seconds--;
                countdownElement.textContent = seconds;

                if (seconds <= 0) {
                    clearInterval(interval);
                    try {
                        const response = await fetch('/api/cats/');
                        if (!response.ok) throw new Error('Ошибка сервера');
                        resolve(await response.json());
                    } catch (error) {
                        reject(error);
                    }
                }
            }, 1000);
        });
    }

    // Утилиты
    function togglePreloader(show) {
        preloader.style.display = show ? 'flex' : 'none';
    }

    function toggleExtendedLoader(show) {
        extendedLoader.style.display = show ? 'flex' : 'none';
    }

    function handleError(error) {
        console.error('Ошибка:', error);
        document.querySelector('.cat-phrase').textContent =
            'Не удалось загрузить котика. Попробуйте позже!';
        saveState();
    }

    function showFatalError(message) {
        document.body.innerHTML = `
            <div class="container">
                <h1 style="color: #dc3545; margin-top: 50px;">Ошибка: ${message}</h1>
                <p>Пожалуйста, перезагрузите страницу</p>
            </div>
        `;
    }
        window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const currentScroll = window.scrollY;

                if (currentScroll > 1) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }

                ticking = false;
            });
            ticking = true;
        }
    });


    // Обновляем при изменении размера окна
    window.addEventListener('resize', () => {
        mainContent.style.paddingTop = header.offsetHeight + 'px';
    });

    // Логика для тени при скролле
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Обновляем при изменении размера



    // Логика скрытия/показа шапки
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > lastScroll && currentScroll > 100) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }

        lastScroll = currentScroll;
    });
    // Функция для обновления отступов
async function checkDailyReset() {
    const now = new Date();
    console.log('Клиентское время:', now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
        try {
            const response = await fetch('/api/cats/?t=' + Date.now());
            if (!response.ok) return;

            const data = await response.json();
            if (data.is_daily_reset) {
                localStorage.removeItem('catAppState');
                window.location.reload();
            }
        } catch (error) {
            console.error('Ошибка проверки сброса:', error);
        }
    }
 async function initializeApp() {
    try {
        // 1. Проверка серверного сброса
        await checkDailyReset();

        // 2. Работа с localStorage
        const savedState = JSON.parse(localStorage.getItem('catAppState'));

        if (savedState) {
            // 3. Проверка времени по Москве
            const savedDate = new Date(savedState.timestamp);
            const now = new Date();

            // Приведение к московскому времени (UTC+3)
            const savedMoscowTime = new Date(savedDate.getTime() + (3 * 60 * 60 * 1000));
            const currentMoscowTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

            // Проверка смены даты
            if (
                savedMoscowTime.getDate() !== currentMoscowTime.getDate() ||
                savedMoscowTime.getMonth() !== currentMoscowTime.getMonth() ||
                savedMoscowTime.getFullYear() !== currentMoscowTime.getFullYear()
            ) {
                localStorage.removeItem('catAppState');
                window.location.reload();
                return;
            }

            // 4. Восстановление состояния
            state = savedState;
            updateUI();
        }

        // 5. Инициализация остальных компонентов
        if (!loadButton || !preloader || !extendedLoader) {
            throw new Error('Критические элементы DOM не найдены');
        }

        loadButton.addEventListener('click', handleMainButtonClick);
        confirmButton.addEventListener('click', handleConfirmation);

    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showFatalError(error.message);
    }
}

    // Запускаем инициализацию
    initializeApp();


    // Обновляем при изменении размеров
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);

    // Дополнительный вызов после полной загрузки
    window.addEventListener('load', () => {
        setTimeout(updateLayout, 300);
    });
});