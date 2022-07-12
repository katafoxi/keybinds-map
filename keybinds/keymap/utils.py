from .models import *

menu = [{'title': 'О сайте', 'url_name': 'about'},
        {'title': 'Добавить программу', 'url_name': 'add_program'},
        {'title': 'Обратная связь', 'url_name': 'contact'},
        {'title': 'Войти', 'url_name': 'login'}
        ]


class DataMixin:
    def get_user_context(self, **kwargs):
        context = kwargs
        programs = Program.objects.all()
        context['menu'] = menu
        context['programs'] = programs
        if 'prog_selected' not in context:
            context['prog_selected'] = 0
        return context
