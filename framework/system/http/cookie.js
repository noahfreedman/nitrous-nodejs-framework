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
	'system.string'
);

/**
 * Constructor.
 *
 * @param string name
 *	The cookie name, which must contain standard letters and optionally
 *	dashes and underscores in between.
 *
 * @param string value
 *	The cookie value, as a string.
 *
 * @param string expiry
 *	The ammount of time, in seconds, until browsers should delete the cookie.
 *
 * @param string domain
 *	The domain name which this cookie applies to.
 *
 * @param string path
 *	The path this cookie applies to (defaults to '/').
 */
function HttpCookie(name, value, expiry, domain, path) {

	// Make sure cookie name and value have the appropriate format
	if(!(/^[a-z]((\-|_)?[a-z0-9])+$/i).test(name)) {
		throw 'Invalid cookie name: "' + name + '"';
	}
	
	// Make sure the cookie path is valid
	if(path && !(/^(\/[a-z0-9]((\-|_)?[a-z0-9])*)+$/).test(path)) {
		throw 'Invalid cookie path: "' + path + '"';
	}
	
	// Make sure the cookie domain is valid
	if(domain && !(/^(\.[a-z]((\-|_)?[a-z0-9])+)(\.[a-z]((\-|_)?[a-z0-9])+)+$/).test(domain)) {
		throw 'Invalid cookie domain: "' + domain + '"';
	}
	
	// Convert the value to a base64 string
	value = value ? $.string.toBase64(value) : '';

	this.name = name;
	this.value = value;
	this.domain = domain;
	this.path = path ? path : '/';
	
	
	if(expiry) {
	
		// Parse the expiry and add it
		expiry = parseInt(expiry);
		
		if(expiry < 0) {
			throw 'Invalid expiry given: ' + expiry;
		}
		
		this.expiry = expiry;
		
	}
	
}

HttpCookie.prototype = {

	/**
	 * Returns the cookie as a string ready to be injected into the headers
	 * of an HTTP response.
	 *
	 * @return string
	 */
	pack: function() {
		
		// Build the basic cookie parts
		var parts = [ 
			this.name + '=' + this.value
		];
		
		// Path
		if(this.path) {
			parts.push('Path=' + this.path);
		}
		
		// Domain
		if(this.domain) {
			parts.push('Domain=' + this.domain);
		}
		
		// Expiry
		if(this.expiry) {
			
			// Determine the expiration date
			var expires = new Date();
			expires.setSeconds(expires.getSeconds() + this.expiry);
			
			parts.push('Expires=' + expires.toGMTString());
			
		}
		
		return parts.join('; ');
		
	}

};

module.exports = {

	_id: 'httpCookie',
	
	prototype: HttpCookie.prototype,
	
	create: function(name, value, expiry, domain, path) {
		return new HttpCookie(name, value, expiry, domain, path);
	}
	
};
