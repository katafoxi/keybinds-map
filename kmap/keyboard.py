from django.template import loader
from kmap.models import Action


class Keyboard:
    buttons_front = [
        'F1', 'F2', 'F3', 'F4', 'F5',
        'F6', 'F7', 'F8', 'F9', 'F10',
        'F11', 'F12', 'Esc', '🎦', 'SLk',
        'Pau', 'N÷',

        '1', '2', '3', '4', '5',
        '6', '7', '8', '9', '0',
        '-_', '+=', '⌫', 'Ins', '🏠',
        'P▲', 'N×',

        'Q', 'W', 'E', 'R', 'T',
        'Y', 'U', 'I', 'O', 'P',
        '[{', ']}', '\\|', '⌦', 'End',
        'P▼', 'N-',

        'A', 'S', 'D', 'F', 'G',
        'H', 'J', 'K', 'L', ';:',
        '„ “', '☰', '⏎', '↹', '↑',  # ''- дыра в сетке клавиатуры
        '🚀', 'N+',

        'Z', 'X', 'C', 'V', 'B',
        'N', 'M', ',<', '.>', '/?',
        '🖰 L', '🖰M', '🖰R', '←', '↓',
        '→', '`~'
    ]

    buttons_back = [
        'f1', 'f2', 'f3', 'f4', 'f5',
        'f6', 'f7', 'f8', 'f9', 'f10',
        'f11', 'f12', 'escape', 'print_screen', 'scroll lock',
        'pause', 'divide',

        '1', '2', '3', '4', '5',
        '6', '7', '8', '9', '0',
        'minus', 'equals', 'back_space', 'insert', 'home',
        'page_up', 'multiply',

        'q', 'w', 'e', 'r', 't',
        'y', 'u', 'i', 'o', 'p',
        'open_bracket', 'close_bracket', 'back_slash', 'delete', 'end',
        'page_down', 'subtract',

        'a', 's', 'd', 'f', 'g',
        'h', 'j', 'k', 'l', 'semicolon',
        'quote', 'context_menu', 'enter', 'tab', 'up',
        'space', 'add',

        'z', 'x', 'c', 'v', 'b',
        'n', 'm', 'comma', 'period', 'slash',
        'button1', 'button2', 'button3', 'left', 'down',
        'right', 'back_quote'
    ]

    bounded_buttons = [
        'divide',

        '1', '2', '3', '4', '5',
        '6', '7', '8', '9', '0',
        'minus', 'equals', 'back_space',
        'multiply',

        'q', 'w', 'e', 'r', 't',
        'y', 'u', 'i', 'o', 'p',
        'open_bracket', 'close_bracket', 'back_slash', 'delete',
        'subtract',

        'a', 's', 'd', 'f', 'g',
        'h', 'j', 'k', 'l', 'semicolon',
        'quote', 'enter', 'tab',
        'space', 'add',

        'z', 'x', 'c', 'v', 'b',
        'n', 'm', 'comma', 'period', 'slash',
        'button1', 'button2', 'button3',
        'back_quote'
    ]


    @classmethod
    def get_empty_buttons(cls) -> dict:
        """
        Метод возвращает словарь с пустыми клавишами

        @return: dict {'f1': {'front_name': 'F1'},...}
        """
        keyboard_keys = {}
        for back, front in zip(cls.buttons_back, cls.buttons_front):
            keyboard_keys[back] = {'front_name': front}
        return keyboard_keys

    @staticmethod
    def get_filled_buttons(acts_with_combs: dict, slug: str) -> dict:
        """
        Функция возвращает результат заполнения 'кнопок клавиатуры'
        командами, в соответствии с комбинациями

        @param acts_with_combs: assigned commands after parse settings file
        @param slug: prog slug
        @return: dict {'f1': {
                            'front_name': 'F1',
                            'simple': 'help',
                            'a': render('action_repr.html') для команды1,
                            'keyboard__c': render('action_repr.html') для
                            команды2,
                            's': '',
                            },...
        """
        k_buttons = Keyboard.get_empty_buttons()

        for action_name, combs in acts_with_combs.items():
            for button, mod_keys in combs.items():
                if button in k_buttons:
                    actions = Action.objects.filter(
                        prog=slug, name=action_name)
                    if len(actions) != 0:
                        for action in actions:
                            # рендер шаблона action_repr.html находится здесь,
                            # чтобы не вводить массовые проверки на наличие
                            # команды в шаблоне main.html
                            template = loader.get_template(
                                template_name='kmap/action_repr.html')
                            action_repr = template.render({'action': action})
                            k_buttons[button].update({mod_keys: action_repr})
                else:
                    print(button)
        return k_buttons
