import os
import json
from datetime import datetime
from django.conf import settings


def get_counter_data():
    """Чтение данных из файла с проверкой структуры"""
    file_path = os.path.join(settings.BASE_DIR, 'visitors.txt')
    default_data = {
        "daily": {"current": None, "history": []},
        "monthly": {"current": None, "history": []},
        "yearly": {"current": None, "history": []}
    }

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            # Проверка и восстановление структуры данных
            for key in ['daily', 'monthly', 'yearly']:
                if key not in data:
                    data[key] = default_data[key]
                else:
                    if 'current' not in data[key]:
                        data[key]['current'] = None
                    if 'history' not in data[key]:
                        data[key]['history'] = []
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return default_data


def update_counter():
    now = datetime.now()
    data = get_counter_data()
    file_path = os.path.join(settings.BASE_DIR, 'visitors.txt')  # Исправлено: добавлено определение file_path

    # Обработка daily
    current_date = now.strftime("%Y-%m-%d")
    if not data['daily']['current'] or data['daily']['current'].get('date') != current_date:
        if data['daily']['current']:
            data['daily']['history'].insert(0, data['daily']['current'])
        data['daily']['current'] = {"date": current_date, "count": 1}
    else:
        data['daily']['current']['count'] += 1

    # Обработка monthly
    current_month = now.strftime("%Y-%m")
    if not data['monthly']['current'] or data['monthly']['current'].get('month') != current_month:
        if data['monthly']['current']:
            data['monthly']['history'].insert(0, data['monthly']['current'])
        data['monthly']['current'] = {"month": current_month, "count": 1}
    else:
        data['monthly']['current']['count'] += 1

    # Обработка yearly
    current_year = now.strftime("%Y")
    if not data['yearly']['current'] or data['yearly']['current'].get('year') != current_year:
        if data['yearly']['current']:
            data['yearly']['history'].insert(0, data['yearly']['current'])
        data['yearly']['current'] = {"year": current_year, "count": 1}
    else:
        data['yearly']['current']['count'] += 1

    # Сохранение данных
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

    return data