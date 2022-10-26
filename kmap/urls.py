from django.urls import path

from kmap.views import *

urlpatterns = [
    path("", Index.as_view(), name="main"),
    path("contact/", contact, name="contact"),
    path("register/", RegisterUser.as_view(), name="register"),
    path("login/", LoginUser.as_view(), name="login"),
    path("logout/", logout_user, name="logout"),
    path("prog/<slug:slug>/",
         ShowProgActions.as_view(), name="prog"),
    path("prog/<slug:slug>/<int:id>",
         ShowProgActions.as_view(), name="keymap", ),
    path("prog/<slug:slug>/analise",
         ShowProgActions.as_view(), name="keymap_analise", ),
    path("addprog/", AddProgram.as_view(), name="add_prog"),
    path("prog/<slug:slug>/savekeymap", keymap_saver, name="keymap_saver"),
]
