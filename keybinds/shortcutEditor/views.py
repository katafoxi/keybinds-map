from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render

def index(request):
    return HttpResponse('Страница приложения конфигуратора')

def categories(request, cat):
    return HttpResponse(f'<h1>Категории программ</h1><p>{cat}</p>')


def pageNotFound(request, exception):
    return HttpResponseNotFound('<h1>Такой страницы пока нет</h1>')