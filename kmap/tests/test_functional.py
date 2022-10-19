# from django.contrib.auth.models import User
# from django.contrib.staticfiles.testing import StaticLiveServerTestCase
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support import expected_conditions
# from selenium.webdriver.support.wait import WebDriverWait
#
#
# class NewVisitorTest(StaticLiveServerTestCase):
#
#     def setUp(self):
#         """ установка"""
#         self.driver = webdriver.Firefox()
#         self.username: str = 'test'
#         self.email: str = 'testuser@gmail.com'
#         self.password: str = '123456789@'
#
#     def tearDown(self):
#         """ демонтаж """
#         self.driver.quit()
#
#     def test_can_start_a_list_and_retrieve_it_later(self):
#         """ Тест: можно начать список и получить его позже """
#         # Заход на домашнюю страницу
#         self.driver.get(self.live_server_url)
#
#         # Видим нужный name
#         self.assertIn('Выбор программы для редактора', self.driver.name)
#         self.driver.find_element(by='id', value='keyboardGrid')
#
#     def test_can_register(self):
#         """ Тест: возможность регистрации"""
#
#         self.driver.get('%s%s' % (self.live_server_url, '/register/'))
#         self.driver.find_element(by='id', value='id_username').send_keys(self.username)
#         self.driver.find_element(by='id', value='id_email').send_keys(self.email)
#         self.driver.find_element(by='id', value='id_password1').send_keys(self.password)
#         self.driver.find_element(by='id', value='id_password2').send_keys(self.password)
#         self.driver.find_element(By.XPATH, '//button[text()="Регистрация"]').click()
#         self.finisher()
#
#     def test_can_login(self):
#         """ Тест: вход на сайт"""
#
#         user = User.objects.create_user(
#             username=self.username,
#             email=self.email,
#             password=self.password
#         )
#         user.save()
#         self.driver.get('%s%s' % (self.live_server_url, '/login/'))
#         self.assertIn('Регистрация', self.driver.find_element(by=By.CLASS_NAME, value='last').text)
#         self.driver.find_element(by='id', value='id_username').send_keys(self.username)
#         self.driver.find_element(by='id', value='id_password').send_keys(self.password)
#         self.driver.find_element(By.XPATH, '//button[text()="Войти"]').click()
#         self.finisher()
#
#     def finisher(self):
#         WebDriverWait(
#             driver=self.driver,
#             timeout=10,
#         ).until(
#             expected_conditions.url_to_be(self.live_server_url + '/')
#         )
#         self.assertIn(self.username, self.driver.find_element(by=By.CLASS_NAME, value='last').text)
#         User.objects.get(username=self.username).delete()
#
