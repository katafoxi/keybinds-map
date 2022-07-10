from django.contrib import admin

# Register your models here.
from .models import *

class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'title',  'icon', 'site' )
    list_display_links = ('id', 'icon', 'site')
    prepopulated_fields = {"slug":("title",)}

class CommandAdmin(admin.ModelAdmin):
    list_display = ('program', 'name', 'short_name' )




admin.site.register(Program, ProgramAdmin)
admin.site.register(Command, CommandAdmin)
