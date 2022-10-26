# SOURCE https://ru.stackoverflow.com/questions/1064514/%D0%9A%D0%B0%D0%BA
# -%D1%81%D0%BE%D0%B7%D0%B4%D0%B0%D1%82%D1%8C-xml-%D0%BD%D0%B0-python-%D0%B8
# %D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D1%83%D1%8F-xml-etree-elementtree
def indent(elem, level=0):
    """Функция для получения XML с отступами"""
    i = "\n" + level * "  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
        for elem in elem:
            indent(elem, level + 1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i
