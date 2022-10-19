from django import template
from kmap.models import *

register = template.Library()


@register.simple_tag()
def get_program_list():
    return Prog.objects.all()
