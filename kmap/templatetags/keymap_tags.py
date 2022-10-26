from django import template
from kmap.models import *

register = template.Library()


@register.simple_tag()
def get_program_list():
    return Prog.objects.all()


@register.simple_tag()
def get_prog_keymap_info(prog_selected):
    keymap_info: str = Prog.objects.filter(
        slug=prog_selected).first().keymap_info

    keymap_info = keymap_info.split('$separator$')
    return keymap_info
