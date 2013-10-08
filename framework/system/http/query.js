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

	_id: 'httpQuery',
	
	/**
	 * Returns the type of action to performed based on the property value, as
	 * an integer.
	 *
	 * @param string
	 *	The property to determine the action from.
	 *
	 * @return int
	 *	The type of action to be performed, as following:
	 *		1: Push the value to the current node
	 *		2: Define the value in a index of the current node
	 *		3: Define the value for the property of the current node
	 */
	_getPropertyAction: function(property) {
		return (property === '') ? 1 : ((/^\d+$/).test(property) ? 2 : 3);		
	},

	/**
	 * Defines a property recursively, building all necessary nodes in between.
	 *
	 * @param object parent
	 *	The parent node object.
	 *
	 * @param object node
	 *	The current node object.
	 *
	 * @param int index
	 *	The current node property index.
	 *
	 * @param string[] properties
	 *	An array that results from exploding the original property name.
	 *
	 * @param mixed value
	 *	The value to be defined for the last node.
	 *
	 * @return bool
	 *	Returns TRUE on success, FALSE otherwise.
	 */
	_setRecursive: function(parent, node, index, properties, value) {

		// Get the required information
		var property = properties[index];
		var action = this._getPropertyAction(property);
		var array = (node instanceof Array);
		
		// Convert this node from an array to an object
		if(action > 2 && array) {
			
			var object = {};
			
			for(var i in node) {
				object[i] = node[i];
			}
			
			node = parent[properties[index - 1]] = object;
		}
		
		// Can not push a value to a non array node
		else if(action === 1 && !array) {
			return false;
		}
		
		// Get the next property name
		var next = properties[++index];
		
		// Push a value
		if(action === 1) {
			if(next === undefined) {

				// Push to the current node, which is an array
				node.push(value);
				return true;
				
			} else {
			
				// Create a child node, set it recursively and push it
				var child = this._getPropertyAction(next) > 2 ? {} : [];

				if(this._setRecursive(node, child, index, properties, value)) {
					node.push(child);
					return true;
				}
				
				return false;
			}
			
		} else {
		
			if(next === undefined) {
			
				// Define for the current node, which is an array or object
				node[property] = value;
				return true;
				
			} else {

				// Create a child node, set it recursively and push it
				var child = node[property];
				
				if(child === undefined) {
					child = this._getPropertyAction(next) > 2 ? {} : [];
					node[property] = child;
				}

				if(this._setRecursive(node, child, index, properties, value)) {
					return true;
				}
				
				return false;
			
			}
		
		}
		
	},

	/**
	 * Resolves the property name and extends the given object by creating
	 * all necessary nodes and setting the last one with the given value.
	 *
	 * @param object object
	 *	The object to be modified.
	 *
	 * @param string property
	 *	The property to be defined in this object.
	 *
	 * @param mixed value
	 *	The value to define the property with.
	 *
	 * @return bool
	 *	Returns TRUE on success, FALSE otherwise.
	 */
	set: function(object, property, value) {

		// Make sure the given property name is valid
		if(!(/\w+(\[\w+\])*/i).test(property)) {
			return false;
		}
		
		// Get the first token index
		var end = property.indexOf('[');
		
		if(end < 0) {
		
			// This property doesn't need to be set recursively
			object[property] = value;
			return true;
			
		}
		
		// Build the properties array
		var properties = [ property.substring(0, end) ];
		var offset = end + 1;
		
		while((end = property.indexOf(']', offset)) > -1) {
			properties.push(property.substring(offset, end));
			offset = end + 2;
		}
		
		return this._setRecursive(-1, object, 0, properties, value);
	},
	
	/**
	 * Parses the given raw query string and builds a new object based on
	 * it's properties and values.
	 *
	 * @param string query
	 *	The query string to parse.
	 *
	 * @return object
	 *	The resulting object.
	 */
	parse: function(query) {
	
		// Parse the URL encoded value into an object
		var object = {};
		var content = $querystring.parse(query);
		
		// Define each property recursively
		for(var property in content) {
			
			// Get the query string value
			var value = content[property];
			
			// Handle multiple properties
			if(value instanceof Array) {
			
				// Handle url encoded arrays					
				for(var i in value) {
					this.set(object, property, value[i]);
				}
				
				continue;
			}
			
			// Add a normal property
			this.set(object, property, value);
		}
		
		return object;
		
	}

};