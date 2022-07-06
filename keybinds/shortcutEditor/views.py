from pprint import pprint

from django.http import HttpResponse, HttpResponseNotFound, Http404
from django.shortcuts import render, get_object_or_404
from django.template import loader

from .models import *
from .parser_pycharm import parse_settings_file

keyboard_keys_front = {
    'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Esc', 'PSc', 'SLk', 'Pause', 'N\\'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+', 'Bck', 'Ins', 'home', 'PUp', 'N*'],
    'rowQW': ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\\|', 'Del', 'End', 'PD', 'N-'],
    'rowAS': ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '„ “', 'Tab', 'Enter', 'Space', 'Up', '', 'N+'],
    'rowZX': ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', 'mouse_left', 'mouse_middle', 'mouse_right', 'Left', 'Down', 'Right', 'NEnter']
}

keyboard_keys_backend = {
    'rowF1': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'escape', 'print screen', 'scroll lock', 'pause', 'divide'],
    'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equals', 'back_space', 'insert', 'home', 'page up', 'multiply'],
    'rowQW': ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'open_bracket', 'close_bracket', 'back_quote', 'delete', 'end', 'page down',
              'subtract'],
    'rowAS': ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'apostrophe', 'tab', 'enter', 'space', 'up', 'None3', 'add'],
    'rowZX': ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'period', 'slash', 'button1', 'button2', 'button3', 'left', 'down', 'right', '']
}
# modifiers = ['Alt', 'Ctrl', 'Shift', 'CtrlAlt', 'CtrlShift', 'AltShift', 'CtrlAltShift']

def to_print(*arg, **kwargs):
    print(arg, kwargs, file=open('C:\OpenServer\domains\keybinds.ru\keybinds\shortcutEditor\print.txt', 'a'))


def get_keyboard_keys_dict():
    """

    @return: dict {'f1': {'front_name': 'F1'},...}
    """

    def to_list(dictionary):
        value_list = []
        for row in dictionary.values():
            for key in row:
                value_list.append(key)
        return value_list

    keyboard_keys_dict = dict(zip(to_list(keyboard_keys_backend), to_list(keyboard_keys_front)))
    for key, value in keyboard_keys_dict.items():
        keyboard_keys_dict[key] = {'front_name': value}  # example 'f8': {'front_name': 'F8'},
    return keyboard_keys_dict



def get_all_prog_commands_db_dict(program_id):
    """

    @param program_id:
    @return: dict {'XDebugger.JumpToTypeSource': <ProgramCommand: XDebugger.JumpToTypeSource>,...}
    """
    all_prog_commands_db_dict = {}
    program_commands_db = ProgramCommand.objects.filter(program_id=program_id)
    for command in program_commands_db:
        all_prog_commands_db_dict.update(
            {command.command_name: command})  # 'XDebugger.JumpToTypeSource': <ProgramCommand: XDebugger.JumpToTypeSource>,
    return all_prog_commands_db_dict

def get_unassigned_commands_queryset(path=r'D:/Windows.xml', program_id=1):
    """

    @param path: path to settings file
    @param program_id: id program from db
    @return: [<ProgramCommand: ActivateFavoritesToolWindow>, <ProgramCommand: ActivatePullRequestsToolWindow>, ...]

    """
    assigned_command_dict = parse_settings_file(path)
    all_prog_commands = get_all_prog_commands_db_dict(program_id=program_id)
    for command_name, command_type_shortcuts in assigned_command_dict.items():
        all_prog_commands.pop(command_name, '')
    unassigned_commands_queryset = []
    for command in all_prog_commands.values():
        unassigned_commands_queryset.append(command)
    return unassigned_commands_queryset

print(get_unassigned_commands_queryset())


def modify_keyboard_keys_dict(path, program_id):
    """

    @param path: path to setting file
    @param program_id: id program from db
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
        # print(command_name, command_type_shortcuts)
        for shortcut_list in command_type_shortcuts.values():
            if len(shortcut_list) != 0:
                for shortcut in shortcut_list:
                    modifiers_key = shortcut.split()
                    key = modifiers_key.pop()
                    if len(modifiers_key) != 0:
                        modifiers = map((lambda mod: mod[0]), sorted(modifiers_key))
                        modifiers = ''.join(modifiers)
                        # to_print(modifiers, key, command_name) #
                    else:
                        modifiers = 'simple'
                    # (modifiers='cs', key='9', command_name='ToggleBookmark9')

                    if keyboard_keys_dict.get(key):
                        command = ProgramCommand.objects.filter(program_id=program_id, command_name=command_name)
                        template = loader.get_template('shortcutEditor/command_description.html')
                        context = {
                            'command': command,
                        }
                        command_description = template.render(context)

                        keyboard_keys_dict[key].update({modifiers: command_description})
    return keyboard_keys_dict


def get_key_commands_subdict(key, command_name, modifiers, program_id=1):
    # to_print(key, command_name, modifiers, program_id=1 )
    pass


def show_program_commands(request, slug):
    program = get_object_or_404(Program, slug= slug)
    program_id = program.pk
    program_commands = get_unassigned_commands_queryset(path=r'D:/Windows.xml', program_id=program_id)
    # if len(program_commands) == 0:
    #     raise Http404()
    context = {
        'title': 'Редактор комбинаций',
        'program_commands': program_commands,
        'prog_selected': program_id,
        'keyboard_keys_dict': modify_keyboard_keys_dict(path=r'D:/Windows.xml', program_id=program_id)
    }
    return render(request, 'shortcutEditor/index.html', context=context)


def index(request):
    programs = Program.objects.all()
    program_commands = ProgramCommand.objects.all()
    context = {

        'title': 'Редактор комбинаций',
        'prog_selected': 0,
        'keyboard_keys_dict': get_keyboard_keys_dict()
    }
    res = render(request, 'shortcutEditor/index.html', context=context)
    return res



def about(request):
    return render(request, 'shortcutEditor/about.html', {'title': 'О сайте'})


def add_program(request):
    return HttpResponse('Добавление программы')


def contact(request):
    return HttpResponse('Обратная связь')


def login(request):
    return HttpResponse('Авторизация')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')


def show_command(request, command_id):
    return HttpResponse('Команда какая-то')
