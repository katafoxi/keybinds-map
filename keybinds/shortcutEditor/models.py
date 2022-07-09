from django.db import models
from django.urls import reverse


class Program(models.Model):
    title = models.CharField(max_length=50, verbose_name='Название программы')
    slug = models.SlugField(max_length=255, unique=True, db_index=True, verbose_name='URL')
    version = models.CharField(max_length=50, verbose_name='Версия')
    icon = models.ImageField(upload_to='icon')
    program_site = models.URLField(max_length=250, verbose_name='Оф.сайт')

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('program', kwargs={'slug': self.slug})

    class Meta:
        verbose_name = 'Поддерживаемые программы'
        verbose_name_plural = 'Поддерживаемые программы'


# def user_directory_path(instance, filename):
#     # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
#     return 'user_{0}/{1}'.format(instance.user.id, filename)

class ProgramCommand(models.Model):
    program = models.ForeignKey('Program', on_delete=models.CASCADE)
    command_name = models.CharField(max_length=250)
    command_name_repr = models.CharField(max_length=100)
    icon = models.ImageField(upload_to='program_icons', blank=True)

    def __str__(self):
        return self.command_name

    def get_absolute_url(self):
        return reverse('command', kwargs={'command_id': self.pk})

    class Meta:
        verbose_name = "Команды "
        verbose_name_plural = 'Команды программ'
        ordering = ['id']


def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return '{0}_setting_files/{1}'.format(instance.program.title, filename)


class ProgramSettingsFile(models.Model):
    program = models.ForeignKey('Program', on_delete=models.CASCADE)
    settings_file_name = models.CharField(max_length=100,
                                          unique=True,
                                          verbose_name='Название файла настроек',
                                          help_text="Please use the following format: [program_name]_[setting_filename]")
    # settings_file_owner= models.
    file = models.FileField(upload_to=user_directory_path)
