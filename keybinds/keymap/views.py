from django.contrib.auth import logout, login
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.views import LoginView
from django.http import HttpResponse, HttpResponseNotFound, Http404
from django.shortcuts import render, get_object_or_404, redirect
from django.template import loader
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView

from .forms import RegisterUserForm, LoginUserForm, AddProgramForm, AddSettingsFileForm
from .models import *
from .parser_pycharm import parse_settings_file
from .utils import DataMixin, menu

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


def get_keyboard_keys() -> dict:
    """

    @return: dict {'f1': {'front_name': 'F1'},...}
    """

    def to_list(dictionary):
        value_list = []
        for row in dictionary.values():
            for k_key in row:
                value_list.append(k_key)
        return value_list

    keyboard_keys = dict(zip(to_list(keyboard_keys_backend), to_list(keyboard_keys_front)))
    for key, value in keyboard_keys.items():
        keyboard_keys[key] = {'front_name': value}  # example 'f8': {'front_name': 'F8'},
    return keyboard_keys



def get_commands_without_modifiers(commands_with_modifiers:dict, slug: str):
    """

    @param slug: program slug
    @param commands_with_modifiers: assigned commands from setting file
    @return: [  <Command: ActivateFavoritesToolWindow>,
                <Command: ActivatePullRequestsToolWindow>, ...]

    """
    all_prog_commands_db = {}

    program_commands_db = Command.objects.filter(program=slug)
    for command in program_commands_db:
        all_prog_commands_db.update({command.name: command})

    for command_name, command_type_shortcuts in commands_with_modifiers.items():
        all_prog_commands_db.pop(command_name, '')
    unassigned_commands_queryset = []
    for command in all_prog_commands_db.values():
        unassigned_commands_queryset.append(command)
    return unassigned_commands_queryset


def modify_keyboard_keys(commands_with_modifiers:dict, slug: str) -> dict:
    """

    @param commands_with_modifiers: assigned commands after parse settings file
    @param slug: program slug
    @return: dict {'f1': {
                        'front_name': 'F1',
                        'simple': 'help',
                        'a': 'command'
                        'c': 'command',
                        's': '',
                        },...
    """
    keyboard_keys = get_keyboard_keys()

    for command_name, shortcuts_dict in commands_with_modifiers.items():
        for k_key, shortcut in shortcuts_dict.items():
            if keyboard_keys.get(k_key):
                command = Command.objects.filter(program=slug, name=command_name)
                template = loader.get_template('keymap/command_description.html')
                command_description = template.render({'command': command})
                keyboard_keys[k_key].update({shortcut: command_description})
    return keyboard_keys


class ShowProgramCommands(DataMixin, ListView):
    model = Command
    template_name = 'keymap/index.html'
    allow_empty = False

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        slug = self.kwargs['slug']
        program = Program.objects.get(slug = slug)
        settings_files = SettingsFile.objects.filter(program=slug)
        if len(settings_files)!=0:

            settings_file = self.kwargs.get('id', 0)

            context['settings_files'] = settings_files
            context['current_settings_file']=settings_file
            path_to_file='./'+SettingsFile.objects.get(program = slug, id =settings_file).file.url


            commands_with_modifiers = parse_settings_file(path_to_file=path_to_file)

            context['commands_without_modifiers'] = get_commands_without_modifiers(commands_with_modifiers, slug=slug)
            context['keyboard_keys_dict'] = modify_keyboard_keys(commands_with_modifiers, slug=slug)
        else:
            context['error_message']=f'Поддержка программы {program.title}'
            context['keyboard_keys_dict'] = get_keyboard_keys()
        c_def = self.get_user_context(title='Редактор комбинаций '+ slug,
                                      prog_selected=slug)
        context=dict(list(context.items()) + list(c_def.items()))
        return context



class Index(DataMixin, ListView):
    model = Command
    template_name = 'keymap/index.html'

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="'Выбор программы для редактора")
        context['keyboard_keys_dict'] = get_keyboard_keys()

        return dict(list(context.items()) + list(c_def.items()))


class RegisterUser(DataMixin, CreateView):
    form_class = RegisterUserForm
    template_name = 'keymap/register.html'
    success_url = reverse_lazy('login')

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Регистрация")
        return dict(list(context.items()) + list(c_def.items()))

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('main')


class LoginUser(DataMixin, LoginView):
    form_class = LoginUserForm
    template_name = 'keymap/login.html'

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Авторизация")
        return dict(list(context.items()) + list(c_def.items()))

    def get_success_url(self):
        return reverse_lazy('main')

def logout_user(request):
    logout(request)
    return redirect('main')

def about(request):
    return render(request, 'keymap/about.html', {'title': 'О сайте'})

def add_settings_file(request):

    if request.method == 'POST':
        form = AddSettingsFileForm(request.POST, request.FILES)
        if form.is_valid():
            # print(request.FILES)
            pass
    else:
        form = AddSettingsFileForm()
    return render(request, 'keymap/add_settings_file.html', {'menu':menu, 'title':'Анализ keymap', 'form':form})

# def add_program(request):
#     if request.method == 'POST':
#         form = AddProgramForm(request.POST, request.FILES)
#         if form.is_valid():
#             # print(form.cleaned_data)
#             form.save()
#             return redirect('main')
#     else:
#         form = AddProgramForm()
#     return render(request, 'keymap/add_program.html', {'menu': menu, 'title': 'Добавление программы', 'form': form})

class AddProgram(DataMixin,CreateView):
    form_class = AddProgramForm
    template_name = 'keymap/add_program.html'
    success_url = reverse_lazy('main')

    def get_context_data(self, *, objects_list = None, **kwargs):
        if self.request.method == 'POST':
            form = AddProgramForm(self.request.POST, self.request.FILES)
        else:
            form = AddProgramForm()
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Добавление программы")
        context['form']=form
        return dict(list(context.items()) + list(c_def.items()))

    def form_valid(self, form):
        form.save()
        return redirect('main')

    def form_invalid(self, form):
        form = AddProgramForm()



def contact(request):
    return HttpResponse('Обратная связь')

def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')
