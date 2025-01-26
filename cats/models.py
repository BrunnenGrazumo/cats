from django.db import models
from django.utils import timezone

class CatState(models.Model):
    user_id = models.CharField(max_length=40, unique=True)  # Идентификатор пользователя
    current_image = models.CharField(max_length=255)        # Текущая картинка
    timestamp = models.DateTimeField(default=timezone.now)  # Время загрузки картинки

    def __str__(self):
        return f"{self.user_id}: {self.current_image}"