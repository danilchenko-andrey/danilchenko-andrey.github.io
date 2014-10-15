#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

AUTHOR = u'Andrey Danilchenko'
SITENAME = u'4ducks'
SITEURL = u'http://www.4ducks.ru'

PATH = 'content'

TIMEZONE = 'Europe/Moscow'
DEFAULT_DATE_FORMAT='%A %d %B %Y'

DEFAULT_LANG = 'ru'
LOCALE='ru_RU'

# theme
THEME='notebook-theme'
FAVICON='images/favicon.png'
AVATAR='images/avatar.png'

SITESUBTITLE='Andrey Danilchenko dev page'
TWITTER_USERNAME='mir_nomer_nol'
GITHUB_URL='https://github.com/danilchenko-andrey'

SOCIAL=(('github', 'https://github.com/danilchenko-andrey'),
        ('linkedin', 'https://ru.linkedin.com/in/danilchenko/'),
        ('twitter', 'https://twitter.com/mir_nomer_nol')
)

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None

# Blogroll
#LINKS = (('Pelican', 'http://getpelican.com/'),
#         ('Python.org', 'http://python.org/'),
#         ('Jinja2', 'http://jinja.pocoo.org/'),
#         ('You can modify those links in your config file', '#'),)


DEFAULT_PAGINATION = False

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True
