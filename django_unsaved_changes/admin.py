from django.contrib import admin
from django.conf import settings

class UnsavedChangesAdmin(admin.ModelAdmin):

    change_form_template = "admin/django_unsaved_changes/change_form.html"


    def change_view(self, request, object_id, form_url='', extra_context=None):
        
        extra_context = extra_context or {}
        extra_context['UNSAVED_CHANGES_USE_PERSISTANT_STORAGE'] = settings.UNSAVED_CHANGES_USE_PERSISTANT_STORAGE if not hasattr(self, "UNSAVED_CHANGES_USE_PERSISTANT_STORAGE") else self.UNSAVED_CHANGES_USE_PERSISTANT_STORAGE
        extra_context['UNSAVED_CHANGES_USE_ALERT'] = settings.UNSAVED_CHANGES_USE_ALERT if not hasattr(self, "UNSAVED_CHANGES_USE_ALERT") else self.UNSAVED_CHANGES_USE_ALERT
        extra_context['UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY'] = settings.UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY if not hasattr(self, "UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY") else self.UNSAVED_CHANGES_USE_SUBMITTED_OVERLAY
        
        return super(UnsavedChangesAdmin, self).change_view(request, object_id, form_url, extra_context)