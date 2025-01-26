import re
import os
import random
import logging
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)

def get_daily_reset_key():
    """Ключ для хранения времени последнего сброса"""
    return "last_reset_timestamp_v3"

def check_daily_reset():
    """Проверяет, нужно ли выполнить сброс"""
    last_reset = cache.get(get_daily_reset_key())
    if not last_reset:
        return True
    return (timezone.now() - last_reset).total_seconds() >= 86400  # 24 часа


def perform_daily_reset():
    """Фиксирует время сброса с таймаутом 36 часов"""
    cache.set(get_daily_reset_key(), timezone.now(), 60*60*36)
    logger.info("Daily reset performed at %s", timezone.now())

def home(request):
    return render(request, 'index.html')


def extract_image_number(filename):
    """Извлекает номер из имени файла в формате 'Cat (number)'"""
    match = re.search(r'Cat\s*\((\d+)\)', filename, re.IGNORECASE)
    return int(match.group(1)) if match else None


def get_random_cat_image():
    """Возвращает путь к случайному изображению котика и его номер"""
    cats_dir = os.path.join(settings.MEDIA_ROOT, 'cats')

    if not os.path.isdir(cats_dir):
        logger.error(f"Directory not found: {cats_dir}")
        return {'error': 'Cats directory not found'}

    try:
        with os.scandir(cats_dir) as entries:
            cat_images = [
                entry.name for entry in entries
                if entry.is_file() and entry.name.lower().endswith(('.jpg', '.jpeg', '.png'))
            ]
    except OSError as e:
        logger.error(f"Error reading directory: {str(e)}")
        return {'error': 'Error reading images directory'}

    if not cat_images:
        logger.error("No images found in directory")
        return {'error': 'No cat images available'}

    random_image = random.choice(cat_images)
    image_number = extract_image_number(random_image)

    return {
        'image_url': f"{settings.MEDIA_URL}cats/{random_image}",
        'image_number': image_number  # Добавляем номер в результат
    }


def get_random_phrase(line_number=None):
    """Возвращает фразу по номеру строки или случайную, если номер не указан"""
    try:
        # Поиск файла phrases.txt в статических директориях
        phrases_path = None
        for static_dir in settings.STATICFILES_DIRS:
            check_path = os.path.join(static_dir, 'phrases.txt')
            if os.path.isfile(check_path):
                phrases_path = check_path
                break

        if not phrases_path:
            logger.error("Phrases file not found in STATICFILES_DIRS")
            return {'error': 'Phrases file missing'}

        with open(phrases_path, 'r', encoding='utf-8-sig') as f:
            phrases = [line.strip() for line in f if line.strip()]

        if not phrases:
            logger.error("Empty phrases file")
            return {'error': 'No phrases available'}

        # Если передан номер строки
        if line_number is not None:
            # Обработка случаев, когда номер больше количества фраз
            if line_number < 1 or line_number > len(phrases):
                logger.warning(f"Requested line {line_number} is out of range (1-{len(phrases)})")
                line_number = (line_number % len(phrases)) or len(phrases)

            return {'phrase': phrases[line_number - 1]}

        # Иначе возвращаем случайную (для обратной совместимости)
        return {'phrase': random.choice(phrases)}

    except IOError as e:
        logger.error(f"Error reading phrases file: {str(e)}")
        return {'error': 'Error reading phrases'}


@require_GET
def get_random_cat(request):
    """Возвращает случайное изображение котика и соответствующую фразу"""
    try:
        # Проверка необходимости ежедневного сброса
        if check_daily_reset():
            perform_daily_reset()
            reset_flag = True
        else:
            reset_flag = False

        # Получение случайного изображения и его номера
        image_data = get_random_cat_image()
        if 'error' in image_data:
            return JsonResponse(image_data, status=404)

        # Получение фразы по номеру изображения
        phrase_data = get_random_phrase(line_number=image_data.get('image_number'))
        if 'error' in phrase_data:
            return JsonResponse(phrase_data, status=404)

        return JsonResponse({
            'image_url': image_data['image_url'],
            'phrase': phrase_data['phrase'],
            'is_daily_reset': reset_flag
        })

    except Exception as e:
        logger.error(f"API Error: {str(e)}", exc_info=True)
        return JsonResponse({'error': 'Internal server error'}, status=500)