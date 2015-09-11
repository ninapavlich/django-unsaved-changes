from django.contrib import admin

class UnsavedChangesAdmin(admin.ModelAdmin):

    change_form_template = "admin/django_unsaved_changes/change_form.html"

    class Media:        
        css = {
            "all": ('unsaved_changes/css/unsaved_changes.css',)
        }
        js = [
            'unsaved_changes/js/vendor/garlic.js',
            'unsaved_changes/js/unsaved_changes.js' 
        ]