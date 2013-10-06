// =============================================================================
//
// Copyright 2013 Neticle Portugal
// http://www.github.com/neticle/nitrous-nodejs-framework
//
// This file is part of "Nitrous/NodeJS", hereafter referred to as "Nitrous".
//
// "Nitrous" is free software: you can redistribute it and/or modify it under 
// the terms of the GNU General Public License as published by the Free Software 
// Foundation, either version 3 of the License, or (at your option) any later
// version.
//
// "Nitrous" is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See theGNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with
// "Nitrous". If not, see <http://www.gnu.org/licenses/>.
//
// =============================================================================

$.using(

	'system.object',
	'system.restful.context'

);

/**
 * Constructor.
 *
 * @param HttpServer server
 *	The instance a HTTP server listening for requests to be dispatched by this
 *	service instance.
 */
function RestfulService(server) {
	this.__construct_eventEmitter();
	this._requestHandlers = {};
	this._validators = {};
	
	// Register to handle server requests
	this.server = server;
	server.on('request', this, this._onRequest);
}

$.object.extend(RestfulService.prototype,
	$.eventEmitter.prototype, {
	
	_coreValidators: {
	
		/**
		 * Requires a non empty request body.
		 *
		 * @param HttpRequest request
		 *	The request to be validated.
		 *
		 * @param HttpResponse response
		 *	The response associated with this request to where the error
		 *	contents should be sent in case "terminate" is set to TRUE.
		 *
		 * @param bool terminate
		 *	When set to TRUE an error response will be sent when validation
		 *	fails.
		 */
		input: function(request, response, session, terminate) {
		
			if($.object.isEmpty(request.body)) {
					
				// Terminate this request by sending an error response
				response.send(400, {
					status: 400,
					description: 'Bad Request',
					reason: 'No input given.'
				});
				
				return false;
			}
			
			return true;
		
		}
	
	},
	
	/**
	 * Raises a cancelable error event.
	 *
	 * @param HttpMessage request
	 *	The request associated with the context of this event.
	 *
	 * @param HttpResponse response
	 *	The response associated with the context of this event.
	 *
	 * @param int status
	 *	The status to be included in the error response in case no other
	 *	callback properly handles this event.
	 *
	 * @param string message
	 *	The message to be included in the error response in case no other
	 *	callback properly handles this event.
	 */
	_raiseCancelableErrorEvent: function(event, request, response, status, message) {
		
		// Create the event data object
		var data = { cancel: false };
		
		// Raise the event
		if(this.raise(event, data, request, response) < 1 || data.cancel) {
			
			// Send a generic error message
			response.send(404, {
				'status': status,
				'description': message
			});
			
		}
		
	},
	
	/**
	 * Raises a cancelable "validationFailed" event.
	 *
	 * @param HttpMessage request
	 *	The request associated with the context of this event.
	 *
	 * @param HttpResponse response
	 *	The response associated with the context of this event.
	 */
	_raiseValidationFailed: function(request, response) {
		return this._raiseCancelableErrorEvent('validationFailed', request, response, 400, 'Bad Request');
	},
	
	/**
	 * Raises a cancelable "handlerNotFound" event.
	 *
	 * @param HttpMessage request
	 *	The request associated with the context of this event.
	 *
	 * @param HttpResponse response
	 *	The response associated with the context of this event.
	 */
	_raiseHandlerNotFound: function(request, response) {
		return this._raiseCancelableErrorEvent('handlerNotFound', request, response, 404, 'Document Not Found');
	},
	
	/**
	 * Handles the "request" event raised by the service HttpServer.
	 *
	 * @param HttpSource source
	 *	The object this event has been raised from.
	 *
	 * @param HttpRequest request
	 *	The instance representing the request performed by the client.
	 *
	 * @param HttpResponse response
	 *	The response linked to the request.
	 *
	 * @param HttpSession session
	 *	The session linked to the request.
	 */
	_onRequest: function(source, request, response, session) {
		this.dispatch(request, response, session);
	},
	
	/**
	 * Validates the request according to the given rule.
	 *
	 * @param string rule
	 *	The name of the rule to validate the request with.
	 *
	 * @param HttpMessage request
	 *	The request being validated.
	 *
	 * @param HttpResponse response
	 *	The response linked to the request.
	 *
	 * @param HttpSession session
	 *	The session linked to the request and response.
	 *
	 * @param HttpContext|object context
	 *	The context that will be applied to the request handler.
	 */
	validate: function(rule, request, response, session, context) {
	
		// Find the rule callback by it's name
		var callback;
		
		// Find it in the core validators collection
		if(this._coreValidators[rule]) {
			callback = this._coreValidators[rule];
		} 
		
		// Find it in the custom validators collection
		else if(this._validators[rule]) {
			callback = this._validators[rule];
		} 
		
		else {
			throw 'Rule "' + rule + '" not found.';
		}
		
		return callback.call(context, request, response, session);
		
	},
	
	/**
	 * Validates the request with multiple rules.
	 *
	 * @param string[] rules
	 *	The names of the rules to validate the request with.
	 *
	 * @param HttpMessage request
	 *	The request being validated.
	 *
	 * @param HttpResponse response
	 *	The response linked to the request.
	 *
	 * @param HttpSession session
	 *	The session linked to the request and response.
	 *
	 * @param HttpContext|object context
	 *	The context that will be applied to the request handler.
	 */
	validateMultiple: function(rules, request, response, session, context) {
	
		var success = true;
	
		// Go through all the rules
		for(var i in rules) {
		
			if(!this.validate(rules[i], request, response, session, context)) {
				success = false;
				break;
			}
		
		}
		
		return success;
	
	},
	
	/**
	 * Dispatches the given request and it's linked session and response to a
	 * handler matching the information contained in the request, if any.
	 *
	 * @param HttpMessage request
	 *	The request being validated.
	 *
	 * @param HttpResponse response
	 *	The response linked to the request.
	 *
	 * @param HttpSession session
	 *	The session linked to the request and response.
	 */
	dispatch: function(request, response, session) {
	
		// Get the handlers for this request method
		var method = request.method;
		var handlers = this._requestHandlers[method];
		
		if(!handlers) {
			return this._raiseHandlerNotFound(request, response);
		}
		
		// Get the request path name
		var path = request.url.pathname;
		
		// Find the handler which has a matching pattern
		for(var i in handlers) {
		
			var handler = handlers[i];
			var regex = handler[2];
			var matches;
			
			// The pattern matches this request path
			if(!regex || (matches = regex.exec(path))) {
			
				// Build the request handler parameters
				var parameters = [];
				
				if(matches) {
				
					// Get the original pattern in order to know where the matches
					// are, due to the underlying regex groups.
					var pattern = handler[1];
					var index = 0;
					var matchIndex = 1;
					
					while((index = pattern.indexOf('%', index)) > -1) {
					
						// Add the current match to the parameters array
						parameters.push(matches[matchIndex]);
					
						// Get the value type and move the match index accordingly
						var type = pattern[++index];
						++matchIndex;
						
						if(type === 'f') {
							++matchIndex;
						}
						
					}
					
				}
				
				// Build the context for the request handler, if necessary.
				var context = handler[4];
				
				if(!context) {
					context = $.restfulContext.create(this, request, response, session);
				}
			
				// This handler matches the pattern and method so let's make
				// sure it also passes all validations.
				var rules = handler[3];
				
				if(rules && !this.validateMultiple(rules, request, response, session, context)) {
					return;
				}
				
				// Extract the matches and invoke the handler
				handler[5].apply(context, parameters);
				return;
			}
			
		}
		
		this._raiseHandlerNotFound(request, response);
	},
	
	/**
	 * Defines a custom request validator handler.
	 *
	 * @param string name
	 *	The name of the request validator to define.
	 *
	 * @param function(request, response, session, terminate) callback
	 *	The callback to handle the request validation.
	 */
	setCustomValidator: function(name, callback) {
		
		// Make sure this name isn't taken already
		if(this._validators[name] || this._coreValidators[name]) {
			throw 'Rule "' + name + '" already exists.';
		}
		
		// Register the rule handler
		this._validators[name] = callback;
		
	},
	
	/**
	 * Adds a new request handler.
	 *
	 * @param string method
	 *	The name of the method this handler is registered for.
	 *
	 * @param string pattern
	 *	The URL pattern required by this handler.
	 *
	 * @param string[] validators
	 *	An array of validator names to process the request.
	 *
	 * @param object context
	 *	The context to be applied to the callback. If omitted a HttpContext
	 *	will be created for that purpose.
	 *
	 * @param function callback
	 *	The callback to handle the request.
	 */
	addRequestHandler: function(method, pattern, rules, context, callback) {
		
		if(this._requestHandlers[method]) {
		
			// Find more handlers matching this method and pattern
			for(var i in this._requestHandlers) {
				
				var handler = this._requestHandlers[i];
				
				if(handler[0] === method && handler[1] === pattern) {
					$.warning('RestfulService: There\'s already a handler for this method and pattern.');
					break;
				}
				
			}
		
		} else {
		
			// Add the array for this method
			this._requestHandlers[method] = [];
		
		}
		
		// Build the request path regex from the pattern
		var regex;
		
		if(pattern) {
		
			// Make sure the pattern is valid
			if(!(/^(\/|(\/(\w|\%s|\%d|\%w|\%f)+)+)$/i).test(pattern)) {
				throw 'Invalid request pattern format.';
			}
		
			// Strip slashes
			regex = pattern
				.replace(/\%d/g, '(\\d+)')
				.replace(/\%w/g, '(\\w+)')
				.replace(/\%f/g, '(\\d+(\.\\d+)?)')
				.replace(/\%s/g, '(.*)')
			
			// Compile the regex for this pattern
			regex = new RegExp('^' + regex + '$', 'i');
			
		}
		
		// Register the callback as a request handler
		this._requestHandlers[method].push(
			[ method, pattern, regex, rules, context, callback ]
		);
		
	},
	
	/**
	 * Adds a new request handler.
	 *
	 * @param string method
	 *	The name of the method this handler is registered for.
	 *
	 * @param string pattern
	 *	The URL pattern required by this handler.
	 *
	 * @param string[] validators
	 *	An array of validator names to process the request.
	 *
	 * @param object context
	 *	The context to be applied to the callback. If omitted a HttpContext
	 *	will be created for that purpose.
	 *
	 * @param function callback
	 *	The callback to handle the request.
	 */
	handle: function() {
		
		// Define the values according to the number of arguments
		var method, pattern, rules, context, callback;
		
		switch(arguments.length) {
			
			case 1:
				method = 'GET';
				callback = arguments[0];
			break;
			
			case 2:
				method = arguments[0];
				callback = arguments[1];
			break;
			
			case 3:
				method = arguments[0];
				pattern = arguments[1];
				callback = arguments[2];
			break;
			
			case 4:
				method = arguments[0];
				pattern = arguments[1];
				rules = arguments[2];
				callback = arguments[3];
			break;
			
			case 5:
				method = arguments[0];
				pattern = arguments[1];
				rules = arguments[2];
				context = arguments[3];
				callback = arguments[4];
			break;
			
			default:
				throw 'Invalid argument count.';
			
		}		
		
		if(rules) {
		
			if('string' === typeof rules) {
			
				// Split the rules by comma
				rules = rules.split(',');
			}
			
			// Normalize the rule names by trimming and removing empty elements
			var normalizedRules = [];
			
			for(var i in rules) {
			
				var name;
				
				if(name = $.string.trim(rules[i])) {
					normalizedRules.push(name);
				}
				
			}
			
			rules = normalizedRules;
			
		}
		
		// Set the request handler
		this.addRequestHandler(method, pattern, rules, context, callback);
		
	}
	
});

module.exports = {

	_id: 'restfulService',
	
	prototype: RestfulService.prototype,
	
	create: function(server) {
		return new RestfulService(server);
	}

};



