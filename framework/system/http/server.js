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

	'system.object',
	'system.eventEmitter',
	'system.http.exception',
	'system.http.message',
	'system.http.response',
	'system.http.session'
	
);



/**
 * HttpServer.
 *
 * @param int port
 *	The port to list for incomming connections.
 */
function HttpServer(port) {
	this.__construct_eventEmitter();
	this._port = port;
	this._listening = false;
	this._test = 'hello';
	
	// Create the server instance
	this._server = $http.createServer(
		$.object.proxy(this, this._onRequest)
	);
	
}

$.object.extend(HttpServer.prototype,

	/* extends */
	$.eventEmitter.prototype, {
	
	/**
	 * Processes any incomming requests from the underlying NodeJS HttpServer
	 * implementation.
	 *
	 * @param IncomingMessage request
	 *	The incomming http request.
	 *
	 * @param HttpResponse response
	 *	The response object associated to the request.
	 */
	_onRequest: function(message, response) {
		
		// Create a new HttpMessage instance
		var message = $.httpMessage.create(this, message);
		var response = $.httpResponse.create(this, response);
		var session = $.httpSession.create(this, message, response);
		
		// Handle a generic error
		var handle_generic_error = function(source, error) {
		
			$.debug('HttpServer: message error: ' + error.message + ' (#' + error.code + ')');
		
			// Send the error response
			response.send(400, {
				status: 400,
				code: error.code,
				message: error.message
			});
		
		};
		
		// Wait until the message has been sucessfully prepared
		message.on('ready', this, function() {
			$.debug('Request is ready...');
			
			// Wait untill the session has been prepared.
			session.on('ready', this, function() {
		
				if(this.raise('request', message, response, session) < 1) {
					
					// If no event handlers take care of this the connection will
					// hang and cause stability issues.
					response.send(500, {
						'status': 500,
						'description': 'No "request" event handlers.'
					});
				
				}
				
			});
			
			// Prepare the session instance
			session.on('error', this, handle_generic_error);
			session.prepare();
		
		});
		
		// Prepare the message
		message.on('error', this, handle_generic_error);
		message.prepare();
		
	},
	
	/**
	 * Starts listening for incomming connections.
	 */
	start: function() {
	
		// This server is already listening
		if(this._listening) {
			throw new $.httpExceptions
				.ServerException(this, 1, 'Commands out of sync.');
		}
		
		// Define the upload directory path
		if(!this._uploadDirectoryPath) {
			this.setUploadDirectory('application.assets.uploads');
		}
		
		// Define the session directory path
		if(!this._sessionDirectoryPath) {
			this.setSessionDirectory('application.assets.sessions');
		}
		
		// Start listening
		var port = this._port;
		this._server.listen(port);
		this._listening = true;
	
	},
	
	/**
	 * Resolves the given directory alias.
	 *
	 * @param string directory
	 *	The alias to be resolved into an absolute path.
	 *
	 * @return string
	 *	The absolute path.
	 */
	_getDirectoryPathFromAlias: function(directory) {
	
		// Make sure the given alias is valid
		var path = $.getAliasPath(directory, null);
		
		if(!path) {
			throw 'Invalid directory alias given: "' + directory + '"';
		}
		
		try {
		
			// Make sure the path is indeed a directory.
			if(!$fs.statSync(path).isDirectory()) {
				throw 'Invalid directory alias given: "' + directory + '"';
			}
		
		} catch (e) {
		
			// Unable to read from the upload directory
			$.error('Unable to read from upload directory.');
			$.error('You can define a new directory by calling ' +
				'"server.setUploadDirectory" before starting the server.'
			);
			
			throw e;
			
		}
		
		return path;
		
	},
	
	/**
	 * Defines the full path to the directory where temporary session files
	 * resulting from processing incoming messages should be written to.
	 *
	 * @param string directory
	 *	An alias resolving to the session directory.
	 */
	setSessionDirectory: function(directory) {
		this._sessionDirectoryPath = this._getDirectoryPathFromAlias(directory);
	},
	
	/**
	 * Defines the full path to the directory where temporary files resulting
	 * from HTTP upload operations should be written into.
	 *
	 * @param string directory
	 *	An alias resolving to the upload directory.
	 */
	setUploadDirectory: function(directory) {
		this._uploadDirectoryPath = this._getDirectoryPathFromAlias(directory);
	},
	
	/**
	 * Returns the full path to the directory to where temporary files resulting
	 * from HTTP uploads should be written to.
	 *
	 * @return string
	 *	The absolute path to the upload directory.
	 */
	getUploadDirectoryPath: function() {
		return this._uploadDirectoryPath;
	},
	
	/**
	 * Returns the full path to the directory to where the session files are
	 * to be stored.
	 *
	 * @return string
	 *	The absolute path to the sessions directory.
	 */
	getSessionDirectoryPath: function() {
		return this._sessionDirectoryPath;
	},

});
	
// Module exports
module.exports = {

	_id: 'httpServer',
	
	prototype: HttpServer.prototype,

	create: function(port) {
		return new HttpServer(port);
	}

};


