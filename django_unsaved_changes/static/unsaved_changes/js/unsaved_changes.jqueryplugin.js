/*!
 * nina@ninalp.com
 */

;(function ( $, window, document, undefined ) {


    // Create the defaults once
    var pluginName = "unsavedChanges",
        defaults = {
            alert_message: 'Unsaved changes were detected. Are you sure you want to leave this page?',
            persistant_data_detected_message: 'Unsaved was detected and restored in the form below. <a class="clear-all-data" href="#">Click here to clear all the restored data</a>, or you can clear fields individually below.',
            persistant_data_cleared_message: 'Unsaved data has been cleared.',
            persistant_data_class: 'has_persistant_data',
            has_unsaved_data_class: 'has_unsaved_data'
        };

    // The actual plugin constructor
    function UnsavedChanges( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;



        this.init();
    }

    UnsavedChanges.prototype = {

        init: function() {
            var parent = this;


            this.form = $(this.element).find('form')[0];
            this.all_inputs = $(this.form).find(":input");
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

                
                window['garlic_data'] = this.garlic_data;

                if(this.formHasPersistantData()){
                    this.addInfoMessage(this.options.persistant_data_detected_message);
                }


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
                $(this.overlay).css("height", $(window).height());
            }
        },
        clearAllRestoredData: function(){
            var parent = this;

            //Remove all fields that aren't explicitely defined in allow_defaults
            $(this.all_inputs).each(function(index, item) {
                if($(item).hasClass(parent.options.persistant_data_class)){
                    parent.clearRestoredDataForField(item);    
                }                
            });
        },
        clearRestoredDataForField: function(field){
            var value = this.initial_data[field.name];
            this.removePersistantStyle(field);
            this.setFieldValue(field, value);
            $(field).garlic( 'destroy' );
        },
        formHasPersistantData: function(){
            //todo
            var areEqual = this.areObjectsEqual(this.initial_data, this.garlic_data, true);
            // console.log("persistant data equal? "+areEqual);
            return !areEqual;
        },
        fieldHasPersistantData: function(field){
            var same = this.initial_data[field.name] == this.garlic_data[field.name];
            // if(same==false){
            //     console.log("persistant value for "+field.name+" is unequal: "+this.initial_data[field.name]+" != "+this.garlic_data[field.name])
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
            var areEqual = this.areObjectsEqual(this.initial_data, this.current_data, true);
            return !areEqual;
        },
        addListeners: function() {
            //bind events
            var parent = this;

            if(this.options.use_persistant_storage){

            }
            if(this.options.use_alert){
                $(window).bind('beforeunload', function(event){
                    if(parent.form_was_submiited != true && parent.hasUnsavedChanges()){
                        return parent.options.alert_message;
                    }         
                });

                $(this.form).bind('submit', function(event){
                    parent.form_was_submiited = true;
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
                <a href="#" class="clear-persistant-data">Clear Persistant Data</a></div>');

            var display_field = field
            if($(field).hasClass("grp-autocomplete-hidden-field")){
                display_field = $(field).parents(".grp-autocomplete-wrapper-m2m")[0]
            }

            $(tools).find("a.clear-persistant-data").bind("click", function(event){
                event.preventDefault();
                parent.clearRestoredDataForField(field);
            });
            $(field).data('persistant-data-field-tools', tools);

            $(display_field).addClass(this.options.persistant_data_class);     
            $(display_field).after(tools);
            
        },
        removePersistantStyle: function(field){

            var display_field = field
            if($(field).hasClass("grp-autocomplete-hidden-field")){
                display_field = $(field).parents(".grp-autocomplete-wrapper-m2m")[0]
            }
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

                
                if( skip_item ){
                    
                    // console.log("skip this un-checked item..."+item.name);
                    //continue

                }else{
                    // console.log($(item).attr("type")+" "+item.name+" = "+value+" "+item.checked);
                
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
            $(field).attr('value', value)
            $(field).val(value);
            window['testing_field'] = field
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

})( jQuery, window, document );

//$( document ).ready(function() {
//  $(".selector").pluginName();
//});


