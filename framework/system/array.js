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

module.exports = {

	_id: 'array',
	
	/**
	 * Returns an array containing the values in common between all given
	 * arrays.
	 *
	 * @param array base
	 *	The base array to compare the others against.
	 *
	 * @param array ...
	 *	The arrays to be compared.
	 *
	 * @return array
	 *	The intersection between all arrays.
	 */
	intersect: function(base) {
	
		// The result array
		var result = [];
		
		// Go through all elements in the base array
		for(var i in base) {
			
			var found = true;
			
			// Make sure the element is in all other arrays
			for(var j = 2; j < arguments.length; ++j) {
				if(arguments[j].indexOf(base[i]) < 0) {
					found = false;
					break;
				}
			}
			
			if(found === intersect) {
				result.push(base[i]);
			}
			
		}
		
		return result;
		
	},
	
	/**
	 * Returns a clone instance of the given array.
	 *
	 * @param array array
	 *	The array to create the clone from.
	 *
	 * @return array
	 *	Returns the clone array.
	 */
	clone: function(array) {
		return ([]).concat(array);
	},
	
	/**
	 * Returns an array containing the values that are present in the base
	 * array, but not in the subsequent ones.
	 *
	 * @param array base
	 *	The base array to compare against.
	 *
	 * @param array ...
	 *	The subsequent arrays to compare to.
	 *
	 * @return array
	 *	The difference between all arrays.
	 */
	diff: function(base) {
	
		// The result array
		var result = [];
		
		// Go through all elements in the base array
		for(var i in base) {
			
			var found = false;
			
			// Make sure the element is not in any of the other arrays
			for(var j = 1; j < arguments.length; ++j) {
				if(arguments[j].indexOf(base[i]) > -1) {
					found = true;
					break;
				}
			}
			
			if(!found) {
				result.push(base[i]);
			}
			
		}
		
		return result;
	},
	
	/**
	 * Merges the given arrays into one and returns it.
	 *
	 * @param array ...
	 *	The arrays to be merged together.
	 *
	 * @return array
	 *	The newly created array resulting from this merge.
	 */
	merge: function() {
		
		// Create a new base array
		var base = [];
		
		for(var i = 0; i < arguments.length; ++i) {
		
			// Process subsequent array
			var extender = arguments[i];
			
			for(var j in extender) {
			
				// Process each value
				var value = arguments[i][j];
				
				if(base.indexOf(value) < 0) {
					base.push(value);
				}
				
			}
		}
		
		return base;
	
	},
	
	/**
	 * Extends the given base array with elements from all subsequent arrays,
	 * unless the same element is already a member of it.
	 *
	 * Please note this function extends the base array directly, by reference,
	 * without cloning it. If you wish to create a new array from others you
	 * need to use "merge" instead.
	 *
	 * @param array base
	 *	The array to be extended.
	 *
	 * @param array ...
	 *	The subsequent arrays to extend with.
	 *
	 * @return array
	 *	The base array.
	 */
	extend: function(base) {
		
		for(var i = 1; i < arguments.length; ++i) {
		
			// Process subsequent array
			var extender = arguments[i];
			
			for(var j in extender) {
			
				// Process each value
				var value = extender[j];
				
				if(base.indexOf(value) < 0) {
					base.push(value);
				}
				
			}
		}
		
		return base;
	},
	
	/**
	 * Invokes the given callback function for each element of the array, 
	 * optionally in a given context.
	 *
	 * @param array array
	 *	The array to perform the loop in.
	 *
	 * @param object context
	 *	The context to be applied to the callback.
	 *
	 * @param function(value, index) callback
	 *	The callback to be invoked for each element, which, in case it returns
	 *	true, will break out of the loop.
	 */
	foreach: function() {
	
		// Load the arguments according to its length
		var array, context, callback;
		
		switch(arguments.length) {
			
			case 2:
				array = arguments[0];
				callback = arguments[1];
			break;
			
			case 3:
				array = arguments[0];
				context = arguments[1];
				callback = arguments[2];
			break;
			
			default:
				throw 'Invalid argument count.';
		}
		
		// Invoke the callback for each element
		for(var i in array) {
			if(callback.call(context, array[i], i)) {
				break;
			}
		}
	
	},
	
	/**
	 * Returns the number of elements that are common to all given arrays.
	 *
	 * @param array base
	 *	The base array to co
	 *
	 * @param array ...
	 *	The arrays to base the comparison on.
	 *
	 * @return int
	 *	The number of elements common to all arrays.
	 */
	match: function(base) {
		
		var matches = 0;
		
		// Go through the first array
		for(var i in base) {
			
			// Match flag
			var matching = true;
			var value = base[i];
		
			// Go through the subsequent arrays
			for(var j = 1, length = arguments.length; j < length; ++j) {
			
				if(arguments[j].indexOf(value) < 0) {
					matching = false;
					break;
				}
			
			}
			
			// Increment the match counter
			if(matching) {
				++matches;
			}
		
		}
		
		return matches;
	
	}

};
