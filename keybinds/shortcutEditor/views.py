from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render
from .models import *
from confKeybinds.settings import BASE_DIR

menu = [{'title': 'О сайте', 'url_name': 'about'},
        {'title': 'Добавить программу', 'url_name': 'add_program'},
        {'title': 'Обратная связь', 'url_name': 'contact'},
        {'title': 'Войти', 'url_name': 'login'}
        ]

def index(request):
    programs = Program.objects.all()
    program_commands = ProgramCommand.objects.all()
    context = {
        'menu': menu,
        'title': 'Редактор комбинаций',
        'programs': programs,
        'program_commands': program_commands,
        'cat_selected':0
    }
    return render(request, 'shortcutEditor/index.html', context=context)


def about(request):
    return render(request, 'shortcutEditor/about.html', {'title':'О сайте'})


def add_program(request):
    return HttpResponse('Добавление программы')


def contact(request):
    return HttpResponse('Обратная связь')


def login(request):
    return HttpResponse('Авторизация')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')

def show_program_commands(request, program_id):
    program = Program.objects.get(pk = program_id)
    result = f'<a href="{program.program_site}">{program}</a>'
    return HttpResponse(f'Стандартные комбинации программы {result} ')

def show_command(request, command_id):
    return HttpResponse('Команда какая-то')