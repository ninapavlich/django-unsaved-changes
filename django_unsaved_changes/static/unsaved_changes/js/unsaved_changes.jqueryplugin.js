/*!
 * nina@ninalp.com
 * TODOS:
 * - Reverting a checkbox doesn't re-check it
 * - Reverting a m2m value clears it
 */


;(function ( $, window, document, undefined ) {




    // Create the defaults once
    var pluginName = "unsavedChanges",
        defaults = {
            unsaved_changes_alert_message: 'Unsaved changes were detected. Are you sure you want to leave this page?',
            form_submitted_alert_message: 'We detected that the form was already submitted. Re-submitting the form or navigating away from the page may have unpredictable effects. Are you sure you want to continue?',
            persistant_data_detected_message: 'Unsaved data was detected and restored in the form below. <a class="clear-all-data" href="#">Click here to clear all the restored data</a>, or you can clear fields individually below.',
            persistant_data_cleared_message: 'Unsaved data has been cleared.',
            persistant_data_class: 'has_persistant_data',
            has_unsaved_data_class: 'has_unsaved_data',
            form_submitted_threshold: 250,
            ignore_types: []
            //['.ui-autocomplete-input']
            //['.ui-autocomplete-input', '.grp-autocomplete-hidden-field',  "[name='csrfmiddlewaretoken']", "[placeholder='Filter']", ".ckeditorwidget"] //"[type='file']",
        };

    // The actual plugin constructor
    function UnsavedChanges( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.form_was_submitted = false;
        this.form_submitted_time = null;

        this.init();
    }

    UnsavedChanges.prototype = {

        init: function() {
            var parent = this;


            this.form = $(this.element).find('form')[0];
            this.all_inputs = this.getAllEligibleInputs();
            this.initial_data = this.getFormValues(this.form);
      

            this.messages_container = $(this.element).find(".grp-messagelist")[0];
            if(this.options.use_persistant_storage){
                $(this.element).find('form').garlic({
                    onPersist: function ( elem, storedValue ) {
                        //
                    }
                });
                this.garlic_data = this.getFormValues(this.form);

                $(this.all_inputs).each(function(index, item) {
                    if(item.name && parent.fieldHasPersistantData(item)){

                        parent.applyPersistantStyle(item);
                    }
                });

                
                // window['garlic_data'] = this.garlic_data;

                if(this.formHasPersistantData()){
                    this.addInfoMessage(this.options.persistant_data_detected_message);
                }


                //Init CKEDITOR Plugin:
                // var parent = this;
                // setTimeout(function(){
                //     parent.initCKEditorIntegration();
                // }, 1000);
                

            }
            if(this.options.use_submitted_overlay){

                this.overlay = $('<div class="submitted-overlay-container">\
                    <div class="submitted-overlay-screen"></div>\
                    <div class="submitted-overlay">\
                        <h2>Saving...</h2>\
                        <div class="progress">\
                            <div class="indicator"></div>\
                        </div>\
                    <div>\
                </div>');
                $(this.form).after(this.overlay);
                $(this.overlay).fadeOut(0);


            }
        
            this.addListeners()
          

            this.render()
        },
        setProperty: function() {
          this.render()
        },

        render: function() {
            //Update view

            if(this.options.use_submitted_overlay){
                $(this.overlay).css("width", $(window).width());
                $(this.overlay).css("height", $([window]).height());
            }
        },
        getAllEligibleInputs: function(){
            var raw_inputs = $(this.form).find(":input[name]");
            var output = [];
            var parent = this;
            var ignore_types = parent.options.ignore_types;
            var ignore_types_length = ignore_types.length;
            $(raw_inputs).each(function(index, item) {
                
                var eligible_type = true;
                for(var k=0; k<ignore_types_length; k++){
                    var ignore_type = ignore_types[k];
                    if($(item).is(ignore_type)){
                        eligible_type = false;
                    }
                }
                if(eligible_type){
                    output.push(item);    
                }else{
                    // console.log("Type "+item.name+" not eligible")
                }

                
            });
            // console.log("there were "+raw_inputs.length+" raw inputs, but only "+output.length+" are eligible")
            return output;

        },
        clearAllRestoredData: function(){
            var parent = this;

            //Remove all fields that aren't explicitely defined in allow_defaults
            $(this.all_inputs).each(function(index, item) {
                // if($(item).hasClass(parent.options.persistant_data_class)){
                parent.clearRestoredDataForField(item);    
                // }                
            });
        },
        clearRestoredDataForField: function(field){
            
            
            var value = this.initial_data[field.name];
            this.removePersistantStyle(field);
            $(field).garlic( 'destroy' );
            this.setFieldValue(field, value);
            

        },
        formHasPersistantData: function(){
            //todo
            var areEqual = this.areObjectsEqual(this.initial_data, this.garlic_data, true);
            // console.log("persistant data equal? "+areEqual);
            return !areEqual;
        },
        fieldHasPersistantData: function(field){
            var same = this.initial_data[field.name] == this.garlic_data[field.name];

            if(same==false){
                if(this.initial_data[field.name] instanceof Array || this.garlic_data[field.name]){
                    same = this.areObjectsEqual(this.initial_data[field.name], this.garlic_data[field.name], true);
                }
            }

            // if(same==false){
            //     console.log("persistant value for "+field.name+" is unequal: initial "+this.initial_data[field.name]+" != garlic "+this.garlic_data[field.name])
            // }
            return !same
        },
        hasUnsavedChanges: function(){
            /*
                KNOWN ISSUES:
                * Changes in horizontal selector are not detected
                * Changes in CKEditor are not detected
            */
            this.current_data = this.getFormValues(this.form);
            // window['current_data'] = this.current_data;
            var areEqual = this.areObjectsEqual(this.initial_data, this.current_data, true);
            return !areEqual;
        },
        addListeners: function() {
            //bind events
            var parent = this;

            if(this.options.use_persistant_storage){

            }
            
            if(this.options.use_unsaved_changes_alert || this.options.use_submitted_alert){

                $(window).bind('beforeunload', function(event){

                    if(parent.options.use_unsaved_changes_alert && parent.form_was_submitted != true && parent.hasUnsavedChanges()){
                        return parent.options.unsaved_changes_alert_message;
                    }

                    var dt = (new Date()) - parent.form_submitted_time;

                    
                    if(parent.options.use_submitted_alert && parent.form_was_submitted == true && dt > parent.options.form_submitted_threshold){
                        return parent.options.form_submitted_alert_message;
                    }
                });

                $(this.form).bind('submit', function(event){
                    // event.preventDefault();
                    parent.form_was_submitted = true;
                    parent.form_submitted_time = new Date();
                });
            }
            if(this.options.use_submitted_overlay){
                $(this.form).bind('submit', function(event){
                    $(parent.overlay).fadeIn();
                });


            }

          

            $( window ).resize(function() {
                parent.render();
            });

            $(this.all_inputs).change(function(event){
              $(this).addClass(parent.options.has_unsaved_data_class)
              $(this).parents(".grp-autocomplete-wrapper-m2m").addClass(parent.options.has_unsaved_data_class)
            });
        },
        applyPersistantStyle: function(field){

            
            var parent = this;
            var tools = $('<div class="persistant-data-field-tools">\
                <a href="#" class="clear-persistant-data">Clear restored data for &ldquo;'+this.getPrettyName(field)+'&rdquo;</a></div>');

            var display_field = $(field).parents('.grp-cell, .grp-row, .grp-tr')[0];
            $(tools).find("a.clear-persistant-data").bind("click", function(event){
                event.preventDefault();
                parent.clearRestoredDataForField(field);
            });



            $(field).data('persistant-data-field-tools', tools);
            $(display_field).addClass(this.options.persistant_data_class);     
            $(display_field).append(tools);

            if($(field).hasClass('vForeignKeyRawIdAdminField') || $(field).hasClass('vManyToManyRawIdAdminField')){
                $(field).trigger("change")
            }



            
        },
        removePersistantStyle: function(field){

            var display_field = $(field).parents('.grp-cell, .grp-row, .grp-tr')[0];
            $(display_field).removeClass(this.options.persistant_data_class);     

            var tools = $(field).data('persistant-data-field-tools');
            $(tools).find("a.clear-persistant-data").unbind("click");
            $(tools).remove();
            $(field).attr('persistant-data-field-tools', null);
        },
        removeListeners: function() {
            //unbind events           
        },
        addSuccessMessage:function(text){
            this._addMessage(text, "success", true);
        },
        addInfoMessage:function(text){
            this._addMessage(text, "info", false);
        },
        addWarningMessage:function(text){
            this._addMessage(text, "error", false);            
        },
        _addMessage:function(text, cls, autohide){
            var parent = this;
            var message =$('<li class="dynamic grp-'+cls+'"><ul \
                class="grp-tools"><li><a href="#" class="grp-delete-handler" \
                title="Hide"></a></li></ul><div class="inner">'+text+'</div></li>');
            $(this.messages_container).append(message);

            $(message).find("a.grp-delete-handler").bind("click", function(event){
                event.preventDefault();
                $(message).slideUp();
            });

            $(message).find("a.clear-all-data").bind("click", function(event){
                event.preventDefault();
                parent.clearAllRestoredData();
                $(message).slideUp();
                parent.addSuccessMessage(parent.options.persistant_data_cleared_message)
            });

            

            if(autohide === true){
                setTimeout(function(){
                    $(message).slideUp();
                }, 10000)
            }
            
        },
        getFormValues: function(container){
            var output = {};
            
            var inputs = $(container).find(":input");

            //Remove all fields that aren't explicitely defined in allow_defaults
            $(inputs).each(function(index, item) {

                
                var value =$(item).val();
                var skip_item = String($(item).attr("type")).toLowerCase() == "checkbox" && item.checked==false;
                var is_select_multiple = $(item).attr("multiple") !== undefined;

            
                if( skip_item ){
                    
                    // console.log("skip this un-checked item..."+item.name);
                    //continue

                }else if(is_select_multiple){
                    var vals = []; 
                    $(item).find(':selected').each(function(i, selected){ 
                      vals[i] = $(selected).val(); 
                    });
                    output[item.name] = vals;

                }else{
                
                    if (output[item.name] !== undefined) {
                        if (!output[item.name].push) {
                            output[item.name] = [output[item.name]];
                        }
                        output[item.name].push(value || '');
                    } else {
                        output[item.name] = value || '';
                    } 
                }

                
            });

            return output;
        },

        setFieldValue: function(field, value){
            //TODO -- handle other field types...
            // console.log("set field value: "+value)

            var is_checkbox =  String($(field).attr("type")).toLowerCase() == "checkbox";

            if(is_checkbox){
                if(String(value).toLowerCase()=="on"){
                    $(field).prop('checked', true);    
                }else{
                    $(field).prop('checked', false);
                }
                
            }else{
                $(field).attr('value', value);
                $(field).val(value);
            }
            


            if($(field).hasClass('vForeignKeyRawIdAdminField') || $(field).hasClass('vManyToManyRawIdAdminField')){
                $(field).trigger("change")
            }

            
        },

        getPrettyName: function(field){
            var name = field.name;
            var pieces = name.split('-');
            var first_piece = pieces[pieces.length-1];
            var replaced_spaces = first_piece.replace(/_/g, ' ');
            return replaced_spaces;
        },

        /* Based on this: http://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects/16788517#16788517*/
        areObjectsEqual: function(x, y, allow_different_keys) {
            'use strict';
            var parent = this;

            if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
            // after this just checking type of one would be enough
            if (x.constructor !== y.constructor) { return false; }
            // if they are functions, they should exactly refer to same one (because of closures)
            if (x instanceof Function) { return x === y; }
            // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
            if (x instanceof RegExp) { return x === y; }
            if (x === y || x.valueOf() === y.valueOf()) { return true; }
            if (Array.isArray(x) && x.length !== y.length) { return false; }

            // if they are dates, they must had equal valueOf
            if (x instanceof Date) { return false; }

            // if they are strictly equal, they both need to be object at least
            if (!(x instanceof Object)) { return false; }
            if (!(y instanceof Object)) { return false; }

            // recursive object equality check
            var p = Object.keys(x);
            if(allow_different_keys==false){
                return Object.keys(y).every(function (i) {                
                    return p.indexOf(i) !== -1; 
                }) && p.every(function (i) { 
                    return parent.areObjectsEqual(x[i], y[i], allow_different_keys); 
                });    
            }else{
                return p.every(function (element, index, array) {
                    if(element != '' && element in y){
                        
                        var same = parent.areObjectsEqual(x[element], y[element], allow_different_keys);     
                        // if(same==false){
                        //     console.log(element+" values are unequal: "+x[element]+" != "+y[element])
                        // }
                        return same;
                    }else{
                        return true;
                    }                    
                });
            }
            
        },
        initCKEditorIntegration: function(){

            var parent = this;
            $(this.element).find("textarea").each(function(index, field) {
                if($(field).hasClass('ckeditorwidget')){
                    // console.log("init ckeditorwidget integration")

                    var editor_field = parent.getCKEditorInput(field);
                    
                    $(editor_field).bind("keyup focus change", function(event){
                        $(field).val( $(editor_field).html() )
                        $(field).garlic();
                    });

                }
            });
        },
        getCKEditorInput: function(field) {
            var editor_id = $(field).attr("id");
            try{
                var iframe = $("#"+editor_id).parent().find("iframe");
                var iframedoc = iframe[0].contentWindow.document;
                var body = $(iframedoc).find("body");
                return body;          
            }catch(e){return null;}
        }

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new UnsavedChanges( this, options ));
            }
        });
    };

})( grp.jQuery, window, document );

//$( document ).ready(function() {
//  $(".selector").pluginName();
//});


