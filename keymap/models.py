from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User


class Program(models.Model):
    title = models.CharField(
        max_length=100,
        verbose_name="Название программы",
        help_text="Введите название программы",
    )
    slug = models.SlugField(
        max_length=100, unique=True, db_index=True, verbose_name="URL"
    )
    # version = models.CharField(max_length=50, verbose_name='Версия')
    icon = models.ImageField(
        upload_to="program_icons", default="default_program_icon.png"
    )
    settings_file_info = models.TextField(
        blank=True,
        verbose_name="Обычное расположение файла с настройками биндов",
        help_text="Опишите, где  стандартное расположение файлов настройки",
    )
    site = models.URLField(max_length=250, verbose_name="Оф.сайт")

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse(
            "settings_file", kwargs={"slug": str(self.slug).lower(), "id": 2}
        )

    class Meta:
        verbose_name = "Поддерживаемые программы"
        verbose_name_plural = "Поддерживаемые программы"


class Command(models.Model):
    program = models.ForeignKey(
        "Program", to_field="slug", on_delete=models.CASCADE,
        db_column="program"
    )
    name = models.CharField(max_length=250)
    short_name = models.CharField(max_length=100)

    def command_icons_directory_path(self, filename):
        # uploaded to MEDIA_ROOT/<program>_command_icons/<command_name>
        return "{0}_command_icons/{1}".format(self.program.slug, filename)

    icon = models.ImageField(upload_to=command_icons_directory_path, blank=True)

    def __str__(self):
        return self.short_name

    # def get_absolute_url(self):
    #     return reverse('command', kwargs={'command_id': self.pk})

    class Meta:
        verbose_name = "Команды "
        verbose_name_plural = "Команды программ"
        ordering = ["id"]


class SettingsFile(models.Model):
    program = models.ForeignKey("Program", to_field="slug",
                                on_delete=models.CASCADE)
    name = models.CharField(
        max_length=15,
        unique=True,
        verbose_name="Название роли",
    )

    def user_directory_path(self, filename):
        # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
        return "{0}_setting_files/{1}/{2}".format(
            self.program.slug, self.owner.id, filename
        )

    file = models.FileField(upload_to=user_directory_path)
    rating = models.DecimalField(
        max_digits=5,
        decimal_places=0,
    )
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def get_absolute_url(self):
        return reverse(
            "settings_file",
            kwargs={"slug": str(self.program).lower(), "id": self.pk}
        )
