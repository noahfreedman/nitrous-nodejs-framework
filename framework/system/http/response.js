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
	'system.eventEmitter',
	'system.http.cookie',
	'system.http.exception'

);

/**
 * Constructor
 *
 * @param ServerResponse response
 *	The underlying NodeJS ServerResponse instance.
 */
function HttpResponse(server, response) {
	this.__construct_eventEmitter();
	this._response = response;
	this._headersSent = false;
	this._closed = false;
	this._cookies = [];
	
	this.server = server;

	// Default values
	this.statusCode = 200;
	this.contentType = 'text/plain';
}

$.object.extend(HttpResponse.prototype,
	$.eventEmitter.prototype, {

	headers: {},

	/**
	 * Packs the response headers by packing this instance 'headers' object
	 * with the provided additional headers, as well as adding the cookies.
	 *
	 * @param object headers
	 *	An object defining the additional headers that will overwrite the
	 *	base ones.
	 *
	 * @return object
	 *	The packed headers as an object.
	 */
	_packHeaders: function(headers) {
	
		// Create a snapshot clone of the current headers
		var packed = $.object.clone(this.headers);
		
		// Extend the base headers with the additional headers
		if(headers) {
			$.object.extend(packed, headers);
		}
		
		// Add the 'Set-Cookie' header
		if(!$.object.isEmpty(this._cookies)) {
			
			var cookies = [];
		
			// Pack each cookie into a string
			for(var i in this._cookies) {
				cookies.push(this._cookies[i].pack());
			}
			
			// Add it to the response headers
			packed['Set-Cookie'] = cookies;
			
		}
		
		return packed;
	
	},
	
	/**
	 * Throws an exception if the connection has been closed.
	 */
	_checkConnectionState: function() {
		if(this._closed) {
			throw new $.httpException.ConnectionStateException
				(1, 'This response is already closed.');
		}
	},
	
	/**
	 * Throws an exception if the headers have been sent.
	 */
	_checkHeadersState: function() {
		if(this._headersSent) {
			throw new $.httpException.ConnectionStateException
				(2, 'Headers have already been sent.');
		}
	},
	
	/**
	 * Defines a new "Set-Cookie" cookie header for this response.
	 *
	 * @param string name
	 *	The name of the cookie to be defined.
	 *
	 * @param string value
	 *	The value of this cookie, as a string.
	 *
	 * @param int expiry
	 *	The ammount of seconds until the cookie expires.
	 *
	 * @param string domain
	 *	The domain this cookie applies to.
	 *
	 * @param string path
	 *	The path this cookie applies to.
	 */
	setCookie: function(name, value, expiry, domain, path) {
		this._cookies[name] =
			$.httpCookie.create(name, value, expiry, domain, path);
	},

	/**
	 * Sends an instant response, closing the response stream.
	 *
	 * @param int status
	 *	The response status code.
	 *
	 * @param string|object content
	 *	The content to be sent.
	 *
	 * @param string contentType
	 *	The contentType to be used when encoding the given object.
	 */
	send: function(status, content, contentType) {
	
		// The response must not be closed and headers not sent
		this._checkConnectionState();
		this._checkHeadersState();
		
		// Default content type
		if(!contentType) {
			contentType = 'application/json';
		}
		
		// Encode the content for display
		if('object' === typeof content) {
			content = $.object.encode(content, contentType);
		}
		
		// Build the response headers
		var headers = this._packHeaders({
			'Content-Type': contentType,
			'Content-Length': $.string.getByteLength(content)
		});
		
		// Write the contents
		this._response.writeHead(status, headers);
		this._headersSent = true;
		this._response.write(content, 'utf8');
		this.close();
	
	},
	
	/**
	 * Closes this response, making it unusable in the future.
	 */
	close: function() {
	
		this._checkConnectionState();
		this._response.end();
		this._closed = true;
		this.raise('close');
		
	}

});

module.exports = {

	_id: 'httpResponse',
	
	prototype: HttpResponse.prototype,
	
	create: function(server, response) {
		return new HttpResponse(server, response);
	}

};

