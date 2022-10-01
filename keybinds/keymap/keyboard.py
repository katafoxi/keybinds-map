from django.template import loader
from keymap.models import Command


class Keyboard:
    buttons_front = {
        'rowF1': ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '␛', '⎙', 'SLk', '⏸',
                  'N÷'],
        'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-_', '+=', '⌫', 'Ins', '🏠', 'P▲', 'N×'],
        'rowQW': ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[{', ']}', '\\|', '⌦', 'End', 'P▼', 'N-'],
        'rowAS': ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';:', '„ “', '⭾', '⏎', '⏘', '🡅', '', 'N+'],
        'rowZX': ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',<', '.>', '/?', '🖰 L', '🖰M', '🖰R', '🡄', '🡇', '🡆', 'N⏎']
    }

    buttons_back = {
        'rowF1': ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'escape',
                  'print screen', 'scroll lock', 'pause', 'divide'],
        'row12': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'minus', 'equals', 'back_space', 'insert',
                  'home', 'page up', 'multiply'],
        'rowQW': ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'open_bracket', 'close_bracket', 'back_quote',
                  'delete', 'end', 'page down',
                  'subtract'],
        'rowAS': ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'semicolon', 'apostrophe', 'tab', 'enter', 'space',
                  'up', 'None3', 'add'],
        'rowZX': ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'comma', 'period', 'slash', 'button1', 'button2', 'button3',
                  'left', 'down', 'right', '']
    }

    @staticmethod
    def get_clean_buttons() -> dict:
        """

        @return: dict {'f1': {'front_name': 'F1'},...}
        """

        def to_list(dictionary):
            value_list = []
            for row in dictionary.values():
                for button in row:
                    value_list.append(button)
            return value_list

        keyboard_keys = dict(zip(to_list(Keyboard.buttons_back), to_list(Keyboard.buttons_front)))
        for key, value in keyboard_keys.items():
            keyboard_keys[key] = {'front_name': value}
        return keyboard_keys

    @staticmethod
    def get_buttons_with_commands(commands_with_shortcuts: dict, slug: str) -> dict:
        """

        @param commands_with_shortcuts: assigned commands after parse settings file
        @param slug: program slug
        @return: dict {'f1': {
                            'front_name': 'F1',
                            'simple': 'help',
                            'a': 'command'
                            'c': 'command',
                            's': '',
                            },...
        """
        keyboard_buttons = Keyboard.get_clean_buttons()

        for command_name, shortcuts_dict in commands_with_shortcuts.items():
            for button, modifiers in shortcuts_dict.items():
                if keyboard_buttons.get(button):
                    command = Command.objects.filter(program=slug, name=command_name)
                    template = loader.get_template('keymap/command_repr.html')
                    command_description = template.render({'command': command})
                    keyboard_buttons[button].update({modifiers: command_description})
        return keyboard_buttons
