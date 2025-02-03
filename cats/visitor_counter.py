import os
import json
from datetime import datetime
from django.conf import settings


def get_counter_data():
    """Чтение данных из файла"""
    file_path = os.path.join(settings.BASE_DIR, 'visitors.txt')

    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            'daily': {'date': None, 'count': 0},
            'monthly': {'month': None, 'count': 0},
            'yearly': {'year': None, 'count': 0}
        }


def update_counter():
    """Обновление счетчиков"""
    now = datetime.now()
    data = get_counter_data()

    # Ежедневный счетчик
    if data['daily']['date'] != now.strftime("%Y-%m-%d"):
        data['daily'] = {'date': now.strftime("%Y-%m-%d"), 'count': 1}
    else:
        data['daily']['count'] += 1

    # Месячный счетчик
    if data['monthly']['month'] != now.strftime("%Y-%m"):
        data['monthly'] = {'month': now.strftime("%Y-%m"), 'count': 1}
    else:
        data['monthly']['count'] += 1

    # Годовой счетчик
    if data['yearly']['year'] != now.strftime("%Y"):
        data['yearly'] = {'year': now.strftime("%Y"), 'count': 1}
    else:
        data['yearly']['count'] += 1

    # Сохранение
    file_path = os.path.join(settings.BASE_DIR, 'visitors.txt')
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

    return data