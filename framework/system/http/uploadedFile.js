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

	// NodeJS
	'fs',
	'path',
	
	// Breeze
	'system.crypto'

);

/**
 * Constructor.
 *
 * @param HttpPart part
 *	The part this upload file belongs to.
 */
function HttpUploadedFile(part) {
	this.part = part;
	
	var meta = part.meta;
	
	// Create the temporary file handle
	var server = part.message.server;
	var uploadDirectory = server.getUploadDirectoryPath();
	var fileName = $path.join(uploadDirectory, $.crypto.random());
	var handle = $fs.openSync(fileName, 'wx');
	
	// Determine the name of the uploaded file
	this._handle = handle;
	this._path = fileName;
	this.name = meta.filename ? meta.filename : 'unknown';
	this.extension = $path.extname(this.name);
	this.type = part.contentType;
	this.length = 0;

};

HttpUploadedFile.prototype = {

	/**
	 * Returns the absolute path to the uploaded file.
	 *
	 * @return string
	 *	The uploaded file path.
	 */
	getPath: function() {
		return this._path;
	}

};

module.exports = {

	_id: 'httpUploadedFile',
	
	prototype: HttpUploadedFile.prototype,
	
	create: function(part) {
		return new HttpUploadedFile(part);
	}

};
