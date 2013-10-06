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
	'path',

	'system.object',
	'system.eventEmitter'

);

/**
 * Constructor.
 *
 * @param HttpServer server
 *	The instance of the server this session belongs to.
 *
 * @param HttpMessage request
 *	The instance of the request this session is associated with.
 *
 * @param HttpResponse response
 *	The instance of the response this session is associated with.
 */
function HttpSession(server, request, response) {
	this.__construct_eventEmitter();
	this.server = server;
	this.request = request;
	this.response = response;
	this.data = {};
	
	// Handle the response close event
	response.on('close', this, this.flush);
	
}

$.object.extend(HttpSession.prototype,
	$.eventEmitter.prototype, {
	
	_getSessionFileName: function(id) {
		
		// Determine the session file name
		var directory = this.server.getSessionDirectoryPath();
		return $path.join(directory, id);
		
	},
	
	_deleteSessionFromFileSystem: function() {
		
		// Delete the file from the file system
		var fileName = this._getSessionFileName(this.id);
		$fs.unlinkSync(fileName);
		
	},
	
	/**
	 * Writes the session data into the file system.
	 */
	flush: function() {	
		
		try {
			
			// Get the session file name.
			var fileName = this._getSessionFileName(this.id);
			
			$.debug('HttpSession: writting to file "' + fileName + '"');
			$fs.writeFile(fileName, JSON.stringify(
				this.data
			));
			
		} catch (e) {
			
			$.warning('HttpSession: unable to write session data!');
			$.warning(this.id);
			$.warning(e.message);
			
		}
	
	},
	
	/**
	 * Regenerates the session ID and deletes the old session from the
	 * file system, if applicable.
	 *
	 * @return string
	 *	The newly generated session id.
	 */
	regenerate: function() {
	
		// Generate the next session id
		var id = $.crypto.sha1($.crypto.random(5) + new Date().getTime());
	
		// Delete the old session file
		if(this.id) {
			
			try { 
			
				this._deleteSessionFromFileSystem(); 
				
			} catch (e) {
			
				$.error('HttpSession: ' + e.message);
				
			}
		}
		
		// Define the session cookie in the response and update the existing id
		this.response.setCookie('BRZSESSION', id);
		this.id = id;
		
		return id;
		
	},
	
	/**
	 * Prepares this session instance by parsing the current request and
	 * loading or creating a new session in the file system.
	 */
	prepare: function() {
	
		// Get the session cookie.
		var session;
		
		if(session = this.request.cookies['BRZSESSION']) {
			
			// Define the session id
			this.id = session;
			
			try {
				
				// Load the session data from the file system
				var fileName = this._getSessionFileName(session);
				var data = JSON.parse(
					$fs.readFileSync(fileName, { encoding: 'utf8' })
				);
				
				// Define or update the session data.
				this.data = data ? data : {};
				
			} catch (e) {
			
				$.warning('HttpSession: unable to read session data!');
				$.warning(session);
				$.warning(e.message);
				
			}
			
		} else {
			this.regenerate();
		}
		
		this.raise('ready');
	}
	
});

module.exports = {

	_id: 'httpSession',
	
	prototype: HttpSession.prototype,
	
	create: function(server, request, response) {
		return new HttpSession(server, request, response);
	}

};
