from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User


class Prog(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name="Название программы",
        help_text="Введите название программы",
    )
    slug = models.SlugField(
        max_length=100, unique=True, db_index=True, verbose_name="URL"
    )
    # version = models.CharField(max_length=50, verbose_name='Версия')
    icon = models.ImageField(
        upload_to="prog_icons", default="prog_icon.png"
    )
    keymap_info = models.TextField(
        blank=True,
        verbose_name="Обычное расположение keymap-файлa",
        help_text="Опишите, где  стандартное расположение keymap-файла",
    )
    site = models.URLField(max_length=250, verbose_name="Оф.сайт")
    is_bounded = models.BooleanField(
        default=False,
        verbose_name='Ограничения для "символ" и "Shift+символ"',
        help_text='Задействовать ограничения для текстовых редакторов?'
    )

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse(
            "keymap", kwargs={"slug": str(self.slug).lower(), "id": 1}
        )

    class Meta:
        verbose_name = "Поддерживаемые программы"
        verbose_name_plural = "Поддерживаемые программы"


class Action(models.Model):
    prog = models.ForeignKey(
        to="Prog", to_field="slug", on_delete=models.CASCADE,
        db_column="prog", verbose_name='Программа')
    name = models.CharField(
        max_length=250,
        verbose_name="Полное название действия из keymap-файла")
    short_name = models.CharField(
        max_length=100,
        verbose_name="Короткое название действия")
    descr = models.TextField(
        blank=True,
        verbose_name="Описание действия", )

    def get_icons_dir_path(self, filename):
        # uploaded to MEDIA_ROOT/<prog>_icons/<action_name>
        return "{0}_icons/{1}".format(self.prog.slug, filename)

    icon = models.ImageField(upload_to=get_icons_dir_path, blank=True)

    def __str__(self):
        return self.short_name

    class Meta:
        unique_together = ['prog', 'name']
        verbose_name = "Действие в программе "
        verbose_name_plural = "Действия программ"
        ordering = ["name"]


class Keymap(models.Model):
    prog = models.ForeignKey("Prog", to_field="slug",
                             on_delete=models.CASCADE)
    name = models.CharField(
        max_length=15,
        unique=True,
        verbose_name="Название keymap-файла", )
    descr = models.TextField(
        blank=True,
        verbose_name="Описание keymap-файлa",
        help_text="Опишите, особенности keymap", )

    def get_user_keymaps_path(self, filename):
        # file will be uploaded to MEDIA_ROOT/prog/user_<id>/<filename>
        return "{0}_keymaps/{1}/{2}".format(
            self.prog.slug, self.owner.id, filename)

    file = models.FileField(upload_to=get_user_keymaps_path)
    rating = models.DecimalField(max_digits=5, decimal_places=0, )
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE,
        verbose_name='Владелец keymap-файла')

    def get_absolute_url(self):
        return reverse(
            "keymap",
            kwargs={"slug": str(self.prog).lower(), "id": self.pk})

    class Meta:
        unique_together = ['prog', 'owner', 'name']
