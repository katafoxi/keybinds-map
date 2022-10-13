from django import template
from keymap.models import *

register = template.Library()


@register.simple_tag()
def get_program_list():
    return Program.objects.all()
