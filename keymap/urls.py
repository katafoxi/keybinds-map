from django.urls import path

from keymap.views import *

urlpatterns = [
    path("", Index.as_view(), name="main"),
    path("contact/", contact, name="contact"),
    path("register/", RegisterUser.as_view(), name="register"),
    path("login/", LoginUser.as_view(), name="login"),
    path("logout/", logout_user, name="logout"),
    path("program/<slug:slug>/", ShowProgramCommands.as_view(), name="program"),
    path("program/<slug:slug>/<int:id>", ShowProgramCommands.as_view(), name="settings_file", ),
    path("program/<slug:slug>/analise", ShowProgramCommands.as_view(), name="settings_file_analise", ),
    path("addprogram/", AddProgram.as_view(), name="add_program"),
]
