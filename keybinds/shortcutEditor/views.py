from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render

menu = [{'title': 'О сайте', 'url_name': 'about'},
        {'title': 'Добавить программу', 'url_name': 'add_program'},
        {'title': 'Обратная связь', 'url_name': 'contact'},
        {'title': 'Войти', 'url_name': 'login'}
        ]

from .models import *


def index(request):
    programs = Program.objects.all()
    context = {
        'menu': menu,
        'title': 'Редактор комбинаций',
        'program': programs
    }
    return render(request, 'shortcutEditor/index.html', context=context)


def about(request):
    return HttpResponse('Немного о сайте')


def add_program(request):
    return HttpResponse('Добавление программы')


def contact(request):
    return HttpResponse('Обратная связь')


def login(request):
    return HttpResponse('Авторизация')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')

def show_program_commands(request, program_id):
    return HttpResponse(f'Стандартные комбинации {Program.objects.get(pk = 1)} ')
