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

// Register a new handler without arguments
$.app.handle('GET', '/', function() {

	// Get the current path
	var path = this.session.data.lastPath;
	this.session.data.lastPath = '/';
	
	// Send a response back to the client
	this.response.send(200, {
		path: '/',
		lastPath: path ? path : 'unknown',
		message: 'You have requested the route path.'
	});

});

// Register a new handler with arguments
$.app.handle('GET', '/say/$s', function(string) {

	// Get the current path
	var path = this.session.data.lastPath;
	this.session.data.lastPath = '/say/$s';

	// Send a response back to the client
	this.response.send(200, {
		path: '/say',
		lastPath: path ? path : 'unknown',
		message: 'What I have to say: "' + string + '"'
	});

});

// Register a basic "sum" request handler for two floats
$.app.handle('GET', '/sum/$f/$f', function(float1, float2) {

	// Get the current path
	var path = this.session.data.lastPath;
	this.session.data.lastPath = '/sum/$d/$d';

	// Send a response back to the client
	this.response.send(200, {
		path: '/sum',
		lastPath: path ? path : 'unknown',
		message: 'What I have to say: "' + (parseFloat(float1) + parseFloat(float2)) + '"'
	});

});

// Register a basic POST request that sends back the request body
$.app.handle('POST', function() {

	this.response.send(200, {
	
		contentType: this.request.contentType,
		body: this.request.body,
		partCount: this.request.parts.length,
		fileCount: this.request.files.length
	
	});

});

