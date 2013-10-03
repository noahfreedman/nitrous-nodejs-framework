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
	'system.array',
	'system.string',
	'system.eventEmitter'

);

/**
 * Constructor.
 *
 * @param array[] rules
 *	A multi-dimensional array describing the initial set of rules that are
 *	part of this validator.
 */
function Validator(rules) {
	this.__construct_eventEmitter();
	this._validators = {};
	
	this.rules = rules;
	this._pack();
}

$.object.extend(Validator.prototype,
	$.eventEmitter.prototype, {
	
	_coreValidators: {
	
		/**
		 * Makes sure the value is not evaluate to FALSE.
		 *
		 * @param object document
		 *	The document being validated.
		 *
		 * @param string attribute
		 *	The attribute being validated.
		 *
		 * @param mixed value
		 *	The value being validated.
		 *
		 * @param object|undefined options
		 *	An object containing additional options for this validator.
		 *
		 * @param callback(success) callback
		 *	The validation result reporting callback.
		 */
		required: function(document, attribute, value, options, callback) {
			callback.call(this, !!value);
		},
		
		/**
		 * Makes sure the value is a numeric string.
		 *
		 * @param object document
		 *	The document being validated.
		 *
		 * @param string attribute
		 *	The attribute being validated.
		 *
		 * @param mixed value
		 *	The value being validated.
		 *
		 * @param object|undefined options
		 *	An object containing additional options for this validator.
		 *
		 * @param callback(success) callback
		 *	The validation result reporting callback.
		 */
		numeric: function(document, attribute, value, flags, callback) {
		
			// Default validator options
			var options = {
				integer: true,
				required: false
			};
			
			// Apply the given options
			if(flags) {
				$.object.extend(options, flags);
			}
			
			// Required undefined value or incorrect type
			if((options.required && !value) || ('string' !== typeof value)) {
				callback.call(this, false);
				return;
			}
			
			// Determine the regex to use
			var regex = options.integer ? 
				(/^\d+$/) : (/^\d+(\.\d+)?$/);
				
			callback.call(this, regex.test(value));
		}
	
	},
	
	/**
	 * Packs this instance rules into the '_schema' object, indexed by event
	 * name, as well as the list of attributes marked as safe and unsafe.
	 */
	_pack: function() {
		
		// Build the base schema data
		var schema = {
			attributes: [],
			events: {},
			rules: []
		};
		
		// Go through the currently registered rules
		$.array.foreach(this.rules, this, function(rule) {
			
			// Extract the rule data
			var validator = rule[0];
			var attributes = rule[1];
			var events = rule[2];
			var options = rule[3];
			
			// Parse the attributes string, if applicable
			if('string' === typeof attributes) {
				attributes = $.string.explode(attributes);
			}
			
			// Parse the event string, if applicable
			if('string' === typeof events) {
				events = $.string.explode(events);
			}
				
			// Determine the affected events
			var affected = events ? events : ['_default'];
			
			// Register the events, if required
			$.array.foreach(affected, this, function(event) {
				
				if(!schema.events[event]) {
					schema.events[event] = {
						safe: [],
						unsafe: []
					};
				}
				
			});
			
			// Register the attributes
			$.array.extend(schema.attributes, attributes);
			
			// Mark an attribute as safe or unsafe
			if(validator === 'unsafe' || validator === 'safe') {
				
				if(events) {
				
					// Mark the affected events attributes
					$.array.foreach(events, this, function(event) {
						$.array.extend(schema.events[event][validator], attributes);
					});
				
				} else {
					$.array.extend(schema.events._default[validator], attributes);
				}
				
				return false;
			}
			
			// Register this rule instance
			schema.rules.push([ validator, attributes, events, options ]);
		});
		
		// Make sure the rules are valid
		$.object.foreach(schema.events, this, function(property, event) {
			
			// Find matches between safe and unsafe attributes
			if($.array.match(event.safe, event.unsafe) > 0) {
				throw 'An attribute can not be safe and unsafe in the same event.';
			}
			
			// Apply the difference
			if(property !== '_default') {
			
				var safe = event.safe;
				var unsafe = event.unsafe;
				
				$.array.extend(safe, schema.events._default.safe);
				$.array.extend(unsafe, schema.events._default.unsafe);
				event.unsafe = $.array.diff(unsafe, safe);
				
			}
			
		});
		
		this._schema = schema;
	},
	
	/**
	 * Returns an array of unsafe attributes for the given event.
	 *
	 * @param string event
	 *	The event to get the unsafe attributes of.
	 *
	 * @return string[]
	 *	An array of unsafe attributes for this event.
	 */
	_getUnsafeAttributes: function(event) {
		var events = this._schema.events;
		return events[event] ? events[event].unsafe : events._default.unsafe;
	},
	
	/**
	 * Returns the validator callback.
	 *
	 * @param string validator
	 *	The name of the validator to be returned.
	 *
	 * @return function
	 *	The validator callback.
	 */
	_getValidatorCallback: function(validator) {
		
		// Get a custom validator.
		if(this._validators[validator]) {
			return this._validators[validator];
		}
		
		// Get a core validator
		if(this._coreValidators[validator]) {
			return this._coreValidators[validator];
		}
		
		throw 'Unknown validator "' + validator + '" for rule.';
		
	},
	
	/**
	 * Performs validation for a specific event and set of attributes.
	 *
	 * @param string event
	 *	The name of the event being validated.
	 *
	 * @param object document
	 *	The object to be validated.
	 *
	 * @param string[] attributes
	 *	An array of attributes to limit the validation to.
	 *
	 * @param object options
	 *	An object containing additional validation settings, as described
	 *	bellow:
	 *
	 *		bool:strict (default: false)
	 *			When set to TRUE any attributes that are not affected by any
	 *			rule will be removed from the given document.
	 *	
	 * @param object context
	 *	The context to be applied to the callback function.
	 *
	 * @param function(report, document) callback
	 * 	A callback to be invoked when validation completes.
	 */
	_validate: function(event, document, attributes, options, context, callback) {
		
		// Remove unsafe attributes
		var schema = this._schema;
		var schemaAttributes = schema.attributes;
		var unsafe = this._getUnsafeAttributes(event);
		var rules = schema.rules;
		
		// Delete unsafe attributes the old way, for performance reasons
		for(var i in unsafe) {
			delete document[unsafe[i]];
		}
		
		if(options.strict) {
		
			// Remove attributes that don't have rules assigned to it
			for(var attribute in document) {
				if(schemaAttributes.indexOf(attribute) < 0) {
					delete document[attribute];
				}
			}
			
		}
		
		// Validation progress and report
		var vpValidatorCount = 0;
		var vpValidatorComplete = 0;
		var vpValidatorIssueComplete = false;
		var vpContext = this;
		var vpReport = { 
			success: true, 
			error: { 
				attributes: [],
				validators: [],
				byValidators: {}, 
				byAttributes: {}
			}
		};
		
		var check_validation_result = function() {
			
			$.debug(vpValidatorComplete === vpValidatorCount ? 'complete' : 'pending');
			$.debug(vpValidatorComplete + '=' + vpValidatorCount);
			
			// Detect the validation result
			if(vpValidatorComplete === vpValidatorCount) {
				callback.call(context, vpReport, (vpReport.success ? document : undefined));
			}
			
		};
		
		// Handle a validator result
		var handle_validator_result = function(validator, attribute, success) {
			
			// Handle validation error
			if(!success) {
				
				vpReport.success = false;
				
				// Get the report indexes
				var vpAttributesIndex = vpReport.error.byAttributes;
				var vpValidatorsIndex = vpReport.error.byValidators;
				
				// Register the attribute
				var vpAttributes = vpReport.error.attributes;
				if(vpAttributes.indexOf(attribute) < 0) {
					vpAttributes.push(attribute);
					vpAttributesIndex[attribute] = [];
				}
				
				// Register the validator
				var vpValidator = vpReport.error.validators;
				if(vpValidator.indexOf(validator) < 0) {
					vpValidator.push(validator);
					vpValidatorsIndex[validator] = [];
				}
				
				// Index the attributes and validators by each other
				vpValidatorsIndex[validator].push(attribute);
				vpAttributesIndex[attribute].push(validator);
				
			}
			
		};
		
		// Go through all the rules
		for(var i in rules) {
			var rule = rules[i];
			
			var events = rule[2];
			
			// Make sure the rule is applicable to this event
			if(events && events.indexOf(event) < -1) {
				continue;
			}
			
			// Extract the remaining rule data
			var validator = rule[0];
			var attributes = rule[1];
			var validatorOptions = rule[3];
			
			// Get the validator by name
			var validatorCallback = this._getValidatorCallback(validator);
			
			// Go through all attributes
			for(var i in attributes) {
				var attribute = attributes[i];
				
				// Increment the number of invoked validators
				++vpValidatorCount;
				
				// Invoke the validator callback
				validatorCallback.call(undefined, document, attribute, document[attribute], validatorOptions, function(success) {
				
					// This validator is complete
					++vpValidatorComplete;
				
					// Print debug info, handle the validator result and check the overall validation for async callbacks
					$.debug('Validator: ' + validator + ' ' + attribute + ' ' + success);
					handle_validator_result.call(vpContext, validator, attribute, success);
					vpValidatorIssueComplete && check_validation_result.call(vpContext);
					
				});
			
			}
		
		}
			
		// All validators have been issued properly
		vpValidatorIssueComplete = true;
		check_validation_result.call(vpContext);
		
	},
	
	/**
	 * Performs validation for a specific event and set of attributes.
	 *
	 * @param string event
	 *	The name of the event being validated.
	 *
	 * @param object document
	 *	The object to be validated.
	 *
	 * @param string[] attributes
	 *	An array of attributes to limit the validation to.
	 *
	 * @param object options
	 *	An object containing additional validation settings, as described
	 *	bellow:
	 *
	 *		bool:strict (default: false)
	 *			When set to TRUE any attributes that are not affected by any
	 *			rule will be removed from the given document.
	 *	
	 * @param object context
	 *	The context to be applied to the callback function.
	 *
	 * @param function(report, document) callback
	 * 	A callback to be invoked when validation completes.
	 */
	validate: function() {
	
		// Load the arguments according to length
		var event, input, attributes, options, context, callback;
		
		switch(arguments.length) {
		
			case 3:
				event = arguments[0];
				input = arguments[1];
				callback = arguments[2];
			break;
			
			case 4:
				event = arguments[0];
				input = arguments[1];
				context = arguments[2];
				callback = arguments[3];
			break;
			
			case 5:
				event = arguments[0];
				options = arguments[1];
				input = arguments[2];
				context = arguments[3];
				callback = arguments[4];
			break;
			
			case 6:
				event = arguments[0];
				attributes = arguments[1];
				options = arguments[2];
				input = arguments[3];
				context = arguments[4];
				callback = arguments[5];
			break;
		}
		
		// Create the default options
		if(!options) {
			options = {};
		}
		
		// Create the document instance and validate it
		var document = $.object.clone(input);
		this._validate(event, document, attributes, options, context, callback);
	
	},
	
	/**
	 * Registers a new custom async sub validator for this validator.
	 *
	 * @param string name
	 *	The name of this sub validator.
	 *
	 * @param function(document, attribute, value, options, callback) callback
	 *	The callback to be invoked during the validation process.
	 */
	setCustomAsyncValidator: function(name, callback) {
		this._validators[name] = callback;
	},
	
	/**
	 * Registers a new custom async sub validator for this validator.
	 *
	 * @param string name
	 *	The name of this sub validator.
	 *
	 * @param function(document, attribute, value, options) callback
	 *	The callback to be invoked during the validation process.
	 */
	setCustomValidator: function(name, callback) {
		this._validators[name] = function(document, attribute, 
				value, options, _callback) {
				
			_callback.call(this, callback.call(undefined, document, attribute, value, options));
			
		};
	}
	
	

});

module.exports = {

	_id: 'validator',

	prototype: Validator.prototype,
	
	create: function(schema) {
		return new Validator(schema);
	}

};
