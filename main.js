 $(window).load(function(){ app.init(); });

// BLOCK EXECUTION ON InternetExplorer < 10
var myNav = navigator.userAgent.toLowerCase();
var is_iExplorer =  (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
if( is_iExplorer && is_iExplorer < 10 ){ 
	throw new error("BLOCKING ! BROWSER NOT SUPPORTED")
	alert("Atención : El navegador que estás usando (iExplorer "+is_iExplorer+") corresponde a una versión demasiado antigua. Actualizalo o usa un navegador mas moderno.")
}

/** GLOBAL VARS/OBJECTS/METHODS **/
var app;
var _ASYNC_ = "[ASYNC]"; 
var _QUERY_RESPONSE_ = "82f107ac-f951-af5b-5dd1-a45b75bb0e3f-9b2a14e1-8f98-4d6a-e1a8-cc8d254bcffb";
var _BLOCK_ = _FORCE_ = _ALL_ = undefined;

// implementation for Object.keys() ( applicable only if not available natively in browser )
// Return array with all keys in provided object
if(!Object.keys){
    Object.keys = function (obj) {
        var keys = [];
        for(var k in obj){
 	        if (Object.prototype.hasOwnProperty.call(obj, k))  keys.push(k);
        }
        return keys;
    };
};

// Implementation for Array.reduce()  ( applicable only if not available natively in browser )
if (!Array.prototype.reduce) {
	Array.prototype.reduce = function(callback /*, initialValue*/) {
    'use strict';
    if (this == null)  throw new TypeError('Array.prototype.reduce called on null or undefined');
    if (typeof callback !== 'function')  throw new TypeError(callback + ' is not a function');
    var t = Object(this), len = t.length >>> 0, k = 0, value;
    if (arguments.length == 2) value = arguments[1];
    else {
      while (k < len && !(k in t))   k++; 
      if (k >= len) throw new TypeError('Reduce of empty array with no initial value');
      value = t[k++];
    }
    for (; k < len; k++) {
      if (k in t)  value = callback(value, t[k], k, t);
    }
    return value;
  };
}

$(document).ready(function(){
	app = {
		/**
		 * app.config : Application configuration directives 
		 */
		config : {
			url 					: "/ajax/",		// relative path to ajax handler
			log_level 				: 5,			// discarg higher-leveled logs 
													// (default log: 1, deep log:2, ultradeep log:3)
			log_levels_colors 		: [ "#CA1AA0", 	// color palette for deeper log levels
										"#99257D",
										"#7A2666",
										"#5B254E",
										"#402038"],
			log_console				: true,			// enable/disable  console output
			log_queries				: true,			// log ajax queryes and server responses
			log_save				: true,			// enable/disable history log in array
			log_max_length			: 300, 			// max string size to log  (0 for no limit)
													// engine will use provided value +6 extra chars for  " {...}"
			log_save_max_length		: 300, 			// max string size to log save  (0 for no limit)
													// engine will use provided value +6 extra chars for  " {...}"
			log_save_max_items		: 5,			// max log items to store in log array (0 for no limit),
			block_on_min_width 		: true, 		// enable/disable screen locking when minimun width is detected
			width_min_limit		 	: 965, 			// set minimum width
			autoscroll 				: false,		// enable / disable autoscroll

			file_max_sixe 			: 1000000		// 1MB max filesize = 1000000
		},
		// Store current session user data
		session : {
			log 		: [],
			entity 		: {},
			user 		: {},
			pagination 	: {}
		},
		//
		construct: {},
		/**
		 * [common description]
		 * @type {Object}
		 */
		common : {},
		//
		view : {},
		//
		scroll: {
			container: {},
			init: function(container){
				// initialize scrollbar
				app.scroll.container = document.getElementById(container);
				Ps.initialize(app.scroll.container, {
					wheelSpeed: 2,
				  	wheelPropagation: true,
				  	minScrollbarLength: 20
				});
				// window resi<ze listener for scrollbar upodate
				$(window).off("resize").on('resize', function(e){
					return app.scroll.update();
				});
				return true;
			},
			update: function(){
				Ps.update(app.scroll.container);
			},
			to: function(pos){
				if(app.config.autoscroll == false) return false;
				var pos = (pos === undefined) ? 0 : pos;
				$(app.scroll.container).animate({
                     scrollTop: pos
                 }, 500, function(){ app.scroll.update() });
				app.scroll.update();
				return true;
			}
		},
		//
		init : function(){
			app.log("app.init() : App Initialization...");
			// recolect session data
			$.extend( app.session.user,  		window._server.userData );
			$.extend( app.session.pagination,  	window._server.pagination );
			$.extend( app.session.entity,  		window._server.entity );
			
			// dump imported session data in console
			app.log("app.init() : Session Data Imported :", "groupCollapsed");
			app.log( JSON.stringify(app.session, null, '  ') );
			app.log( "", "groupEnd");

			// clean : delete original Session object
			window._server = undefined;
			delete window._server;

			// init scrollbar and windows resize handler
			app.scroll.init("body-container");
			
			// set viewport blocking on minimum size allowed observer 
			$(window).off("resize").on('resize', function(e){
				if(app.config.block_on_min_width && $(document).width() < app.config.width_min_limit ){
					$("#insuficientResolutionWarning").fadeIn();
				}else $("#insuficientResolutionWarning").fadeOut();
				return;
			});

			// set form validator defaults
			jQuery.validator.setDefaults({ errorElement: 'p'});

			// if panel template is declared, build panel
			if( $( "#content-panel-template").length ) app.panel.init();

			// give some time to load initial data, before enable autoscroll
			// to garantee that user begins in top of page 
			setTimeout( function(){ app.config.autoscroll = true } , 3000);

			// if custom init is declared for current view, call it.
			if( typeof app.view.init === "function" ){
				app.log("app.init(): Executing custom view.init() function...", "info");
				app.view.init();
			} else app.log("app.init(): Current view has no custom init() function declared.", "warn");
			//
			//Set a regular interval for fixing any scrollbar issue
			setInterval( function(){ app.scroll.update() } , 10000) ;

			// transition on page exit
			window.onbeforeunload = function(event) {
  				app.scroll.to(0);
  				app.loader("show");
	  			return null;
  			};
			
			// open panel on new item Button click 
			$('#show_new_item_form').off("click").on("click", function(){ app.panel.open("add", null ) });

			return;
		}, 
		/**
		 * app.log(): Manage information & debugging , output messages displayed in console. 
		 * If requested method is not supported by browser, uses "log" traditional method.
		 * Will apply app.config settings about log history storing, and log messages resizing.
		 * @param  (*) 			data     	Mesage, object, array, number.... to display in console.
		 * @param  (string) 	log_type 	Method to execute ( log | warn | info | error )
		 * @param  (string) 	css 	 	CSS string used in data message with markup (eg: data="%c My mesage"  css="color:grey;")
		 * 
		 * @return (boolean)  				Returns true if message can be displayed, or false, if logging 
		 *                                	has been disabled in app.config directives.
		 */
		log : function( data , log_type, css ){ 
			var log_type = log_type || "log";
			var css = css || "";

			// preprocecing deep log requests
			if(log_type.isInteger){
				// discard all logs that are defgined in superior log-levels  
				if( log_type > app.config.log_level ) return false;
				// apply format to >1 deeper levels and force string
				else if(typeof data != "string") data= JSON.stringify(data);
				log_type = "log";
				data = "%c " + data;
				css = "color :" + app.config.log_levels_colors[log_type] + ";" ;
			}

			// save log item into log history array (if allowed)
			if(app.config.log_save){
				var _d = data;
				// force item to be a STRING (or number)
				if(typeof _d != "string" && typeof _d !="number" ) _d = JSON.stringify(_d);
				//apply string limits (if setted & required)
				if(app.config.log_save_max_length && _d.length > app.config.log_save_max_length ) _d = _d.substring( 0, app.config.log_save_max_length ) + " {...}";
				// save into log array history
				app.session.log.push(_d)
				// apply log array history, size limits (if setted & required)
				if(app.config.log_save_max_items && app.session.log.length > app.config.log_save_max_items ) app.session.log.shift();
			} 
			
			// return if log is disabled in config
			if( !app.config.log_console ) return false;
			else{
				// resize data length when it's setted&required, and data is a string
				if(app.config.log_max_length && typeof data == "string" && data.length > app.config.log_max_length ) data =  _d.substring( 0, app.config.log_max_length ) + " {...}";

				// default value for log ( when console method not supported by browser )
				if( typeof log_type != "string" || typeof console[log_type] != "function" ){
					console.warn("app.log() : WARNING! Unknown console method provided : '"+log_type+"' . Using default method : 'log'.");
					log_type = "log";
				}

				console[log_type](data, css);
				return true;
			}
		},
		/**
		 * app.loader() : Loader floating element Manager.
		 * @param  (string) 	action     	"show" (default) | "hide" | "update" | "unlock"
		 * @param  (string) 	msg        	Text to display under the loader
		 * @param  (boolean) 	fixed_flag 	If true, loader will be fixed, until "unlock" call.
		 *                                	Will ignore "hide" requests. Accepts "update"
		 *
		 * @return (boolean)    			Returns false, when requested action can't be executed.
		 *									Returns true when actions can be executed.  
		 */                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
		loader: function(action, msg, fixed_flag){
		
			switch(action){
				case "show":
					if( $("#loader_box").is("data-loader-unfolded" ) ) break;
					$("#loader_box_courtain").fadeIn("slow");
					$("#loader_box").attr("data-loader-unfolded","true");
					break;
				case "hide":
					setTimeout( function(){ 
						$("#loader_box").removeAttr("data-loader-unfolded") 
						if( $("#loader_box").attr("data-loader-unfolded" ) == undefined )  $("#loader_box_courtain").fadeOut();
					},1000);
					break;
				default:
					break;
			}
			/*
			var action 		= action || undefined;
			var msg 		= msg || undefined;
			
			if( action == "update" ){
				// set new messge if setted
				if(typeof msg == "undefined") return false;
				else  $('#loader_box_msg').html(msg)
				return true;
			}

			var fixed_flag 	= (fixed_flag === true) ? true : false;
			
			if( app.loader.fixed_status == true && action != "unlock" ){
			 	//console.log( "app.loader(): FIXED. Use UNLOCK to hide, or UPDATE to change message" );
			 	return false;
			}	

			// static flag, allows soft hidding on multiple fast show/hide requests
			//app.loader.hideTimer = (typeof app.loader.hideTimer == "undefined" ) ? null : app.loader.hideTimer;
			app.loader.fixed_status = fixed_flag;


			if(action == "show" || typeof action == "undefined"){
				// set new messge if setted
				if(typeof msg == "undefined") $('#loader_box_msg').html("Cargando...");
				else  $('#loader_box_msg').html(msg);
				
				// show loader box, and cancel any scheduled hidding requests
				$('#loader_box').modal("show");
				app.loader.hideTimer = null;
			}else if(action == "hide" ){
				// schedule hiddind request (overwritting previous schedules)
				$("#loader_box").removeClass("in");
				//app.loader.hideTimer = window.setTimeout( function(){ 
					$('#loader_box').stop(); 
					$('#loader_box').modal("hide") 
					//app.loader.hideTimer = null;
				//} , 800);
			}else if( action == "unlock" ){	
				// instant hide
				$('#loader_box').modal("hide") ;
				//app.loader.hideTimer = null;
			}
			else return app.error("app.loader() : Unknown action requested. Aborting execution");
			return true;
			*/
		},
		/**
		 * [message description]
		 * @param  {[type]}   msg               [description]
		 * @param  {[type]}   type              [description]
		 * @param  {Function} callback          [description]
		 * @param  {[type]}   callbackSecondArg [description]
		 * @return {[type]}                     [description]
		 */
		message: function(msg,type,callback, callbackSecondArg){
			if( typeof callback === "undefined" ) callback = new Function ;
			if( typeof callback !== 'function' )  return app.error("app.message() : The (optional) third argument MUST be a Function.");

			var callbackSecondArg 	= callbackSecondArg || undefined;
			// @type : alert , confirm , time in ms(int)
			var msg 	= msg || "hide";
			var type 	= type || "alert";
			
			if($.isNumeric(type) && Math.floor(type) == type){
				time_ms = type;
				type 	= "autohide";
			} 

			// show / hide message
			if(msg == "hide") $('#message_box').modal("hide");
			else{
				$( "#message_box_msg" ).removeAttr( "data-modal-err" );
				$('#message_box_msg').html(msg);
				switch(type){
					case "error":
						app.loader("unlock");
						app.loader("hide");
						$("#message_box_footer").show();
						$("#message_box_accept").show();
						$("#message_box_accept").text("Enviar Informe");
						$("#message_box_decline").hide();
						$("#message_box_close").hide();
						
						$( "#message_box_msg" ).attr( "data-modal-err" , true);
						$("#message_box").modal({backdrop:"static",keyboard:false, show:true});
						app.log(callbackSecondArg || msg , "error");

						$("#message_box_accept").off("click").on("click",function(){ 
							app.query("report_error" , { log : app.session.log }, function(r){
								if( app.isError(r) ) alert("No se ha podido enviar el informe. Recarga la página por favor.");
								else alert("Informe enviado. Recarga la página por favor.");
								return;
							})
						});
						throw new Error("Aborted");
					case "alert":
						$("#message_box_footer").show();
						$("#message_box_accept").hide();
						$("#message_box_decline").hide();
						$("#message_box_close").show();
						$("#message_box_close").off("click").on("click", function(){ 
							callback(true,callbackSecondArg);
						});

						$("#message_box").modal({backdrop:"static",keyboard:false, show:true});
						break;
					case "confirm":
						$("#message_box_footer").show();
						$("#message_box_accept").show();
						$("#message_box_decline").show();
						$("#message_box_close").hide();
						$("#message_box_accept").off("click").on("click",function(){ 
							callback(true,callbackSecondArg);
						});
						$("#message_box_decline").off("click").on("click",function(){ 
							callback(false,callbackSecondArg);
						});
						$("#message_box").modal({backdrop:"static",keyboard:false, show:true});
						break;
					case "autohide":
						app.log("app.message(autohide) NO SHOWING AUTOHIDE MESSAGE (bug  modal freezes)-------------", "warn");
						break;
						
						var time_ms = time_ms || 1500;
						$("#message_box_footer").hide();
						var autohide = setTimeout( function(){ 
							$('#message_box').modal("hide") 
						} , time_ms );
						$("#message_box").modal({backdrop:false,keyboard:true, show:true});
						break;
					default:
						return app.error("app.message() : Unknown type of modal message ( "+ type +" ) was provided");
				}
			}
			return true;
		},
		error : function(err_details, msg){
			var msg = msg || "Ha sucedido un Error inesperado.<br>Ayudanos a resolverlo pulsando 'Enviar Informe'."
			app.message(msg, "error", undefined, err_details)
		},
		/**
		 * app.isError() : 	Check if provided Query Server response is an error
		 * 					by checking constructor and analizing the status_code  in object. It
		 * 					does not check if is a original query response. Will return false for all
		 * 					other provided elements. 
		 * @param  	(object) 	obj 		Expects app.query() response object.
		 * @param  	(boolean) 	_break 		Flag that allows block execution when setted to true and error found
		 *
		 * @return 	(boolean)				If error structure matches with an error anatomy, 
		 *                          		returns true (error found), else returns false	   
		 */
		isError: function(obj, _break){
			// break execution with error when _break is strictly set to true
			var _break = (_break === true) ? true : false;
			// error type Checking...
			var _isError = (typeof obj === "object" && obj !== null && obj.constructor.name === "apiErr" ) ? true : false; 
			// return RESULT if no break is requested
			if(!_break) return _isError;
			else{
				// BREAK REQUESTED! if error found, breack execution, else return FALSE
				if(_isError) return app.error("app.stopOnError() : Error "+obj.status_code+" found ( " + obj.message +" )");
				else return false;
			}
		},
		/**
		 * Validate DOM elements
		 * @param  {[type]}  o [description]
		 * @return {Boolean}   [description]
		 */
		isElement: function(o){
			return (
				typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
				o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
			);
		},
		/**
		 * app.query() : Execute AJAX calls, handle response, and launch callback
		 * @param  {[type]} _method     [description]
		 * @param  {[type]} _params_obj [description]
		 * @param  {[type]} _callback   [description]
		 * @return {[type]}             [description]
		 */
		query : function(_method, _params_obj , _callback){
			//
			// validate arguments
			var _callback = app.checkCallback(_callback, "app.query" );

			if( typeof _method !== 'string' ) return app.error("app.query() : First argument ('method') MUST be provided.");
			
			if( typeof _params_obj !== 'object' ) return app.error("app.query() : Second argument ('params') MUST be an Object.");
						
			// attach user token to POST data
			_params_obj.token = app.session.user.token;
			
			// log api request 
			if(app.config.log_queries) app.log("%c >> " + _method + " : " + JSON.stringify(_params_obj) , "log" , "color: #319B31");

			// loading...
			app.loader("show");

			// launch query
			$.post( app.config.url + _method , _params_obj , function( r ) {}).always(function(r) {
				var response_obj;
				if(app.config.log_queries) app.log("%c<< " + r ,  "log" , "color: #2E722E");
		    	// PARSE AND VALIDATE RESPONSE
		    	// json decode with error handling, for unexpected server errors management.
				try{ 
					// not parsable and null responses are considered invalid&unhandled server responses
					response_obj = JSON.parse( r ); 
					if(response_obj == null) throw Error;	
				}catch(err){ response_obj = false; }
				
				// done loading...
				app.loader("hide");

				// If JSON object can't be parsed, is signal of ERROR in SERVER side. 
				// Show alert to user and break execution.
				if( response_obj === false ){ 
					app.message("Ha ocurrido un error no esperado. Contacta con soporte técnico por favor.", "alert")
					//* TO DO : recolect data & open ticket
					return app.error("app.query() : Fatal Error. Unable to decode JSON server response : " + r);
				}
				// Declare ApiError Object constructor
				function apiErr(status_code , message){ this.status_code = status_code;  this.message = message; }
				// generate error object if error is detected
				if(response_obj.status_code != 200) return _callback(new apiErr(response_obj.status_code ,response_obj.message ) );
				else return _callback( response_obj.message );
		    });
		    return _ASYNC_;
		},
		/**
		 * app.checkCallback() : 			Validates provided callback function. Callback must be a valid function,
		 * 									or function reference. The only other value allowed is a boolean 'false', 
		 * 									wich is interpreted as a 'bypass callback'. Other type of objects will return
		 * 									an error , breaking execution
		 * 									
		 * @param  (function) 	c     		Callback Function, or boolean "false" qre allowed
		 * @param  (type) 		caller 		String representing the name of caller function. 
		 * 
		 * @return (type)        			Returns the original function if is valid, or empty function if "callback 
		 *                                  bypass" was explicitally requested. Other values don't return response, instead,
		 *                                  launche error.
		 */
		checkCallback: function(c,callerNAme){
			if( c == undefined || c == false || c == null ) c = new Function;
			else if( typeof c !== 'function') return app.error (callerNAme + "() : Invalid Callback was provided.");
			return c;
		},
		/**
		 * [guid description]
		 * @return {[type]} [description]
		 */
		guid :function() {
			function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
			return s4() + s4() + '' + s4() + '' + s4() + '' + s4() + '' + s4() + s4() + s4();
		},
		/**
		 * [require description]
		 * @param  {[type]}   src      [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		require : function(src, callback) {
			if(typeof src != "string" || src == "") return app.error("app.require() : First argument must be the script PATH (string). Invalid type or empty value was provided.")
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.src = src;
			var done = false;
			script.onload = script.onreadystatechange = function() { 
				// attach to both events for cross browser finish detection:
				if ( !done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
					done = true;
					if (typeof callback == 'function') callback();
					// cleans up a little memory:
					script.onload = script.onreadystatechange = null;
					head.removeChild(script);
				};
			};
			head.appendChild(script);
			return _ASYNC_;
		},
		event : (function(){ 
			// Events object private scope
			var pg_eventVault = {
				/*
				- data structure eg:
				"my.event.name" : {
					_propagationCancelled 	: false,
					listeners 				: [],
					eventStart 				: function(){}, 
					eventEnd 				: function(){}, 
				}
				*/
			};
			var pg_event = function(){
				return  {
					// name: "",
					type					: "pg-event",		// unique event key  
					eventKey				: app.guid(),		// unique event key  
					listeners 				: [],				// store event listeners
					_cancelled 			 	: false, 			// this flag determines when propagations has been cancelled
					cancelable 				: true, 			// if true , can be cancelled via the event.stopPropagation()
					asyncListeners  		: true,				// listeners must explicitelly  notify execution end
																// to continue propagation.
					publicListeners			: true,				// Public Acces to listeners 
					publicTriggers 			: false,			// acces to event trigger 
					listenKey 				: app.guid(),		// key for "private Listeners" events
					triggerKey 				: app.guid(),		// key for "private Triggers" events
					onStart 				: function(e){ e.ready() },// function executes when event is triggered, 
																// and receives provided parameters when setted
					onEnd 	 				: function(e){ e.ready() } // function is executed when all listeners finished execution
				}
			};
			var pg_listener = function( eventName , eventListener , listener_protected ){
				var _id 		= app.guid();
				var _event 		= eventName;
				var _protected 	= ( typeof listener_protected == "undefined" ) 	? false 	: Boolean( listener_protected )
				return {
					id 			: _id,
					protected 	: _protected,
					run 		: eventListener,
					public 		: {
						type 		: "pg-event-listener",
						event 		: eventName,
						id 			: _id,
						isProtected : function(){ return _protected },
						off 		: function(){ app.event.off( _event , _id ); }
					}
				};
			};
			
			var pg_listenerIndex = function(eventName, listenerId){
				for(var i = 0; i < pg_eventVault[eventName].listeners.length; i++ ){
					if( typeof pg_eventVault[eventName].listeners[i] == "undefined") continue;
					if( pg_eventVault[eventName].listeners[i].id==listenerId ) return i; 
				}
				return -1;
			};
			// public methods and properties
			return {
				// register event
				list : function(){
					var list = [];
					for(var e in pg_eventVault) list.push(e);
					return list
				},

				on : function( eventName, eventListener, event_listenKey, listener_protected){
					// validate arguments
					if( !app.event.exist(eventName) )  return app.error("app.event.on() : Provided Event name (" + eventName + ") does not exist." );
					if( typeof eventListener != "function" ) return app.error("app.event.on() : Provided listener must be a function." );
					// if event listeners are private, validate acces key
					var _e = pg_eventVault[eventName];
					if( !_e.publicListeners && _e.listenKey != event_listenKey ) return app.error("app.event.on() : Provided key does not match with event listenKey." );

					// create new listener object
					var newListener	= new pg_listener(eventName , eventListener, event_listenKey , listener_protected );
					pg_eventVault[eventName].listeners.push(newListener);
					return newListener.public;
				},
				off : function( eventName, listenerId ){
					// consider first argument as a Listener Event  Object if is an object type...
					if(typeof eventName == "object"){
						var listenerObj = eventName;
						eventName = listenerObj.event;
						listenerId = listenerObj.id;
					}
					// block if event does not exist
					if( !app.event.exist(eventName) ) return false;
					if( typeof listenerId != "string" ) return false;
					var listenerIndex = pg_listenerIndex(eventName,listenerId);
					// block if event listener does not exist
					if( listenerIndex == -1 ) return false;
					delete pg_eventVault[eventName].listeners[listenerIndex].public.type; 
					delete pg_eventVault[eventName].listeners[listenerIndex].public.event; 
					delete pg_eventVault[eventName].listeners[listenerIndex].public.id;
					delete pg_eventVault[eventName].listeners[listenerIndex].public.isProtected;
					delete pg_eventVault[eventName].listeners[listenerIndex].public.off;
					pg_eventVault[eventName].listeners[listenerIndex].public.type = "pg-deleted-listener";
					delete pg_eventVault[eventName].listeners[listenerIndex].public;
					delete pg_eventVault[eventName].listeners[listenerIndex];
					
					return true;
				},
				exist : function(eventName){
					if( pg_eventVault.hasOwnProperty( eventName ) ) return true;
					else return false;
				},
				new : function( configObj ){
					// allow fast initation mode, considering configObj as an event name  when is a string type
					var configObj = (typeof configObj === "string" ) ? { name : configObj } : configObj;
					if( configObj == undefined || configObj == null || typeof configObj != "object" ) return app.error("app.event.new() : Provided configObj is invalid.");
					if( typeof configObj.name != "string" ) return app.error("app.event.new() : Invalid name attribute for new event config");
					// block if event has already been registered
					if( app.event.exist(configObj.name) ) return app.error("app.event.new() : Provided Event name (" + configObj.name + ") is already in use." );
					// generate new event
					var _e 	= pg_event();
					// customize default event
					_e.name 			= configObj.name;
					_e.cancelable 		= ( typeof configObj.cancelable == "undefined" ) 		? _e.cancelable 		: Boolean( configObj.cancelable );
					_e.asyncListeners 	= ( typeof configObj.asyncListeners == "undefined" ) 	? _e.asyncListeners 	: Boolean( configObj.asyncListeners );
					_e.publicListeners	= ( typeof configObj.publicListeners == "undefined" ) 	? _e.publicListeners 	: Boolean( configObj.publicListeners );
					_e.publicTriggers	= ( typeof configObj.publicTriggers == "undefined" ) 	? _e.publicTriggers 	: Boolean( configObj.publicTriggers );
					_e.listenKey 		= ( typeof configObj.listenKey == "undefined" ) 		? _e.listenKey 			: String( configObj.listenKey );
					_e.triggerKey 		= ( typeof configObj.triggerKey == "undefined" ) 		? _e.triggerKey 		: String( configObj.triggerKey );
					// onStart
					// onEnd

					//  set new event
					pg_eventVault[_e.name] = _e;
					return _e.eventKey;
				},
				trigger : function(eventName, eventDataObj, callback){
					var callback = app.checkCallback(callback);
					if( !app.event.exist(eventName) ) return false;
					pg_eventVault[eventName]._cancelled = false;
					app.log("app.event.trigger() : Event TRIGGERED - "+eventName)
					var currentListenerIndex = -1;
					var e = {
						type : "pg-event",
						ready : function(){ asyncListenersCall() }
					}
					var asyncListenersCall = function(){
						currentListenerIndex++;
						if( currentListenerIndex > pg_eventVault[eventName].listeners.length - 1 ){
							return pg_eventVault[eventName].onEnd( {ready: callback} );
						}
						if( pg_eventVault[eventName].cancelled == true ) return callback();
						if( typeof pg_eventVault[eventName].listeners[currentListenerIndex] != "undefined" ){
							pg_eventVault[eventName].listeners[currentListenerIndex].run(e);
						}else asyncListenersCall();
					};
					asyncListenersCall();
					return _ASYNC_;
				},
			}
		})()

	}
});
