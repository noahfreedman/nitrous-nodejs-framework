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

	'fs',
	'http',
	'querystring',
	
	'system.eventEmitter',
	'system.object',
	'system.array',
	
	'system.http.message'

);

/**
 * Constructor
 *
 * @param string protocol
 *	The protocol to be used when communicating with couch (default: 'http')
 *
 * @param string host
 *	The couchdb host name (default: 'localhost')
 *
 * @param int port
 *	The couchdb service port (default: 5984)
 *
 * @param string database
 *	The name of the database to work with.
 *
 * @param string user
 *	A user to use for HTTP authentication purposes.
 *
 * @param string password
 *	A password to use for HTTP authentication purposes.
 */
function CouchDatabase(protocol, host, port, database, user, password) {
	this.__construct_eventEmitter();
	this.protocol = protocol ? protocol : 'http';
	this.host = host ? host : '127.0.0.1';
	this.port = port ? port : 5984;
	this.database = database;
	
	// Base URL
	this.serviceUrl = this.protocol + '://' + this.host + ':' + this.port + '/';
	this.baseUrl = this.serviceUrl + this.database;
	
	// Authentication data
	this.authentication = user ? 
		(
			$.string.toBase64(user) + ':' +  
			(password ? $.string.toBase64(password) : '')
		) : undefined;
	
}

$.object.extend(CouchDatabase.prototype,
	$.eventEmitter.prototype, {
	
	_buildRequestOptions: function(method, path, query) {
	
		// Build the full path
		var fullPath = '/';
		
		if(path) {
			
			// The path was given as an array
			if(path instanceof Array) {
		
				// Clone the path to avoid modifying the original one
				var path = $.array.clone(path);
				
				// Encode all path components
				for(var i in path) {
					path[i] = encodeURIComponent(path[i]);
				}
			
				// Join all components together
				fullPath += path.join('/');
			}
			
			// Path given as a string with a trailing slash
			else if(path[0] === '/') {
				fullPath += path.substring(1);
			}
			
			// Good path given
			else {
				fullPath += path;
			}
			
		}
		
		if(query) {
		
			// Add the query delimiter
			fullPath += '?';
			
			// Add the query string directly
			if('string' === typeof query) {
				fullPath += query;
			}
			
			// Convert it from an object
			else {
			
				var parts = [];
				
				// Encode the query string properties
				for(var property in query) {
					
					var value = query[property];
					
					// JSON stringify the value if needed
					if(property === 'key' || property === 'keys' || 
							property === 'startkey' || property === 'endkey') {
							
						value = JSON.stringify(value);
					}
				
					// Register the query string components
					parts.push(
						encodeURIComponent(property) + '=' +
						encodeURIComponent(value)
					);
				}
				
				// Add all parts to the fullPath
				fullPath += parts.join('&');
			
			}
			
		}
	
		// Build and return the options instance
		return options = {
			method: method,
			host: this.host,
			hostname: this.host,
			port: this.port,
			path: fullPath,
			auth: this.authentication,
			headers: {
				Accept: 'application/json'
			}
		};
	
	},
	
	_prepareRequestedMessage: function(message, callback) {
		
		// Create a new message for this request
		var message = $.httpMessage.create(undefined, message);
		
		$.debug('CouchDatabase: requested message received...');
		
		// Wait until the message is ready for use
		message.on('ready', callback);
		
		// Process errors
		message.on('error', function(source, exception) {
			$.error('CouchDatabase: error processing incoming message.');
			$.error('CouchDatabase: error code=' + exception.code + '; message=' + exception.message);
		});
		
		$.debug('CouchDatabase: preparing message...');
		message.prepare();
		
	},
	
	/**
	 * Performs a POST or PUT request to CouchDB, depending on wether or not
	 * the property "_id" is defined in the given document.
	 *
	 * @param object document
	 *	The document to create or update in the database.
	 *
	 * @param object context
	 *	The context to be applied to the callback method.
	 *
	 * @param function(success, id, revision) callback
	 *	The callback to handle the completion event.
	 */
	store: function() {
	
		// Load arguments according to length
		var document, context, callback;
		
		switch(arguments.length) {
		
			case 2:
				document = arguments[0];
				callback = arguments[1];
			break;
			
			case 3:
				document = arguments[0];
				context = arguments[1];
				callback = arguments[2];
			break;
			
			default:
				throw 'Invalid argument count.';
				
		}
		
		// Determine the method and request path
		var path = [ this.database ];
		var method;
		
		if(document._id) {
			path.push(document._id);
			method = 'PUT';
		} else {
			method = 'POST';
		}
		
		// Build the request options
		var options = this._buildRequestOptions(method, path);
		options.headers['Content-Type'] = 'application/json';
		
		var _this = this;
		
		// Create the request
		var request = $http.request(options, function(message) {
			_this._prepareRequestedMessage(message, function(response) {
			
				// Get the response body
				var result = response.body;
				
				// Invoke the given callback
				if(!result.error) {
					callback.call(context, result.ok, result.id, result.rev);
					return;
				}
				
				// Log the couch error message
				$.error('CouchDatabase: error=' + result.error + '; reason=' + result.reason);
			
			});
		});
		
		// Write the request output data and execute it
		$.debug('CouchDatabase: ' + method + ' ' + options.path);
		request.write(JSON.stringify(document));
		request.end();
		
	},
	
	/**
	 * Performs a GET request to CouchDB, returning all matching results.
	 *
	 * @param string design
	 *	The design document to fetch data from.
	 *
	 * @param string view
	 *	The name of the view defined in the design document to fetch data
	 *	from.
	 *
	 * @param object query
	 *	An object containing the options to be specified in the request
	 *	query string.
	 *
	 * @param object context
	 *	The context to be applied to the callback function.
	 *
	 * @param function(records, rows) callback
	 *	The callback function to be invoked when fetch completes.
	 */
	get: function() {
	
		// Load arguments according to its length
		var design, view, query, context, callback;
		
		switch(arguments.length) {
		
			case 4:
				design = arguments[0];
				view = arguments[1];
				query = arguments[2];
				callback = arguments[3];
			break;
			
			case 5:
				design = arguments[0];
				view = arguments[1];
				query = arguments[2];
				context = arguments[3];
				callback = arguments[4];
			break;
			
		}
		
		// Build the request options
		var options = this._buildRequestOptions('GET', 
			[ this.database, '_design', design, '_view', view ], query
		);
		
		$.debug('CouchDatabase: GET ' + options.path);
		
		var _this = this;
		
		// Create and execute the request
		$http.request(options, function(message) {
			_this._prepareRequestedMessage(message, function(response) {
			
				// Get the message body
				var body = response.body;
			
				// Execute the callback if no further errors are detected
				if(!body.error) {
					
					var rows = body.rows;
					var documents = [];
					
					// Build the documents array
					for(var i in rows) {
						documents.push(rows[i].value);
					}
				
					callback.call(context, documents, rows);
					return;
				}
				
				// Log the couch error message
				$.error('CouchDatabase: error=' + body.error + '; reason=' + body.reason);
			
			});
		}).end();
	
	},
	
	/**
	 * Deletes the given document from the database.
	 *
	 * @param object document
	 *	The document to delete, which must have "_id" and "_rev" properly
	 *	defined.
	 *
	 * @param object context
	 *	The context to be applied to the callback method.
	 *
	 * @param function(success) callback
	 *	The callback to handle the completion event.
	 */
	delete: function() {
	
		// Load arguments according to its length
		var document, context, callback;
		
		switch(arguments.length) {
		
			case 2:
				document = arguments[0];
				callback = arguments[1];
			break;
			
			case 3:
				document = arguments[0];
				context = arguments[1];
				callback = arguments[2];
			break;
			
		}
	
		// Build the request options
		var options = this._buildRequestOptions('DELETE', 
			[ this.database, document._id ], { rev: document._rev }
		);
		
		$.debug('CouchDatabase: DELETE ' + options.path);
		
		var _this = this;
		
		// Create and execute the request
		$http.request(options, function(message) {
			_this._prepareRequestedMessage(message, function(response) {
				
				// Get the message body
				var body = response.body;
			
				// Execute the callback if no further errors are detected
				if(!body.error) {
					callback.call(context, body.ok);
					return;
				}
				
				// Log the couch error message
				$.error('CouchDatabase: error=' + body.error + '; reason=' + body.reason);
				
			});
		}).end();
	
	},
	
	
	setAttachment: function(document, name, type, file) {
	
		// Load the remaining arguments according to length
		var context, callback;
		
		switch(arguments.length) {
		
			case 5: 
				callback = arguments[4];
			break;
			
			case 6:
				context = arguments[4];
				callback = arguments[5];
			break;
			
			default:
				throw 'Invalid argument count.';
		
		}
		
		// Get the file handler
		var handle = $fs.openSync(file, 'r');
		
		// Assemble the request options
		var options = this._buildRequestOptions('PUT', 
			[ this.database, document._id, name ], { rev: document._rev }
		);
		
		options.headers['Content-Type'] = type;
		options.headers['Transfer-Encoding'] = 'chunked';
		
		$.debug('CouchDB: PUT ' + options.path);
		
		var _this = this;
		
		// Create and execute the request
		var request = $http.request(options, function(message) {
			_this._prepareRequestedMessage(message, function(response) {
		
				// Get the message body
				var body = response.body;
			
				// Execute the callback if no further errors are detected
				if(!body.error) {
					callback.call(context, body.ok, body.id, body.rev);
					return;
				}
				
				// Log the couch error message
				$.error('CouchDatabase: error=' + body.error + '; reason=' + body.reason);
		
			});
		});
		
		// Write the attachment data
		var buffer = new Buffer(4096);
		var length;
		
		while((length = $fs.readSync(handle, buffer, 0, 4096, null)) > 0) {
			request.write(buffer, 'binary');
		}
		
		// Close the file handle and finish the request
		$fs.closeSync(handle);
		request.end();
		
	}
	
});

module.exports = {

	_id: 'couchDatabase',
	
	create: function(protocol, host, port, database, user, password) {
		return new CouchDatabase(protocol, host, port, database, user, password);
	}
	

};
