from django.http import request
from django.urls import  path
from  .views import *

urlpatterns = [
    path('', index, name = 'main'),
    path('about', about, name= 'about'),
    path('add_program/', add_program, name='add_program'),
    path('contact/', contact, name = 'contact'),
    path('login/', login, name = 'login'),
]