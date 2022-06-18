from django.db import models

# Create your models here.
class Program(models.Model):
    title= models.CharField(max_length=50)
    version= models.CharField(max_length=50)
    icon = models.ImageField(upload_to='icon')
    program_site = models.URLField(max_length=250)

class ProgramCommand(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE())
    command_name = models.CharField(250)
    command_description = models.CharField(max_length=250)
    command_help = models.URLField(max_length=250)
    icon = models.ImageField(upload_to='icon')







