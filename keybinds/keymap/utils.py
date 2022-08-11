from .models import *

menu = [{'title': 'Главная', 'url_name': 'main'},
        {'title': 'Обратная связь', 'url_name': 'contact'},
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
