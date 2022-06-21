from django import template
from shortcutEditor.models import *

register = template.Library()

@register.simple_tag()
def get_prog_commands():
    return  ProgramCommand.objects.all()