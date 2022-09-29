from django.contrib.auth import logout, login
from django.contrib.auth.views import LoginView
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView

from keymap.keyboard import Keyboard
from keymap.forms import RegisterUserForm, LoginUserForm, AddProgramForm, AddSettingsFileForm
from keymap.models import *
from keymap.parser_pycharm import pycharm_parser_settings_file
from keymap.utils import DataMixin, menu


def to_print(*arg, **kwargs):
    print(arg, kwargs, file=open('/\print.txt', 'a'))


def get_unassigned_commands_db(commands_with_modifiers: dict, slug: str):
    """

    @param slug: program slug
    @param commands_with_modifiers: assigned commands from setting file
    @return: [  <Command: ActivateFavoritesToolWindow>,
                <Command: ActivatePullRequestsToolWindow>, ...]

    """
    all_prog_commands_db = {}

    program_commands_db = Command.objects.filter(program=slug)
    for command_obj in program_commands_db:
        all_prog_commands_db.update({command_obj.name: command_obj})
    if commands_with_modifiers:
        for command_name, command_type_shortcuts in commands_with_modifiers.items():
            all_prog_commands_db.pop(command_name, '')

    unassigned_commands_queryset = []
    for command_obj in all_prog_commands_db.values():
        unassigned_commands_queryset.append(command_obj)
    return unassigned_commands_queryset


class ShowProgramCommands(DataMixin, ListView):
    model = Command
    template_name = 'keymap/index.html'
    allow_empty = False

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        slug = self.kwargs['slug']
        program = Program.objects.get(slug=slug)
        settings_files = SettingsFile.objects.filter(program=slug)

        if len(settings_files) != 0:
            context['settings_files'] = settings_files
            if self.request.method == 'POST':
                commands_with_modifiers = pycharm_parser_settings_file(self.request.FILES['file'])
            else:
                settings_file = self.kwargs.get('id', 0)
                context['current_settings_file'] = settings_file
                path_to_file = './' + SettingsFile.objects.get(program=slug, id=settings_file).file.url
                commands_with_modifiers = pycharm_parser_settings_file(settings_file=path_to_file)
            context['commands_without_modifiers'] = get_unassigned_commands_db(commands_with_modifiers, slug=slug)
            context['keyboard_keys_dict'] = Keyboard.get_buttons_with_commands(commands_with_modifiers, slug=slug)
        else:
            context['error_message'] = f'Поддержка программы {program.title}'
            context['keyboard_keys_dict'] = Keyboard.get_clean_buttons()
        c_def = self.get_user_context(title='Редактор комбинаций ' + slug, prog_selected=slug)
        context = dict(list(context.items()) + list(c_def.items()))
        return context

    def post(self, request, *args, **kwargs):
        self.object_list = self.get_queryset()
        context = self.get_context_data()
        return self.render_to_response(context)


def analise_settings_file(request, slug):
    file = request.FILES
    print(file)
    print(slug)
    return HttpResponse('lf')


class Index(DataMixin, ListView):
    model = Command
    template_name = 'keymap/index.html'

    def get_context_data(self, *, object_list=None, **kwargs):
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Выбор программы для редактора")
        context['keyboard_keys_dict'] = Keyboard.get_clean_buttons()

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


class AddProgram(DataMixin, CreateView):
    form_class = AddProgramForm
    template_name = 'keymap/add_program.html'
    success_url = reverse_lazy('main')

    def get_context_data(self, *, objects_list=None, **kwargs):
        if self.request.method == 'POST':
            form = AddProgramForm(self.request.POST, self.request.FILES)
        else:
            form = AddProgramForm()
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Добавление программы")
        context['form'] = form
        return dict(list(context.items()) + list(c_def.items()))

    def form_valid(self, form):
        form.save()
        return redirect('main')


class AddSettingsFile(DataMixin, CreateView):
    form_class = AddSettingsFileForm
    template_name = 'keymap/add_settings_file.html'
    success_url = reverse_lazy('main')

    def get_context_data(self, *, objects_list=None, **kwargs):
        slug = self.kwargs['slug']
        if self.request.method == 'POST':
            form = AddSettingsFileForm(self.request.POST, self.request.FILES)
        else:
            form = AddSettingsFileForm()
        context = super().get_context_data(**kwargs)
        c_def = self.get_user_context(title="Добавление программы")
        context['form'] = form
        return dict(list(context.items()) + list(c_def.items()))

    def form_valid(self, form):
        settings_file = form.save(commit=False)
        if self.request.user != 'AnonymousUser':
            settings_file.owner = self.request.user
            print(settings_file.owner)
        return redirect('main')


def add_settings_file(request):
    if request.method == 'POST':
        form = AddSettingsFileForm(request.POST, request.FILES)
        if form.is_valid():
            # print(request.FILES)

            pass
    else:
        form = AddSettingsFileForm()
    return render(request, 'keymap/add_settings_file.html', {'menu': menu, 'title': 'Анализ keymap', 'form': form})


def contact(request):
    return HttpResponse('<html><title>Обратная связь</title></html>')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')
