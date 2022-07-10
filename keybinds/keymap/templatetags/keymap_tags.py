from django import template
from keymap.models import *

register = template.Library()

@register.simple_tag()
def get_program_list():
    return  Program.objects.all()


@register.simple_tag()
def get_menu():
    menu = [{'title': 'О сайте', 'url_name': 'about'},
            {'title': 'Добавить программу', 'url_name': 'add_program'},
            {'title': 'Обратная связь', 'url_name': 'contact'},
            {'title': 'Войти', 'url_name': 'login'}
            ]
    return menu