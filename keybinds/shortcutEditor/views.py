from django.http import HttpResponse, HttpResponseNotFound, Http404
from django.shortcuts import render
from .models import *

keyboard_keys_front = {
    'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Esc', 'PSc', 'SLk', 'Pause'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp'],
    'rowQW': ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\\|', 'Del', 'End', 'PD'],
    'rowAS': ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '„ “', 'None1', 'Enter', 'None2', 'Up', 'None3'],
    'rowZX': ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', 'mouse_left', 'mouse_middle', 'mouse_right', 'Left', 'Down', 'Right']
}

keyboard_keys_backend = {
    'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'escape', 'print screen', 'scroll lock', 'pause'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equals', 'backspace', 'Ins', 'home', 'page up'],
    'rowQW': ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'left square bracket', 'left square bracket', 'reverse solidus', 'delete', 'end', 'page down'],
    'rowAS': ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'apostrophe', '', 'enter', '', 'up', ''],
    'rowZX': ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'period', 'solidus', 'button1', 'button2', 'button3', 'Left', 'down', 'right']
}
modifiers = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift']

menu = [{'title': 'О сайте', 'url_name': 'about'},
        {'title': 'Добавить программу', 'url_name': 'add_program'},
        {'title': 'Обратная связь', 'url_name': 'contact'},
        {'title': 'Войти', 'url_name': 'login'}
        ]


def to_list(dictionary):
    value_list = []
    for row in dictionary.values():
        for key in row:
            value_list.append(key)
    return value_list

keyboard_keys_dict = dict(zip(to_list(keyboard_keys_front), to_list(keyboard_keys_backend)))





def index(request):
    programs = Program.objects.all()
    program_commands = ProgramCommand.objects.all()
    context = {
        'menu': menu,
        'title': 'Редактор комбинаций',
        'programs': programs,
        # 'program_commands': program_commands,
        'prog_selected':0,
        'keyboard_keys_dict':keyboard_keys_dict
    }
    res = render(request, 'shortcutEditor/index.html', context=context)
    return res

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
    programs = Program.objects.all()
    program_commands = ProgramCommand.objects.filter(program_id=program_id)
    if len(program_commands) == 0:
        raise Http404()
    context = {
        'menu': menu,
        'title': 'Редактор комбинаций',
        'programs': programs,
        'program_commands': program_commands,
        'prog_selected':program_id,
        'keyboard_keys_dict': keyboard_keys_dict
    }
    return render(request, 'shortcutEditor/index.html', context=context)

def show_command(request, command_id):
    return HttpResponse('Команда какая-то')