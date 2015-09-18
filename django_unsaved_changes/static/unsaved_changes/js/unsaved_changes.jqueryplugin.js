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
            ignore_types: [],
            ignore_keys: ["old"],
            debug: false,
            initilize_delay: 1000
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
            
      
            
            setTimeout(function(){
                parent.initAfterDelay();
            }, this.options.initilize_delay);
            
        },
        initAfterDelay: function(){
            
            var parent = this;

            this.initial_data = this.getFormValues(true);

            this.messages_container = $(this.element).find(".grp-messagelist")[0];

            
            if(this.options.show_unsaved_changes_visuals){

                $(this.all_inputs).each(function(index, item_name) {
                    var item = parent.getField(item_name);
                    
                    var inputs = parent.getFieldInputs(item_name);
                    var display_field = parent.getFieldDisplay(item);

                    // console.log("found "+inputs.length+" inputs for "+item_name)

                    $(inputs).each(function(index, input) {
                        
                        $(input).bind("keyup focus change", function(event){

                            var same = parent.areObjectsEqual(parent.initial_data[item_name], parent.getFieldValue(item_name), parent.options.ignore_keys);
                            
                            if(!same){
                                // console.log(item_name+" change? ("+parent.initial_data[item_name]+") vs ("+parent.getFieldValue(item_name)+")")
                                $(display_field).addClass(parent.options.has_unsaved_data_class);    
                            }else{
                                // console.log("same same "+parent.getFieldValue(item_name))
                                $(display_field).removeClass(parent.options.has_unsaved_data_class);    
                            }
                            
                            
                        });
                    });

                    
                });

            }
            if(this.options.use_persistant_storage){
                
                $(this.element).find('form').garlic();
                this.garlic_data = this.getFormValues();

                $(this.all_inputs).each(function(index, item_name) {
                    var item = parent.getField(item_name);

                    if(item_name && parent.fieldHasPersistantData(item)){

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
        
            this.addListeners();
          

            this.render();

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
                    output.push(item.name); 
                    
                    // if(parent.options.debug){
                    //     console.log("Unsaved Changes :: Adding Input "+item.name) 
                    // }

                }else{
                    if(parent.options.debug){
                        console.log("Unsaved Changes :: Input "+item.name+" not eligible") 
                    }
                    
                }

                
            });
            // console.log("there were "+raw_inputs.length+" raw inputs, but only "+output.length+" are eligible")
            return output;

        },
        getFormValues: function(debug){
            if(typeof(debug) == 'undefined'){
                debug = false;
            }
            var output = {};
            var parent = this;
            
            
            $(this.all_inputs).each(function(index, item_name) {
                output[item_name] = parent.getFieldValue(item_name);
                
            });

            return output;
        },
        getField: function(name, allow_multiple){
            if(typeof(allow_multiple) === 'undefined'){
                allow_multiple = false;
            }

            var selector = "[name='"+name+"']";
            // console.log("selector: "+selector+" "+$(this.form).find(selector).length+" allow_multiple? "+allow_multiple)
            if(allow_multiple){
                return $(this.form).find(selector);
            }else{
                return $(this.form).find(selector)[0];
            }
            
        },
        getFieldContainer: function(item){
            //returns the container around the input
            return $(item).parents('.grp-cell, .grp-row, .grp-tr').first();
        },
        getFieldDisplay: function(item){
            //returns the container around the input
            return $(item).parents('.grp-cell, .grp-row, .grp-td').first();
        },
        getFieldInputs: function(item_name){
            //returns the actual input/inputs that change
            var items = this.getField(item_name, true);
            var item_list = $(items).toArray()
            var is_ckeditor = $(items).hasClass('ckeditorwidget');
            var is_horizontal_select_multiple = $(items).attr("multiple") !== undefined && $(items).parents('.grp-related-widget-wrapper').length > 0;

            

            if(is_ckeditor){

                try{

                    var editor_container_id = $(CKEDITOR.instances['id_'+item_name].container).attr("id");
                    var iframe = $(this.form).find("#"+editor_container_id).find("iframe")[0];
                    var body = $(iframe.contentWindow.document).find("body")
                    item_list.push(body);
                      
                }catch(e){}
                

            }else if(is_horizontal_select_multiple){
                var old_select = this.getField(item_name+"_old")
                item_list.push(old_select);

                var links = $(items).parents('.grp-related-widget-wrapper').find('a').toArray();
                item_list = item_list.concat(links);
            }
            // console.log("items? "+item_name+" is_ckeditor? "+is_ckeditor+" is_horizontal_select_multiple? "+is_horizontal_select_multiple+" = "+item_list.length+" "+items)
            return item_list;     
        },


        getFieldValue: function(field_name, debug){
            /*
                Input Types:
                - text / password / 
                - textarea
                - select
                - multiple select
                - radiogroup / checkgroup
                - checkbox
                - file field
            */

            if(typeof(debug) == 'undefined'){
                debug = false;
            }
            var output = {};
            var parent = this;
            

            var matching_fields = this.getField(field_name, true);

            if(matching_fields.length > 1){
                //This is a multi-value item...
                value = [];
                for(var k=0; k<matching_fields.length; k++){
                    var matching_field = matching_fields[k];
                    value.append($(matching_field).val());
                }

                if(debug){
                    console.log("multi value "+field_name+" = "+value)    
                }
                
                return value;

            }else{

                var item = $(matching_fields).first();
                var value = $(item).val();
                var is_unchecked_checkbox = String($(item).attr("type")).toLowerCase() == "checkbox" && $(item).is(':checked')==false;
                var is_select_multiple = $(item).attr("multiple") !== undefined;
                var is_horizontal_select_multiple = $(item).attr("multiple") !== undefined && $(item).parents('.grp-related-widget-wrapper').length > 0;
                var is_ckeditor = $(item).hasClass('ckeditorwidget');


                if( is_unchecked_checkbox ){
                        
                    value = '';

                }else if(is_horizontal_select_multiple){
                    value = []; 
                    //with GRP, it doesn't get selected until unload
                    $(item).find('option').each(function(i, selected){ 
                      value[i] = $(selected).val(); 
                    });

                }else if(is_select_multiple){

                    value = []; 
                    $(item).find(':selected').each(function(i, selected){ 
                      value[i] = $(selected).val(); 
                    });
                    

                }else if(is_ckeditor){
                    
                    try{
                        var editor_field = parent.getCKEditorInput(item);
                        value = editor_field.getData();
                    }catch(e){}
                    
                }

                return value;

            }

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

        clearAllRestoredData: function(){
            var parent = this;

            //Remove all fields that aren't explicitely defined in allow_defaults
            $(this.all_inputs).each(function(index, item_name) {
                var item = parent.getField(item_name);
                var display_field = parent.getFieldDisplay(item);

                if($(display_field).hasClass(parent.options.persistant_data_class)){
                    parent.clearRestoredDataForField(item);    
                }                
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
            var areEqual = this.areObjectsEqual(this.initial_data, this.garlic_data, this.options.ignore_keys);
            return !areEqual;
        },
        fieldHasPersistantData: function(field){
            var same = this.initial_data[field.name] == this.garlic_data[field.name];

            if(same==false){
                if(this.initial_data[field.name] instanceof Array || this.garlic_data[field.name]){
                    same = this.areObjectsEqual(this.initial_data[field.name], this.garlic_data[field.name], this.options.ignore_keys);
                }
            }

            if(same==false && this.options.debug){
                console.log("Unsaved Changes :: Persistant value for "+field.name+" is unequal: initial "+this.initial_data[field.name]+" != garlic "+this.garlic_data[field.name])
            }
            return !same
        },
        hasUnsavedChanges: function(){
            /*
                KNOWN ISSUES:
                * Changes in horizontal selector are not detected
                * Changes in CKEditor are not detected
            */
            this.current_data = this.getFormValues();
            // window['current_data'] = this.current_data;
            var same = this.areObjectsEqual(this.initial_data, this.current_data, this.options.ignore_keys);
            if(same==false && this.options.debug){
                console.log("Unsaved Changes :: Form is UNEQUAL")
            }else if(same==true && this.options.debug){
                console.log("Unsaved Changes :: Form is EQUAL")
            }
            return !same;
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
                    parent.hasUnsavedChanges();

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


        },
        applyPersistantStyle: function(field){

            
            var parent = this;
            var tools = $('<div class="persistant-data-field-tools">\
                <a href="#" class="clear-persistant-data">Clear restored data for &ldquo;'+this.getPrettyName(field)+'&rdquo;</a></div>');

            var display_field = parent.getFieldDisplay(field);
            var container_field = parent.getFieldContainer(field);
            $(tools).find("a.clear-persistant-data").bind("click", function(event){
                event.preventDefault();
                parent.clearRestoredDataForField(field);
            });



            $(field).data('persistant-data-field-tools', tools);
            $(display_field).addClass(this.options.persistant_data_class);     
            $(container_field).append(tools);

            if($(field).hasClass('vForeignKeyRawIdAdminField') || $(field).hasClass('vManyToManyRawIdAdminField')){
                $(field).trigger("change")
            }



            
        },
        removePersistantStyle: function(field){

            var display_field = this.getFieldDisplay(field);
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
        
        /* Based on this: http://stackoverflow.com/questions/201183/how-to-determine-equality-for-two-javascript-objects/16788517#16788517*/
        areObjectsEqual: function(x, y, ignore_keys) {
            'use strict';
            var parent = this;

            if (x === null || x === undefined || y === null || y === undefined) { 
                if(parent.options.debug && x !== y){
                    console.log("Unsaved Changes :: UNEQUAL undefined "+x+" vs "+y);
                }
                return x === y; 
            }
            // after this just checking type of one would be enough
            if (x.constructor !== y.constructor) { 
                if(parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL constructor "+x+" vs "+y);
                }
                return false; 
            }
            // if they are functions, they should exactly refer to same one (because of closures)
            if (x instanceof Function) { 
                if(parent.options.debug && x !== y){
                    console.log("Unsaved Changes :: UNEQUAL function "+x+" vs "+y);
                }
                return x === y; 
            }
            // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
            if (x instanceof RegExp) { return x === y; }
            if (x === y || x.valueOf() === y.valueOf()) { return true; }
            if (Array.isArray(x) && x.length !== y.length) { 
                if(parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL array "+x+" vs "+y);
                }
                return false; 
            }

            // if they are dates, they must had equal valueOf
            if (x instanceof Date) { 
                if(parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL date "+x+" vs "+y);
                }
                return false; 
            }

            // if they are strictly equal, they both need to be object at least
            if (!(x instanceof Object)) { 
                if(parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL key "+x+" vs "+y);
                }
                return false; 
            }
            if (!(y instanceof Object)) { 
                if(parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL key "+y+" vs "+x);
                }
                return false; 
            }

            // recursive object equality check
            var x_keys = Object.keys(x);
            var y_keys = Object.keys(y);

            


            return Object.keys(y).every(function (i) {                
                
                var eligible = parent.isEligibleKey(i, ignore_keys);
                if(eligible==false && parent.options.debug){
                    console.log("Unsaved Changes :: INELIGIBLE key "+i);
                }
                if(eligible==false){return true;}

                var xindex = x_keys.indexOf(i);
                var same = xindex !== -1;
                if(same==false && parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL - Y doesn't have key "+i+" "+xindex);
                }

                return same;

            }) && Object.keys(x).every(function (i) {                
                
                
                var eligible = parent.isEligibleKey(i, ignore_keys);
                if(eligible==false && parent.options.debug){
                    console.log("Unsaved Changes :: INELIGIBLE key "+i);
                }
                if(eligible==false){return true;}

                var yindex = y_keys.indexOf(i);
                var same = yindex !== -1;
                if(same==false && parent.options.debug){
                    console.log("Unsaved Changes :: UNEQUAL - X doesn't have key "+i+" "+yindex);
                }

                return same;

            }) && x_keys.every(function (i) { 
                var eligible = parent.isEligibleKey(i, ignore_keys);
                if(eligible==false && parent.options.debug){
                    console.log("Unsaved Changes :: INELIGIBLE key "+i);
                }
                if(eligible==false){return true;}

                return parent.areObjectsEqual(x[i], y[i], ignore_keys); 
            }) && y_keys.every(function (i) { 
                var eligible = parent.isEligibleKey(i, ignore_keys);
                if(eligible==false && parent.options.debug){
                    console.log("Unsaved Changes :: INELIGIBLE key "+i);
                }
                if(eligible==false){return true;}

                return parent.areObjectsEqual(x[i], y[i], ignore_keys); 
            });
            
            
        },
        isEligibleKey: function(key_name, ignore_keys){
            // console.log("key_name: "+key_name+" "+key_name.indexOf('old')+" keys? "+ignore_keys)
            for(var k=0; k<ignore_keys.length; k++){
                var ignore_key = ignore_keys[k];
                var ignoreRegExp = new RegExp(ignore_key);

                if (ignoreRegExp.test(key_name)) {
                    return false;
                }
            }
            return true;
        },
        initCKEditorIntegration: function(){

            var parent = this;
            $(this.element).find("textarea").each(function(index, field) {
                if($(field).hasClass('ckeditorwidget')){
                    // console.log("init ckeditorwidget integration")
                    if(parent.options.debug){
                        console.log("Unsaved Changes :: Init CKEditor Integration for "+field.name);
                    }

                    var editor_field = parent.getCKEditorInput(field);
                    
                    if(editor_field!=null){
                        $(editor_field.container).bind("keyup focus change", function(event){
                            $(field).val( $(editor_field).getData() )
                            $(field).garlic();

                            if(parent.options.debug){
                                console.log("Unsaved Changes :: Re-Garlic CKEditor Integration for "+field.name);
                            }
                        });
                    }
                }
            });
        },
        getCKEditorInput: function(field) {

            try{
                var editor_id = $(field).attr("id");
                return CKEDITOR.instances[editor_id];
                      
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


