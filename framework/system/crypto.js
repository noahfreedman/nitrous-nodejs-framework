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

	'crypto'
	
);

module.exports = {

	_id: 'crypto',

	/**
	 * Runs the algorithm through the value and returns the result as a HEX
	 * encoded string.
	 *
	 * @param string algorithm
	 *	The name of the hashing algorithm to use.
	 *
	 * @param string value
	 *	The value to be hashed.
	 *
	 *  If this value is omitted a random value will be used run against the
	 *	specified hashing algorithm.
	 *
	 * @return string
	 *	Returns the hashed value as a HEX encoded string.
	 */
	hash: function(algorithm, value) {
	
		if(!value) {
			value = 'time-' + this.random() + '-' + (new Date().getTime());
		}
	
		return $crypto.createHash(algorithm)
			.update(value)
			.digest('hex')
		;
	},

	/**
	 * Runs the 'sha1' algorithm through the value and returns the result as 
	 * a HEX encoded string.
	 *
	 * @param string value
	 *	The value to be hashed.
	 *
	 * @return string
	 *	Returns the hashed value as a HEX encoded string.
	 */
	sha1: function(value) {
		return this.hash('sha1', value);
	},
	
	/**
	 * Runs the 'md5' algorithm through the value and returns the result as 
	 * a HEX encoded string.
	 *
	 * @param string value
	 *	The value to be hashed.
	 *
	 * @return string
	 *	Returns the hashed value as a HEX encoded string.
	 */
	md5: function(value) {
		return this.hash('md5', value);
	},
	
	/**
	 * Generates a random string of the given lenght, from the characters
	 * specified in the alphabet.
	 *
	 * @param int length
	 *	The number of characters for this string.
	 *
	 * @param string alphabet
	 *	A string containing all characters to be used in this randomization.
	 *
	 * @return string
	 *	The generated value.
	 */
	random: function(length, alphabet) {
	
		// Default length
		if(!length) {
			length = 12;
		}
		
		// Default alphabet
		if(!alphabet) {
			alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
		}
		
		// Save the alphabet limit
		var alphabetLimit = alphabet.length - 1;
		
		// Generate the random string
		var i, alphabetLength, result = '';
		
		for(i = 0; i < length; ++i) {
			
			// Get a random index
			var index = Math.round(Math.random() * alphabetLimit);
			result += alphabet[index];
			
		}
		
		return result;
	
	}

};
