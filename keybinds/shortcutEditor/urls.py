from django.http import request
from django.urls import  path
from  .views import *

urlpatterns = [
    path('', index, name = 'main'),
    path('cats/<slug:cat>', categories)
]