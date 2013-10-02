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

	_id: 'string',
	
	/**
	 * Returns the length of the given string, in bytes.
	 *
	 * @param string value
	 *	The string to get the length from.
	 *
	 * @return int
	 *	The string byte length.
	 */
	getByteLength: function(value) {
		return Buffer.byteLength(value);
	},
	
	/**
	 * Encodes the given string through the Base64 algorithm.
	 *
	 * @param string value
	 *	The value to be encoded with Base64.
	 *
	 * @return string
	 *	The resulting Base64 encoded value.
	 */
	toBase64: function(value) {
		return new Buffer(value).toString('base64');
	},
	
	/**
	 * Decodes the given string through the Base64 algorithm.
	 *
	 * @param string value
	 *	The value to be decoded with Base64.
	 *
	 * @return string
	 *	The resulting decoded value.
	 */
	fromBase64: function(value) {
		return new Buffer(value, 'base64').toString();
	},

	/**
	 * Trims the given value by removing all characters in 'charlist' from
	 * the its left.
	 *
	 * @param string value
	 *	The string to have the characters removed from its left.
	 *
	 * @param string charlist
	 *	The list of characters to remove, either as a string or an array of
	 *	characters.
	 *
	 * @return string
	 *	The resulting trimmed value.
	 */
	trimLeft: function(value, charlist) {
	
		// Default trim characters list
		if(!charlist) {
			charlist = ' \t\r\n';
		}
		
		// Go through all characters
		var i, length = value.length;
		
		// Find the first index that doesn't match the charlist
		for(i = 0; i < length; ++i) {
		
			if(charlist.indexOf(value[i]) < 0) {
				return value.substring(i);
			}
		
		}
		
		return value;
		
	},
	
	/**
	 * Trims the given value by removing all characters in 'charlist' from
	 * the its right.
	 *
	 * @param string value
	 *	The string to have the characters removed from its right.
	 *
	 * @param string charlist
	 *	The list of characters to remove, either as a string or an array of
	 *	characters.
	 *
	 * @return string
	 *	The resulting trimmed value.
	 */
	trimRight: function(value, charlist) {
	
		// Default trim characters list
		if(!charlist) {
			charlist = ' \t\r\n';
		}
		
		// Go through all characters
		var i, length = value.length;
		
		// Find the first index that doesn't match the charlist
		for(i = length; i > 0; --i) {
		
			if(charlist.indexOf(value[i-1]) < 0) {
				return value.substring(0, i);
			}
		
		}
		
		return value;
		
	},

	/**
	 * Trims the given value by removing all characters in 'charlist' from
	 * the its left and right.
	 *
	 * @param string value
	 *	The string to have the characters removed from both sides.
	 *
	 * @param string charlist
	 *	The list of characters to remove, either as a string or an array of
	 *	characters.
	 *
	 * @return string
	 *	The resulting trimmed value.
	 */
	trim: function(value, charlist) {
	
		// Default trim characters list
		if(!charlist) {
			charlist = ' \t\r\n';
		}
	
		// Trim left and right
		value = this.trimLeft(value, charlist);
		value = this.trimRight(value, charlist);
		return value;
	
	},
	
	/**
	 * Splits the given string into an array based on the given separator, and
	 * excluding empty elements, making it suitable to parse CSV strings.
	 *
	 * All returned values will be trimmed from both sides.
	 *
	 * @param string value
	 *	The string to be exploded into an array.
	 *
	 * @param string separator
	 *	A delimiter placed between elements.
	 *
	 * @return string[]
	 *	The resulting array containing all non-empty values.
	 */
	explode: function(value, separator) {
		
		// Default separator
		if(!separator) {
			separator = ',';
		}
		
		// Split the parts by separator
		var parts = value.split(separator);
		var result = [];
		
		for(var i in parts) {
		
			// Trim this part and push it if it's not empty
			var value = this.trim(parts[i]);
			
			if(value) {
				result.push(value);
			}
			
		}
		
		return result;
		
	}

};
