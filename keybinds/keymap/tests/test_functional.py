from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import unittest


class NewVisitorTest(unittest.TestCase):

    def setUp(self):
        """ установка"""
        self.driver = webdriver.Firefox()

    def tearDown(self):
        """ демонтаж """
        self.driver.quit()

    def test_can_start_a_list_and_retrieve_it_later(self):
        """ тест: можно начать список и получить его позже """
        # Заход на домашнюю страницу
        self.driver.get('http://localhost:8000')

        # Видим нужный title
        self.assertIn('Выбор программы для редактора', self.driver.title)
        self.driver.find_element(by='id', value='keyboardGrid')

    def test_can_login(self):
        """ тест: вход на сайт"""

        self.driver.get('http://localhost:8000/login')
        self.assertIn('Регистрация', self.driver.find_element(by=By.CLASS_NAME, value='last').text)
        input_name = self.driver.find_element(by='id', value='id_username')
        input_name.send_keys('test')
        input_pass = self.driver.find_element(by='id', value='id_password')
        input_pass.send_keys('123456789@')
        input_pass.send_keys(Keys.ENTER)
        WebDriverWait(
            driver=self.driver,
            timeout=10,
        ).until(
            EC.url_to_be('http://localhost:8000/')
        )
        self.assertIn('test', self.driver.find_element(by=By.CLASS_NAME, value='last').text)
