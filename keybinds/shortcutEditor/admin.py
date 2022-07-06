from django.contrib import admin

# Register your models here.
from .models import *

class ProgramAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'version', 'icon', 'program_site' )
    list_display_links = ('id', 'icon', 'program_site')
    search_fields = ('version',)
    list_editable = ('version',)
    list_filter = ('version', )
    prepopulated_fields = {"slug":("title",)}

class ProgramCommandsAdmin(admin.ModelAdmin):
    list_display = ('program', 'command_name', 'command_name_repr' )




admin.site.register(Program, ProgramAdmin)
admin.site.register(ProgramCommand, ProgramCommandsAdmin)
