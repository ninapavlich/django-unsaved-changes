# django-unsaved-changes

#Features

1. (Optional) Alert admin when they are about to close a window that has 
	unsaved changes.
![Unload Notification](https://raw.github.com/ninapavlich/django-unsaved-changes/master/docs/screenshots/unload_notification.png)

2. (Optional) Display an overlay indicating that the form has been submitted 
	and is processing. This feature is in response to many admins that I've 
	worked with that were unsure that the form was being submitted and so 
	submitted it multiple times.
![Saving Overlay](https://raw.github.com/ninapavlich/django-unsaved-changes/master/docs/screenshots/saving_overlay.png)

3. (Optional) Restore changed field values if window is accidentally closed. 
	This feature uses garlic.js
![Garlic Notification](https://raw.github.com/ninapavlich/django-unsaved-changes/master/docs/screenshots/garlic_notification.png)

You can use any combination of these three features using the settings below, 
though at this point I don't recommend using the third feature in production.


#Compatibility / Requirements

1. Django (last tested with 1.8.2)
2. django-grappelli (last tested with 2.7.1)
3. Chrome, Firefox, Safari, IE9+ (TODO -- verify)

#Installation

    pip install django-unsaved-changes

##settings.py

    INSTALLED_APPS = (
      ...  
      'django_unsaved_changes',    
      ...
    )

	UNSAVED_CHANGES_USE_ALERT = True
	UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY = True
	UNSAVED_CHANGES_USE_PERSISTANT_STORAGE = False #not quite production ready

##admin.py
  
Either extend the example admin:

	from django_unsaved_changes.admin import UnsavedChangesAdmin


	class MyModelAdmin(UnsavedChangesAdmin):

		#Note: You may override settings on an individual admin view:
		# UNSAVED_CHANGES_USE_PERSISTANT_STORAGE = False
		# UNSAVED_CHANGES_USE_ALERT = False
		# UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY = False

Or simply add the necessary template and context variables to your existing admin view:
	
	class MyModelAdmin(UnsavedChangesAdmin):

		change_form_template = "admin/django_unsaved_changes/change_form.html"
 		
 		def change_view(self, request, object_id, form_url='', extra_context=None):
        
	        extra_context = extra_context or {}
	        extra_context['UNSAVED_CHANGES_USE_PERSISTANT_STORAGE'] = True
	        extra_context['UNSAVED_CHANGES_USE_ALERT'] = True
	        extra_context['UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY'] = True
	        return super(MyModelAdmin, self).change_view(request, object_id, form_url, extra_context)

#Known Issues

	* Garlic persistant data detection not quite working with Grappelli M2M/FK widgets, Grappelli Horizontal widget, CKEditor widget, Imagekit Cropper