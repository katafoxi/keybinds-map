from io import BytesIO

from PIL import Image
from django.core.files import File

from .models import *

menu = [
    {'title': 'Главная', 'url_name': 'main'},
    {'title': 'Обратная связь', 'url_name': 'contact'},
]


class DataMixin:

    def get_user_context(self, **kwargs):
        context = kwargs
        context['menu'] = menu
        context['programs'] = Program.objects.all()
        if 'prog_selected' not in context:
            context['prog_selected'] = 0
        return context


def get_image_file(name='test.png', ext='png', size=(50, 50), color=(256, 0, 0)):
    file_obj = BytesIO()
    image = Image.new("RGB", size=size, color=color)
    image.save(file_obj, ext)
    file_obj.seek(0)
    return File(file_obj, name=name)
