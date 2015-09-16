from django.contrib import admin
from django.conf import settings

class UnsavedChangesAdmin(admin.ModelAdmin):

    change_form_template = "admin/django_unsaved_changes/change_form.html"


    def add_unsaved_changes_context(self, extra_context):

        try:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT'] = settings.UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT if not hasattr(self, "UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT") else self.UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT
        except:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT'] = False

        try:
            extra_context['UNSAVED_CHANGES_SUMBITTED_ALERT'] = settings.UNSAVED_CHANGES_SUMBITTED_ALERT if not hasattr(self, "UNSAVED_CHANGES_SUMBITTED_ALERT") else self.UNSAVED_CHANGES_SUMBITTED_ALERT
        except:
            extra_context['UNSAVED_CHANGES_SUMBITTED_ALERT'] = False

        try:
            extra_context['UNSAVED_CHANGES_SUBMITTED_OVERLAY'] = settings.UNSAVED_CHANGES_SUBMITTED_OVERLAY if not hasattr(self, "UNSAVED_CHANGES_SUBMITTED_OVERLAY") else self.UNSAVED_CHANGES_SUBMITTED_OVERLAY
        except:
            extra_context['UNSAVED_CHANGES_SUBMITTED_OVERLAY'] = False

        try:
            extra_context['UNSAVED_CHANGES_PERSISTANT_STORAGE'] = settings.UNSAVED_CHANGES_PERSISTANT_STORAGE if not hasattr(self, "UNSAVED_CHANGES_PERSISTANT_STORAGE") else self.UNSAVED_CHANGES_PERSISTANT_STORAGE
        except:
            extra_context['UNSAVED_CHANGES_PERSISTANT_STORAGE'] = False

        extra_context['DEBUG'] = settings.DEBUG

        return extra_context

    def change_view(self, request, object_id, form_url='', extra_context=None):
        
        extra_context = extra_context or {}
        extra_context = self.add_unsaved_changes_context(extra_context)

        return super(UnsavedChangesAdmin, self).change_view(request, object_id, form_url, extra_context)

    def add_view(self, request, form_url='', extra_context=None):

        extra_context = extra_context or {}
        extra_context = self.add_unsaved_changes_context(extra_context)
        
        return super(UnsavedChangesAdmin, self).add_view(request, form_url, extra_context)