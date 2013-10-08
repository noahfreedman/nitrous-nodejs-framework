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
	'url',
	'http',
	'querystring',
	
	'system.object',
	'system.string',
	'system.http.part',
	'system.http.query',
	'system.http.exception',
	'system.http.uploadedFile'

);

/**
 * Constructor
 *
 * @param HttpServer server
 *	The HttpServer instance this message belongs to.
 *
 * @param IncomingMessage message
 *	The NodeJS HttpMessage instance to base this message on.
 */
function HttpMessage(server, message) {
	this.__construct_eventEmitter();
	this._message = message;
	this._prepared = false;
	this.socket = message.socket;
	this.server = server;
}

$.object.extend(HttpMessage.prototype,
	$.eventEmitter.prototype, {
	
	/**
	 * Reads the message payload up to a limit of "limit" UTF8 characters,
	 * raising the 'error' and closing the input stream if that happens.
	 *
	 * @param IncomingMessage message
	 *	The underlying NodeJS IncomingMessage instance.
	 *
	 * @param int limit
	 *	The maximum number of UTF8 characters to read.
	 *
	 * @param function callback
	 *	The function to be invoked when the task completes.
	 */
	_readMessagePayload: function(message, limit, callback) {
	
		var _this = this;
	
		// Content received so far.
		var content = '';
		
		// Handle incoming data chunks
		message.on('data', function(chunk) {
		
			// Disallow messages that are over "limit" UTF-8 characters.
			if(limit && (content.length + chunk.length) > limit) {
				
				// Raise the event and destroy the message socket
				_this.raise('error', new $.httpException.
					MessageException(1, 'Content length exceeds limit.')
				);
				
				message.socket.destroy();
				
				return;
			}
			
			content += chunk;
			
		});
		
		// Handle the 'end' event for the underlying stream
		message.on('end', function() {
		
			callback.call(_this, content);
		
		});
		
		// Handle network errors
		message.on('error', function() {
				
			// Raise the event and destroy the message socket
			_this.raise('error', new $.httpException.
				MessageException(2, 'Network communication failure.')
			);
			
			message.socket.destroy();
		
		});
	
	},
	
	/**
	 * Parses the multipart message into the 'body' property of this message,
	 * as well as any uploaded files (or unknown content type data) into the
	 * files property.
	 *
	 * This method will raise the 'error' event on many different situations,
	 * including bad message format or missing data.
	 *
	 * Uploaded files (message.files) will be written directly into the file
	 * system, in order to avoid having them in memory.
	 *
	 * @param IncomingMessage message
	 *	The underlying NodeJS IncomingMessage instance.
	 *
	 * @param object contentTypeData
	 *	Additional content data.
	 *
	 * @param function callback
	 *	A function to be invoked when the task completes.
	 */
	_parseMultipartPayload: function(message, contentTypeData, callback) {
	
		var _this = this;
		
		// Make sure the boundary is given.
		if(!contentTypeData['boundary']) {
			return _raise_error(3, 'Multipart boundary is not defined.');
		}
		
		// Build the boundary string
		var boundary = '--' + contentTypeData['boundary'];
		var boundaryLength = boundary.length;
		
		$.debug('HttpMessage: processing "multipart/form-data" with boundary "' + boundary + '"');
		
		// Persistent data across chunks
		var activePart;
		var parts = {};
		var body = {};
		var files = {};
		var partsComplete = false;
		var parseError = false;
		
		// Invoke the error event with the given code and message
		var _raise_error = function(code, description) {
			
			// Raise the error event, close the message socket and stop
			_this.raise('error', new $.httpException.MessagePayloadParseException
				(code, description)
			);
			
			message.socket.destroy();
			
			// Stop processing further chunks
			parseError = true;
			
			return;
		
		};
		
		// Handle a payload chunk
		var _handle_payload_chunk = function(part, chunk, start, end, length) {
		
			// Create the buffer for this chunk piece
			var buffer = new Buffer(chunk.substring(start, end), 'binary');
		
			if(part.upload) {
				
				// Write the chunk into the temporary file handle
				var file = part.file;
				var handle = file._handle;
				
				file.length += length;
				$fs.writeSync(handle, buffer, 0, length);
				
				
			} else {
				
				// Encode the binary data as a UTF8 string and add it to the raw
				// part contents.
				part.raw += buffer.toString('utf8')
			
			}
		
		};
		
		// Handle the part completion
		var _handle_part_complete = function(part) {
		
			// Register the part by name
			var name = part.name;
			
			if(part.upload) {
			
				// Close the temporary file handle and register
				var file = part.file;
				var handle = file._handle;
				$fs.closeSync(handle);
				
				// Define the file part if length > 0
				if(file.length > 0) {
					$.httpQuery.set(files, name, file);
				}
			
			} else {
			
				// Parse the part contents according to the content type
				var contentType = part.contentType;
				var raw = part.raw;
				var content;
				
				// Plain text values also go to the part body
				if(contentType === 'plain/text') {
					content = raw;
				}
				
				// Parse the JSON content
				else if(contentType === 'application/json') {
				
					try {
						content = JSON.parse(raw);
					} catch (e) {
						return _raise_error(9, 'Bad format for part "' + name + '" of type "application/json".');
					}
				
				}
				
				// Decode the URL encoded values
				else if(contentType === 'application/x-www-form-urlencoded') {
				
					try {
						content = $.httpQuery.parse(raw);
					} catch (e) {
						return _raise_error(9, 'Bad format for part "' + name + '" of type "application/json".');
					}
					
				}
				
				// Define the part content in the body and itself
				part.content = content;
				$.httpQuery.set(body, name, content);
			
			}

		};
		
		// Handle multipart parsing completion
		var _handle_multipart_complete = function() {
			_this.body = body;
			_this.parts = parts;
			_this.files = files;
		};
		
		// Handle "data" events
		message.on('data', function(chunk) {
		
			// All parts have been parsed and if this happens it's because there
			// is something wrong with the request being made.
			if(partsComplete || parseError) {
				return;
			}
		
			// The chunk will often come in form of a buffer and for that reason
			// we will convert it to a binary encoded string.
			if(chunk instanceof Buffer) {
				chunk = chunk.toString('binary');
			}
			
			// Get the chunk length and offset
			var chunkLength = chunk.length;
			var chunkOffset = 0;
			
			while(chunkLength > chunkOffset) {
			
				if(!activePart) {
			
					// No active part is available at the moment, which means we
					// need to look for the next boundary.
					var boundaryIndex = chunk.indexOf(boundary, chunkOffset);
				
					if(boundaryIndex < -1) {
						return _raise_error(4, 'Multipart boundary not found.');
					}
				
					// Determine wether or not this is the last boundary
					var postBoundaryIndex = boundaryIndex + boundaryLength;
				
					if(chunk[postBoundaryIndex] === '-' && chunk[postBoundaryIndex + 1] === '-') {
					
						// Parts complete.
						partsComplete = true;
						_handle_multipart_complete();
						return;
					
					}
					
					// Escape the CR LF sequence
					chunkOffset = postBoundaryIndex + 2;
				
					// Read the part headers
					var partHeaders = {};
				
					while(chunkLength > chunkOffset) {
					
						// Find the next CR LF sequence, which delimits the end
						// of a part header.
						var headerDelimiterIndex = chunk.indexOf('\r\n', chunkOffset);
						
						if(headerDelimiterIndex < 0) {
							return _raise_error(5, 'Multipart header can not be split across chunks.');
						}
						
						// When an empty line is given with just this sequence
						// it means there are no more headers and the payload
						// will begin in the next line
						if(headerDelimiterIndex === chunkOffset) {
							chunkOffset += 2;
							break;
						}
						
						// Get the raw header and determine it's name and value.
						var header = chunk.substring(chunkOffset, headerDelimiterIndex);
						var headerName, headerNameDelimiterIndex, headerValue;
						
						if((headerNameDelimiterIndex = header.indexOf(': ')) > -1) {
							headerName = header.substring(0, headerNameDelimiterIndex).toLowerCase();
							headerValue = header.substring(headerNameDelimiterIndex + 2);
							headerValue = $.string.trim(headerValue, ' ');
						} else {
							headerName = header.toLowerCase();
							headerValue = true;
						}
						
						partHeaders[headerName] = headerValue;
					
						// Advance to the next header
						chunkOffset = headerDelimiterIndex + 2;
						
					}
					
					// Build the new part object
					var part;
					
					try { 
						part = $.httpPart.create(_this, partHeaders); 
					} catch (e) {
						return _raise_error(e.code, e.message);
					}
					
					// Register and activate the part
					parts[part.name] = part;
					activePart = part;
			
				}
			
				// Find the end of the currently active part
				var partDelimiterIndex = chunk.indexOf('\r\n' + boundary, chunkOffset);
			
				// Determine the current payload chunk offset and length
				var start = chunkOffset;
				var end = partDelimiterIndex < 0 ? chunkLength : partDelimiterIndex;
				var length = end - start;
			
				_handle_payload_chunk(activePart, chunk, start, end, length);
				
				// Check wether or not this is the last part
				if(partDelimiterIndex > -1) {
				
					// Parts complete.
					_handle_part_complete(activePart);
					activePart = undefined;
					
					if(chunk[end] === '-' && chunk[end + 1] === '-') {
						partsComplete = true;
						return;
					
					}
				
				}
			
				// Advance to the next chunk/part
				chunkOffset = end;
				
			}
		
		});
		
		message.on('end', function() {
		
			_this.raise('ready');
		
		});
			
	},
	
	/**
	 * Parses the message payload of type "application/json" into the
	 * 'body' property of this message.
	 *
	 * @param IncomingMessage message
	 *	The underlying NodeJS IncomingMessage instance.
	 *
	 * @param object contentTypeData
	 *	Additional content data.
	 *
	 * @param function callback
	 *	A function to be invoked when the task completes.
	 */
	_parseJsonPayload: function(message, contentTypeData, callback) {
	
		$.debug('HttpMessage: Parsing "application/json" part...');
	
		// Get the message payload content
		this._readMessagePayload(message, 524288, function(content) {
		
			try {
			
				// Attempt to decode the content and call the callback
				this.body = JSON.parse(content);
			
			} catch (e) {
				
				// Raise the error event and destroy the socket.
				this.raise('error', new $.httpException.
					MessagePayloadParseException(2, 'Invalid format for "application/json" content.')
				);
				
				message.socket.destroy();
				return;
				
			}
			
			// Invoke the referenced callback
			callback.call(this);
		
		});
		
	},
	
	/**
	 * Parses the URL encoded payload into the 'body' property of this object.
	 *
	 * @param IncomingMessage message
	 *	The underlying NodeJS IncomingMessage instance.
	 *
	 * @param object contentTypeData
	 *	Additional content data.
	 *
	 * @param function callback
	 *	A function to be invoked when the task completes.
	 */
	_parseUrlEncodedPayload: function(message, contentTypeData, callback) {
	
		$.debug('HttpMessage: Parsing "application/x-www-form-urlencoded" part...');
	
		// Get the message payload content
		this._readMessagePayload(message, 524288, function(content) {
		
			// Define the message body and invoke the callback
			this.body = $.httpQuery.parse(content);
			callback.call(this);
		
		});
	
	},
	
	/**
	 * Parses the message payload according to the given content type, raising
	 * the 'error' event with an instance of 'MessagePayloadParseException' on
	 * error.
	 *
	 * @param IncomingMessage message
	 *	The underlying NodeJS incoming message instance.
	 *
	 * @param string contentType
	 *	The content type of the message payload.
	 *
	 * @param function callback
	 *	The callback to be invoked once the payload has been sucessfully
	 *  parsed.
	 */
	_parseMessagePayload: function(message, contentType, callback) {
	
		// Get the content type name and data
		var ctname, ctdata, index = contentType.indexOf('; ');
		
		if(index > -1) {
			ctname = contentType.substring(0, index);
			ctdata = $querystring.parse(contentType.substring(index + 2), '; ');
		} else {
			ctname = contentType;
		}
		
		// Call the method specific for this content type
		switch(ctname) {
			
			// Handle application/json messages
			case 'application/json':
				return this._parseJsonPayload(message, ctdata, callback);
				
			// Handle multipart messages, which might include binary data
			case 'multipart/form-data':
				return this._parseMultipartPayload(message, ctdata, callback);
			
			// Handle standard URL encoded messages
			case 'application/x-www-form-urlencoded':
				return this._parseUrlEncodedPayload(message, ctdata, callback);
			
			// Invalid content type given
			default:
				this.raise('error', new $.httpException.
					MessagePayloadParseException(1, 
						'Unsupported content type "' + contentType + '" for message.'
					)
				);
				
				message.socket.destroy();
			
		}
		
	},
	
	/**
	 * Prepares this instance by reading from the underlying NodeJS HttpMessage
	 * input stream and parsing it's contents properly, as well as handling
	 * headers, payload parsing, file uploads, and other misc. tasks.
	 *
	 * @param function callback
	 *	A callback to be registered as the 'prepared' event handler.
	 */
	prepare: function() {
	
		// A message can not be prepared twice.
		if(this._prepared) {
			throw new $.httpException.
				MessageException(this, 1, 'Commands out of sync.');
		}
		
		// The underlying IncomingMessage instance
		var message = this._message;
		
		// Parse all the message headers into an object
		var headers = message.headers;
		
		// References
		this.headers = headers;
		this.method = message.method;
		this.statusCode = message.statusCode;
		
		// Parse the message cookies
		var cookies = {};
		
		if(headers['cookie']) {
		
			// Parse the header cookies and decode them from base64
			cookies = $querystring.parse(headers['cookie'], '; ', '=');
			
			for(var i in cookies) {
				cookies[i] = $.string.fromBase64(cookies[i]);
			}
			
		}
		
		this.cookies = cookies;
		
		// Content-type
		var contentType = headers['content-type'] ? 
			headers['content-type'] : 'application/x-www-form-urlencoded';
		
		this.contentType = contentType;
		
		// Url
		var rawUrl = message.url;
		var url = $url.parse(rawUrl);
		
		// Add the default pathname
		if(!url.pathname) {
			url.pathname = '/';
		}
		
		this.rawUrl = rawUrl;
		this.url = url;
		
		// Query string
		var rawQuery = url.query;
		this.rawQuery = rawQuery;
		this.query = rawQuery ? $.httpQuery.parse(rawQuery) : {};
		
		// Files and multipart content
		this.files = {};
		this.parts = {};
			
		// Parse the message payload
		this._parseMessagePayload(message, contentType, function() {
		
			// This message is ready for use
			this.raise('ready');
		
		});
	
	}
	
});

module.exports = {

	_id: 'httpMessage',
	
	prototype: HttpMessage.prototype,
	
	create: function(server, message) {
		return new HttpMessage(server, message);
	}

};


