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

	'system.array'

);

module.exports = {

	_id: 'object',
	
	/**
	 * Clones an existing object, recursively, and returns the reference 
	 * pointing to the new one.
	 *
	 * @param object object
	 *	The object to be cloned.
	 *
	 * @return object
	 *	The cloned object.
	 */
	clone: function(object) {
	
		// Non-objects do not need to be cloned
		if(!object || 'object' !== typeof object) {
			return object;
		}
		
		// Clone an array
		if(object instanceof Array) {
			return $.array.clone(object);
		}
	
		// Create an empty object
		var clone = {};
		
		// Go through all object properties
		for(var property in object) {
			
			var value = object[property];
			
			// Defined objects (object and array)
			if(value && 'object' === typeof value) {
			
				// Clone arrays and objects
				clone[property] = value instanceof Array ?
					$.array.clone(value) : this.clone(value);
					
				continue;
			}
		
			// Undefined, null, number, bool and so on
			clone[property] = value;
		
		}
		
		return clone;
	
	},
	
	/**
	 * Builds a new object by cloning the properties from all other given
	 * from left to right, recursively.
	 *
	 * Please note functions will not be cloned.
	 *
	 * @param object base
	 *	The base object to extend.
	 *
	 * @param object ...
	 *	The additional objects to extend base with.
	 *
	 * @return object
	 *	Returns the base object.
	 */
	extend: function(base) {
	
		// Go through all subsequent arguments
		for(var i = 1, length = arguments.length; i < length; ++i) {
			
			var argument = arguments[i];
			
			// Skip undefined arguments
			if(argument === undefined) {
				continue;
			}
			
			// Make sure the given argument is an object
			if(argument === null || 'object' !== typeof argument) {
				throw 'Non-object type given for extend.';
			}
			
			// Go through all the object properties
			for(var property in argument) {
				
				// Get the property values
				var avalue = argument[property];
				var bvalue = base[property];
				
				// Ignore undefined values.
				if(avalue === undefined) {
					continue;
				}
				
				// The property doesn't exist in the base object.
				if(bvalue === undefined) {
					base[property] = this.clone(avalue);
					continue;
				}
				
				// Null values can't be extended.
				if(bvalue === null) {
					throw 'Can not extend NULL value of "' + property + '"';
				}
				
				// Get the property types
				var atype = typeof avalue;
				var btype = typeof bvalue;
				var aarray = avalue instanceof Array;
				var barray = bvalue instanceof Array;
				
				// Type mismatch
				if(atype !== btype || aarray !== barray) {
					throw 'Type mismatch for property "' + property + '"';
				}
				
				// Override arrays
				if(barray) {
					base[property] = $.array.clone(avalue);
					continue;
				}
				
				// Extend objects recursively
				if(atype === 'object') {
					this.extend(base[property], this.clone(avalue));
					continue;
				}
				
				// Other properties that don't need to be cloned
				base[property] = avalue;
			}
			
		}
		
		return base;
	
	},
	
	/**
	 * Creates a new proxy callback function that will redirect any calls made
	 * to it to the supplied callback, in the given context.
	 *
	 * @param object context
	 *	The context to be applied to the callback when calling it.
	 *
	 * @param function callback
	 *	The callback to redirect any calls to.
	 *
	 * @return function
	 *	The proxy callback.
	 */
	proxy: function(context, callback) {
	
		return function() {
			callback.apply(context, arguments);
		}
		
	},
	
	/**
	 * Decodes content based on the given type.
	 *
	 * @param string content
	 *	The content to be decoded.
	 *
	 * @param string contentType
	 *	The type of content being decoded.
	 *
	 * @return object
	 *	The content decoded as a value.
	 */
	decode: function(content, contentType) {
	
		if(!contentType || contentType === 'application/json') {
			return JSON.parse(content);
		}
		
		if(contentType === 'application/x-www-form-urlencoded') {
			return $querystring.parse(content);
		}
		
		throw 'Unsupported content type "' + contentType + '"';
		
	},
	
	/**
	 * Encodes content based on the given type.
	 *
	 * @param string content
	 *	The content to be encoded.
	 *
	 * @param string contentType
	 *	The type of content being encoded.
	 *
	 * @return string
	 *	The object encoded to a string.
	 */
	encode: function(object, contentType) {
		
		if(!contentType || contentType === 'application/json') {
			return JSON.stringify(object);
		}
		
		if(contentType === 'application/x-www-form-urlencoded') {
			return $querystring.stringify(object);
		}
		
		throw 'Unsupported content type "' + contentType + '"';
		
	},
	
	/**
	 * Returns a boolean indicating wether or not the given object contains
	 * no properties.
	 *
	 * @param object object
	 *	The object to be verified.
	 *
	 * @return bool
	 *	Returns TRUE if the object is empty, FALSE otherwise.
	 */
	isEmpty: function(object) {
	
		if(object) {
			for(var i in object) {
				return false;
			}
		}
		
		return true;
		
	},
	
	/**
	 * Returns the specific type of value provided.
	 *
	 * @param mixed value
	 *	The value to get the type from.
	 *
	 * @return string
	 *	The object specific type name, which may be one of the following:
	 *	"boolean", "string", "float", "int", "array", "object", "null" and 
	 *	"undefined"
	 */
	getSpecificType: function(value) {
	
		// Determine the object type
		var type = typeof value;
		
		// Determine wether its a float or an integer
		if(type === 'number') {
			type = (value % 1 > 0) ? 'float' : 'int';
		} 
		
		// Determine the type of object
		else if(type === 'object') {
		
			// Null values
			if(value === null) {
				type = "null";
			} else {
				type = (value instanceof Array) ? 'array' : 'object';
			}
			
		}
		
		return type;
	},
	
	/**
	 * Invokes the given callback function for each property of the given
	 * object.
	 *
	 * @param array array
	 *	The array to perform the loop in.
	 *
	 * @param object context
	 *	The context to be applied to the callback.
	 *
	 * @param function(property, value) callback
	 *	The callback to be invoked for each property, which, in case it returns
	 *	true, will break out of the loop.
	 */
	foreach: function() {
	
		// Load the arguments according to its length
		var object, context, callback;
		
		switch(arguments.length) {
			
			case 2:
				object = arguments[0];
				callback = arguments[1];
			break;
			
			case 3:
				object = arguments[0];
				context = arguments[1];
				callback = arguments[2];
			break;
			
			default:
				throw 'Invalid argument count.';
		}
		
		// Invoke the callback for each property
		for(var i in object) {
			if(callback.call(context, i, object[i])) {
				break;
			}
		}
	
	},
	
	/**
	 * Converts a string based value to a given type by attempting to parse it
	 * and perform other validations.
	 *
	 * Multiple exceptions may be thrown if the value is not of in the correct
	 * format, which means you need to surround calls to this method with a 
	 * try-catch block.
	 *
	 * @param string value
	 *	The value to be converted to the new type.
	 *
	 * @param string type
	 *	The name of the specific type to convert the value to, which may be one
	 *	of the following: "float", "int", "boolean", "array", "undefined",
	 *	"null" and "string".
	 *
	 * @return mixed
	 *	The converted value.
	 */
	convert: function(value, type) {
	
		// Value must be either a string, null, false or undefined
		if(!value && ('string' !== typeof value)) {
			throw 'Invalid value of type "' + (typeof value) + '" given.';
		}
		
		switch(type) {
			
			case 'float':
				return value ? parseFloat(value) : 0;
			
			case 'int':
				return value ? parseInt(value) : 0;
			
			case 'boolean':
				return (value === 'true' || value === '1');
			
			case 'array':
				return value ? [ value ] : [];
			
			case 'undefined':
				return undefined;
			
			case 'null':
				return null;
			
			case 'string':
				return value ? value : '';
			
			default:
				throw 'Invalid type requirement "' + requirement + '"';
				
		}
	}

};
