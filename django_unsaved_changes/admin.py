import json

from django.contrib import admin
from django.conf import settings
from django.http import HttpResponse

from django.contrib.admin.options import TO_FIELD_VAR
from django.contrib.admin.utils import unquote


class UnsavedChangesAdminMixin(object):

    change_form_template = "admin/django_unsaved_changes/change_form.html"

    def add_unsaved_changes_context(self, extra_context):

        try:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT'] = settings.UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT if not hasattr(
                self, "UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT") else self.UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT
        except:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_ALERT'] = False

        try:
            extra_context['UNSAVED_CHANGES_SUMBITTED_ALERT'] = settings.UNSAVED_CHANGES_SUMBITTED_ALERT if not hasattr(
                self, "UNSAVED_CHANGES_SUMBITTED_ALERT") else self.UNSAVED_CHANGES_SUMBITTED_ALERT
        except:
            extra_context['UNSAVED_CHANGES_SUMBITTED_ALERT'] = False

        try:
            extra_context['UNSAVED_CHANGES_SUBMITTED_OVERLAY'] = settings.UNSAVED_CHANGES_SUBMITTED_OVERLAY if not hasattr(
                self, "UNSAVED_CHANGES_SUBMITTED_OVERLAY") else self.UNSAVED_CHANGES_SUBMITTED_OVERLAY
        except:
            extra_context['UNSAVED_CHANGES_SUBMITTED_OVERLAY'] = False

        try:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_VISUALS'] = settings.UNSAVED_CHANGES_UNSAVED_CHANGES_VISUALS if not hasattr(
                self, "UNSAVED_CHANGES_UNSAVED_CHANGES_VISUALS") else self.UNSAVED_CHANGES_UNSAVED_CHANGES_VISUALS
        except:
            extra_context['UNSAVED_CHANGES_UNSAVED_CHANGES_VISUALS'] = False

        try:
            extra_context['UNSAVED_CHANGES_AJAX_SAVE'] = settings.UNSAVED_CHANGES_AJAX_SAVE if not hasattr(
                self, "UNSAVED_CHANGES_AJAX_SAVE") else self.UNSAVED_CHANGES_AJAX_SAVE
        except:
            extra_context['UNSAVED_CHANGES_AJAX_SAVE'] = False

        try:
            extra_context['UNSAVED_CHANGES_PERSISTANT_STORAGE'] = settings.UNSAVED_CHANGES_PERSISTANT_STORAGE if not hasattr(
                self, "UNSAVED_CHANGES_PERSISTANT_STORAGE") else self.UNSAVED_CHANGES_PERSISTANT_STORAGE
        except:
            extra_context['UNSAVED_CHANGES_PERSISTANT_STORAGE'] = False

        extra_context['DEBUG'] = settings.DEBUG

        return extra_context

    def change_view(self, request, object_id, form_url='', extra_context=None):

        extra_context = extra_context or {}
        extra_context = self.add_unsaved_changes_context(extra_context)

        return super(UnsavedChangesAdminMixin, self).change_view(request, object_id, form_url, extra_context)

    def add_view(self, request, form_url='', extra_context=None):

        extra_context = extra_context or {}
        extra_context = self.add_unsaved_changes_context(extra_context)

        return super(UnsavedChangesAdminMixin, self).add_view(request, form_url, extra_context)

    def _changeform_view(self, request, object_id, form_url, extra_context):

        unsaved_changes_ajax = request.POST.get('unsaved_changes_ajax', False)
        if unsaved_changes_ajax:

            print("unsaved_changes_ajax: " + unsaved_changes_ajax)

            to_field = request.POST.get(
                TO_FIELD_VAR, request.GET.get(TO_FIELD_VAR))
            if to_field and not self.to_field_allowed(request, to_field):
                raise DisallowedModelAdminToField(
                    "The field %s cannot be referenced." % to_field)

            model = self.model
            opts = model._meta

            if request.method == 'POST':

                obj = self.get_object(request, unquote(object_id), to_field)

                if not self.has_change_permission(request, obj):
                    print("TODO -- return permission error")

                if obj is None:
                    print("TODO -- return object is gone error")

                ModelForm = self.get_form(request, obj)

                # Validate Single Form:
                form = ModelForm(request.POST, request.FILES, instance=obj)
                if form.is_valid() == False:
                    data = {
                        'field_errors': form.errors,
                        'non_field_errors': form.non_field_errors()
                    }
                    response = HttpResponse(json.dumps(
                        data), content_type='application/json')
                    response.status_code = 400
                    return response

                # TODO -- validate inlines
                # formsets, inline_instances = self._create_formsets(
                #     request, new_object, change=not add)
                # if all_valid(formsets) == False:

                #     data = {'non_field_errors': "ERROR IN FORMSET..."}
                #     response = HttpResponse(json.dumps(
                #         data), content_type='application/json')
                #     response.status_code = 400

        return super(UnsavedChangesAdminMixin, self)._changeform_view(request, object_id, form_url, extra_context)

class UnsavedChangesAdmin(UnsavedChangesAdminMixin, admin.ModelAdmin):

    pass
