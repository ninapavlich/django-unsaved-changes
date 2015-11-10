from setuptools import setup, find_packages

setup(
    name = 'django-unsaved-changes',
    version = '0.9',
    author = 'Nina Pavlich',
    author_email='nina@ninalp.com',
    url = 'https://github.com/ninapavlich/django-unsaved-changes',
    license = "MIT",

    description = 'UX improvements for admin',
    keywords = ['libraries', 'web development'],

    include_package_data = True,
    packages = ['django_unsaved_changes'],
    
    classifiers=[
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: Python'
    ]
)