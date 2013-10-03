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

	// Breeze
	'system.string'
	
);

/**
 * Constructor.
 *
 * @param HttpMessage message
 *	The instance of the Multipart message this part belongs to.
 *
 * @param object headers
 *	An headers object to build the part from.
 */
function HttpPart(message, headers) {
	this.message = message;
	this.headers = headers;
	
	// Search for the part content disposition data
	var rawContentDisposition = headers['content-disposition'];
	
	// If the value doesn't start with "form-data; " something is
	// wrong with the request.
	var delimiterIndex = rawContentDisposition.indexOf('; ');
	
	if(delimiterIndex < 0) {
		throw new $.httpException.MultipartParseException
			(6, 'Invalid format for multipart "Content-Disposition" header.');
	}
	
	// Get the content-dispposition details
	var contentDispositionType = $.string.trim(
		rawContentDisposition.substring(0, delimiterIndex)
	);
	
	var contentDispositionData = $querystring.parse(
		rawContentDisposition.substring(delimiterIndex + 2), '; '
	);
	
	// Remove the quotes from the contentDispositionData fields
	for(var i in contentDispositionData) {
	
		var value = contentDispositionData[i];
		contentDispositionData[i] = value.substring(1, value.length - 1);
		
	}
	
	this.meta = contentDispositionData;

debugger;

	// Make sure the 'name' is defined in this content disposition
	var name = contentDispositionData['name'];
	if(!name) {
		throw new $.httpException.MultipartParseException
			(7, 'Invalid format for multipart "Content-Disposition" header.');
	}
	
	this.name = name;
	
	// Determine the content type
	var contentType = headers['content-type'] ?
		headers['content-type'] : 'plain/text';
		
	this.contentType = contentType;
	this.contentLength = 0;
		
	// Detect wether or not this part is an upload
	var upload = !(
	
		contentType === 'application/json' ||
		contentType === 'application/x-www-form-urlencoded' ||
		contentType === 'plain/text'
		
	);
	
	this.upload = upload;
	
	// Prepare the part file stream or raw content string
	if(upload) {
	
		try {
		
			// Create the uploaded file handle
			this.file = $.httpUploadedFile.create(this);
			
		} catch (e) {
			
			// It's most likely due to a permission issue
			throw new new $.httpException.ServerException
				(14, 'Failed to create uploaded file handle: ' + e.message);
			
			message.socket.destroy();
			return;
			
		}
		
	} else {
	
		// This will be filled by the message as multiple chunks come in before
		// being possibly parsed an inserted into 'body'.
		this.raw = '';
		
	}

}

module.exports = {

	_id: 'httpPart',
	
	prototype: HttpPart.prototype,
	
	create: function(message, headers) {
		return new HttpPart(message, headers);
	}

};
