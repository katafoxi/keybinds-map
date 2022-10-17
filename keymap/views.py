from django.contrib.auth import logout, login
from django.contrib.auth.views import LoginView
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView
from mypy.types import NoneType

from keymap.forms import (
    RegisterForm,
    LoginUserForm,
    AddProgramForm,
    AddSettingsFileForm,
)
from keymap.keyboard import Keyboard
from keymap.models import *
from keymap.parser_pycharm import pycharm_parse_settings_file
from keymap.utils import DataMixin, menu
from typing import Dict, List


class Index(DataMixin, ListView):
    model = Command
    template_name = "keymap/main.html"

    def get_context_data(self, *, object_list=None, **kwargs) -> Dict[str, NoneType]:
        context = super().get_context_data(**kwargs)
        context["keyboard_buttons"] = Keyboard.get_clean_buttons()
        context.update(self.get_user_context(title="Выбор программы для редактора"))
        return context


class ShowProgramCommands(DataMixin, ListView):
    model = Command
    template_name = "keymap/main.html"
    allow_empty = False

    def SetUp(self):
        pass

    def tearDown(self):
        pass

    def post(self, request, *args, **kwargs):
        self.object_list = self.get_queryset()
        context = self.get_context_data()
        return self.render_to_response(context)

    def get_context_data(self, *, object_list=None, **kwargs) -> Dict[str, NoneType]:
        context = super().get_context_data(**kwargs)
        slug = self.kwargs["slug"]
        program = Program.objects.get(slug=slug)
        settings_files = SettingsFile.objects.filter(program=slug)

        if len(settings_files) != 0:
            context["settings_files"] = settings_files
            if self.request.method == "POST":
                commands_with_shortcuts = pycharm_parse_settings_file(self.request.FILES["file"])
                context['analyzed_settings_file'] = self.request.FILES['file'].name.split('.')[0]
            else:
                settings_file = self.kwargs.get("id", 0)
                context["current_settings_file"] = settings_file
                path_to_file = ("./" + SettingsFile.objects.get(program=slug, id=settings_file).file.url)
                commands_with_shortcuts = pycharm_parse_settings_file(settings_file=path_to_file)
            context["commands_without_shortcuts"] = [command for command in Command.objects.filter(program=slug) if
                                                     command.name not in commands_with_shortcuts.keys()]
            context["keyboard_buttons"] = Keyboard.get_buttons_with_commands(commands_with_shortcuts, slug=slug)
        else:
            context["error_message"] = f"Поддержка программы {program.title} пока отсутствует."
            context["keyboard_buttons"] = Keyboard.get_clean_buttons()
        context.update(self.get_user_context(title=program.title, prog_selected=slug))
        return context


class RegisterUser(DataMixin, CreateView):
    form_class = RegisterForm
    template_name = "keymap/register.html"
    success_url = reverse_lazy("login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(self.get_user_context(title="Регистрация"))
        return context

    def form_valid(self, form):
        user = form.save()
        login(self.request, user=user)
        return redirect("main")


class LoginUser(DataMixin, LoginView):
    form_class = LoginUserForm
    template_name = "keymap/login.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(self.get_user_context(title="Авторизация"))
        return context

    def get_success_url(self):
        return reverse("main")


def logout_user(request):
    logout(request)
    return redirect("main")


class AddProgram(DataMixin, CreateView):
    form_class = AddProgramForm
    template_name = "keymap/add_program.html"
    success_url = reverse_lazy("main")

    def get_context_data(self, *, objects_list=None, **kwargs):
        if self.request.method == "POST":
            form = AddProgramForm(self.request.POST, self.request.FILES)
        else:
            form = AddProgramForm()
        context = super().get_context_data(**kwargs)
        context["form"] = form
        context.update(self.get_user_context(title="Добавление программы"))
        return context

    def form_valid(self, form):
        form.save()
        return redirect("main")


def contact(request):
    return HttpResponse("<html><title>Обратная связь</title></html>")


def pageNotFound(request, exception):
    return HttpResponseNotFound("<h1>Такой страницы пока нет</h1>")
