# cats/urls.py
from django.conf import settings  # Импортируем settings
from django.conf.urls.static import static
from . import views
from django.urls import path, include
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', views.home, name='home'),  # Главная страница
    path('api/cats/', views.get_random_cat, name='get_cats'),  # API для котиков
]
# Добавьте маршрут для медиафайлов
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)