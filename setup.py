from setuptools import setup, find_packages

setup(
    name = 'django-unsaved-changes',
    packages = ['django_unsaved_changes'],
    version = '0.6',
    description = 'UX improvements for admin',
    author = 'Nina Pavlich',
    author_email='nina@ninalp.com',
    url = 'https://github.com/ninapavlich/django-unsaved-changes',
    keywords = ['libraries', 'web development', 'cms', 'django', 'django-grappelli'],
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved',
        'Operating System :: OS Independent',
        'Programming Language :: Python'
    ]
)