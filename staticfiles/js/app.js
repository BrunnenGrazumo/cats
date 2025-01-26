document.addEventListener('DOMContentLoaded', () => {
    const catContainer = document.getElementById('catContainer');
    const loadButton = document.getElementById('loadCats');
    const preloader = document.querySelector('.preloader');
    let isFirstClick = true;
    let isExtendedLoading = false;
    let resetTimeout = null;

    async function fetchCats() {
    if (isFirstClick) {
        // Первоначальная загрузка
        try {
            preloader.style.display = 'flex';
            const response = await fetch('/api/cats/');

            if (!response.ok) throw new Error('Ошибка загрузки');

            const data = await response.json();
            updateCat(data);

            loadButton.textContent = 'Хочу другого котика';
            loadButton.classList.add('clicked');
            isFirstClick = false;

        } catch (error) {
            handleError();
        } finally {
            preloader.style.display = 'none';
        }
    } else {
        showModal();
    }
}

    function updateCat(data) {
        const catImage = document.querySelector('.cat-image');
        const catPhrase = document.querySelector('.cat-phrase');

        catImage.src = data.image_url;
        catImage.alt = data.phrase;
        catPhrase.textContent = data.phrase;
    }

    loadButton.addEventListener('click', fetchCats);
});
function showModal() {
    document.getElementById('confirmationModal').style.display = 'block';
}

function hideModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

document.getElementById('confirmButton').addEventListener('click', () => {
    hideModal();
    startExtendedLoading();
});

function startExtendedLoading() {
     if (window.loadingInterval) {
        clearInterval(window.loadingInterval);
    }

    // Очищаем предыдущий прогресс-бар
    const loader = document.getElementById('extendedLoader');
    loader.querySelectorAll('.progress-bar').forEach(el => el.remove());
    isExtendedLoading = true;
    const loader = document.getElementById('extendedLoader');
    const countdownElement = document.getElementById('countdown');

    // Удаляем старый прогресс-бар
    const existingProgress = loader.querySelector('.progress-bar');
    if (existingProgress) existingProgress.remove();

    // Создаем новый прогресс-бар
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.innerHTML = '<div class="progress"></div>';
    loader.querySelector('.loader').appendChild(progressBar);

    loader.style.display = 'flex';
    let seconds = 20;

    const interval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        progressBar.querySelector('.progress').style.width =
            `${100 - (seconds * 5)}%`;

        if (seconds <= 0) {
            clearInterval(interval);
            loader.style.display = 'none';
            isExtendedLoading = false;

            // Добавляем обработку ошибок
            fetch('/api/cats/')
                .then(response => {
                    if (!response.ok) throw new Error('Ошибка сервера');
                    return response.json();
                })
                .then(data => {
                    console.log('Новые данные:', data); // Логируем ответ
                    updateCat(data);
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    document.querySelector('.cat-phrase').textContent =
                        'Не удалось загрузить нового котика :(';
                });
        }
    }, 1000);
}

// Сброс в полночь
function scheduleDailyReset() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const msToMidnight = nextMidnight - now;

    resetTimeout = setTimeout(() => {
        localStorage.clear();
        window.location.reload();
        scheduleDailyReset();
    }, msToMidnight);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Инициализация
        const loadButton = document.getElementById('loadCats');
        const preloader = document.querySelector('.preloader');
        let isFirstClick = true;

        // Проверка элементов
        if (!loadButton || !preloader) {
            throw new Error('Критические элементы DOM не найдены');
        }

        // Функции
        async function fetchCats() {
            try {
                preloader.style.display = 'flex';
                const response = await fetch('/api/cats/');

                if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);

                const data = await response.json();
                updateCat(data);

                loadButton.textContent = 'Хочу другого котика';
                loadButton.classList.add('clicked');
                isFirstClick = false;

            } catch (error) {
                console.error('Ошибка загрузки:', error);
                alert('Ошибка загрузки: ' + error.message);
            } finally {
                preloader.style.display = 'none';
            }
        }

        // Назначение обработчика
        loadButton.addEventListener('click', fetchCats);

    } catch (error) {
        console.error('Фатальная ошибка:', error);
        document.body.innerHTML = `<h1 style="color:red">Ошибка: ${error.message}</h1>`;
    }
});