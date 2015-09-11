from django.contrib import admin

class UnsavedChangesAdmin(admin.ModelAdmin):

    change_form_template = "admin/django_unsaved_changes/change_form.html"
