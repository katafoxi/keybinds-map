from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.exceptions import ValidationError
from django.shortcuts import redirect

from kmap.models import *


class NameForm(forms.Form):
    your_name = forms.CharField(label="Your name", max_length=100)


class UploadFileForm(forms.Form):
    title = forms.CharField(max_length=50)
    file = forms.FileField()


class RegisterForm(UserCreationForm):
    username = forms.CharField(
        label="Логин", widget=forms.TextInput(attrs={"class": "form-input"})
    )
    email = forms.EmailField(
        label="Email", widget=forms.EmailInput(attrs={"class": "form-input"})
    )
    password1 = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"class": "form-input"})
    )
    password2 = forms.CharField(
        label="Повтор пароля",
        widget=forms.PasswordInput(attrs={"class": "form-input"})
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")


class LoginUserForm(AuthenticationForm):
    username = forms.CharField(
        label="Логин", widget=forms.TextInput(attrs={"class": "form-input"}))
    password = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"class": "form-input"}))


class AddProgForm(forms.ModelForm):
    class Meta:
        model = Prog
        fields = ["name", "icon", "site", "slug", "keymap_info"]
        widgets = {"name": forms.TextInput(attrs={"class": "form-input"}), }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def clean_title(self):
        title = self.cleaned_data["name"]
        if len(title) > 100:
            raise ValidationError("Длина превышает 100 символов")
        return title


class AddKeymapForm(forms.ModelForm):
    class Meta:
        model = Keymap
        fields = ["name", "file"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def clean_file(self):
        file = self.cleaned_data["file"]
        # print(type(file))
        if "xml" not in file.name:
            raise ValidationError("Неверное расширение ")
        elif file.size > 10484576:
            raise ValidationError("Слишком большой файл")
        return file
