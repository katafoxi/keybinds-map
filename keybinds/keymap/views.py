from django.http import HttpResponse, HttpResponseNotFound, Http404
from django.shortcuts import render, get_object_or_404
from django.template import loader
from django.views.generic import ListView

from .models import *
from .parser_pycharm import parse_settings_file

keyboard_keys_front = {
    'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '␛', '⎙', 'SLk', '⏸', 'N÷'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-_', '+=', '⌫', 'Ins', '🏠', 'P▲', 'N×'],
    'rowQW': ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\\|', '⌦', 'End', 'P▼', 'N-'],
    'rowAS': ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '„ “', '⭾', '⏎', '⏘', '🡅', '', 'N+'],
    'rowZX': ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', '🖰 L', '🖰M', '🖰R', '🡄', '🡇', '🡆', 'N⏎']
}

keyboard_keys_backend = {
    'rowF1': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'escape', 'print screen', 'scroll lock', 'pause', 'divide'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equals', 'back_space', 'insert', 'home', 'page up', 'multiply'],
    'rowQW': ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'open_bracket', 'close_bracket', 'back_quote', 'delete', 'end', 'page down',
              'subtract'],
    'rowAS': ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'apostrophe', 'tab', 'enter', 'space', 'up', 'None3', 'add'],
    'rowZX': ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'period', 'slash', 'button1', 'button2', 'button3', 'left', 'down', 'right', '']
}


def to_print(*arg, **kwargs):
    print(arg, kwargs, file=open('/\print.txt', 'a'))


def get_keyboard_keys_dict():
    """

    @return: dict {'f1': {'front_name': 'F1'},...}
    """

    def to_list(dictionary):
        value_list = []
        for row in dictionary.values():
            for keycap in row:
                value_list.append(keycap)
        return value_list

    keyboard_keys_dict = dict(zip(to_list(keyboard_keys_backend), to_list(keyboard_keys_front)))
    for key, value in keyboard_keys_dict.items():
        keyboard_keys_dict[key] = {'front_name': value}  # example 'f8': {'front_name': 'F8'},
    return keyboard_keys_dict


def get_all_prog_commands_db_dict(slug):
    """

    @param slug: program slug
    @return: dict {'XDebugger.JumpToTypeSource': <Command: XDebugger.JumpToTypeSource>,...}
    """
    all_prog_commands_db_dict = {}

    program_commands_db = Command.objects.filter(program=slug)
    for command in program_commands_db:
        all_prog_commands_db_dict.update(
            {command.name: command})  # 'XDebugger.JumpToTypeSource': <Command: XDebugger.JumpToTypeSource>,
    return all_prog_commands_db_dict


def get_unassigned_commands_queryset(slug, path=r'D:/Windows.xml'):
    """

    @param slug: program slug
    @param path: path to settings file
    @return: [  <Command: ActivateFavoritesToolWindow>,
                <Command: ActivatePullRequestsToolWindow>, ...]

    """
    assigned_command_dict = parse_settings_file(path)
    all_prog_commands = get_all_prog_commands_db_dict(slug=slug)
    for command_name, command_type_shortcuts in assigned_command_dict.items():
        all_prog_commands.pop(command_name, '')
    unassigned_commands_queryset = []
    for command in all_prog_commands.values():
        unassigned_commands_queryset.append(command)
    return unassigned_commands_queryset


def modify_keyboard_keys_dict(path, slug):
    """

    @param path: path to setting file
    @return: dict {'f1': {
                        'front_name': 'F1',
                        'simple': 'help',
                        '[mod_code]':[command],
                        'a': 'command'
                        'c': 'command',
                        's': '',
                        },...
    """
    keyboard_keys_dict = get_keyboard_keys_dict()
    assigned_command_dict = parse_settings_file(path)

    for command_name, command_type_shortcuts in assigned_command_dict.items():
        for shortcut_list in command_type_shortcuts.values():
            if len(shortcut_list) != 0:
                for shortcut in shortcut_list:
                    modifiers_key = shortcut.split()
                    key = modifiers_key.pop()
                    if len(modifiers_key) != 0:
                        modifiers = map((lambda mod: mod[0]), sorted(modifiers_key))
                        modifiers = ''.join(modifiers)
                    else:
                        modifiers = 'simple'  # (modifiers='cs', key='9', name='ToggleBookmark9')

                    if keyboard_keys_dict.get(key):
                        command = Command.objects.filter(program=slug, name=command_name)
                        template = loader.get_template('keymap/command_description.html')
                        context = {
                            'command': command,
                        }
                        command_description = template.render(context)

                        keyboard_keys_dict[key].update({modifiers: command_description})
    return keyboard_keys_dict


class ShowProgramCommands(ListView):
    model = Command
    template_name = 'keymap/index.html'
    allow_empty = False

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        slug = self.kwargs['slug']
        context['title'] = 'Редактор комбинаций'
        context['prog_selected'] = slug
        context['program_commands'] = get_unassigned_commands_queryset(path=r'D:/Windows.xml', slug=slug)
        context['keyboard_keys_dict'] = modify_keyboard_keys_dict(path=r'D:/Windows.xml', slug=slug)
        return context


class Index(ListView):
    model = Command
    template_name = 'keymap/index.html'

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Выбор программы для редактора'
        context['prog_selected'] = 0
        context['keyboard_keys_dict'] = get_keyboard_keys_dict()
        return context


def about(request):
    return render(request, 'keymap/about.html', {'title': 'О сайте'})


def add_program(request):
    return HttpResponse('Добавление программы')


def contact(request):
    return HttpResponse('Обратная связь')


def login(request):
    return HttpResponse('Авторизация')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')
