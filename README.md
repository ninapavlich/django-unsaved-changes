# django-unsaved-changes

#Features

TODO

#Compatibility / Requirements

1. Django (last tested with 1.8.2)
2. django-grappelli (last tested with 2.6.5)
3. Chrome, Firefox, Safari, IE10+ (Essentially this list: http://caniuse.com/#feat=input-file-multiple)

#Installation

    pip install django-batch-uploader

##settings.py

    INSTALLED_APPS = (
      ...  
      'django_unsaved_changes',    
      ...
    )

##admin.py
  
Either extend the example admin:

	from django_unsaved_changes.admin import UnsavedChangesAdmin


	class MyModelAdmin(UnsavedChangesAdmin):

		pass

Or simply add the necessary template to your existing admin:
	
	class MyModelAdmin(UnsavedChangesAdmin):

		change_form_template = "admin/django_unsaved_changes/change_form.html"

 
#Screenshots

TODO