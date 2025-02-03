# middleware.py
from django.utils import timezone
from django.http import HttpResponseRedirect
import hashlib
from django.utils.deprecation import MiddlewareMixin
from .visitor_counter import update_counter



class UserDailyResetMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.session.session_key:
            request.session.create()

        reset_performed = False
        now = timezone.now()

        # Получаем время последнего сброса из сессии
        last_reset = request.session.get('user_last_reset')

        if last_reset:
            last_reset = timezone.datetime.fromisoformat(last_reset)
            if (now - last_reset).total_seconds() >= 86400:
                # Сбрасываем только пользовательские данные
                request.session.flush()
                request.session['user_last_reset'] = now.isoformat()
                reset_performed = True
        else:
            request.session['user_last_reset'] = now.isoformat()

        response = self.get_response(request)

        if reset_performed:
            return HttpResponseRedirect(request.path)

        return response

class VisitorMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Генерация уникального идентификатора
        ip = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        visitor_hash = hashlib.sha256(f"{ip}-{user_agent}".encode()).hexdigest()

        # Проверка уникальности через сессию
        if not request.session.get('is_visited'):
            request.session['is_visited'] = visitor_hash
            update_counter()