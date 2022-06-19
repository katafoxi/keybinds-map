from django.http import request
from django.urls import  path
from  .views import *

urlpatterns = [
    path('', index, name = 'main'),
    path('about', about, name= 'about'),
    path('addprogram/', add_program, name='add_program'),
    path('contact/', contact, name = 'contact'),
    path('login/', login, name = 'login'),
    path('program/<int:program_id>/', show_program_commands, name ='program'),
]