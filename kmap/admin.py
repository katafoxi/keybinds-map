from django.contrib import admin

# Register your models here.
from .models import *

class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'name',  'icon', 'site' )
    list_display_links = ('id', 'icon', 'site')
    prepopulated_fields = {"slug":("name",)}

class CommandAdmin(admin.ModelAdmin):
    list_display = ('prog', 'name', 'short_name' )

class SettingsFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'prog', 'name', 'rating', 'owner')




admin.site.register(Prog, ProgramAdmin)
admin.site.register(Action, CommandAdmin)
admin.site.register(Keymap, SettingsFileAdmin)
