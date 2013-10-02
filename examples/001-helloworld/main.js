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

// Load the Nitrous bootstrap file
require('./../../framework/nitrous.js');

// Declare the required modules
$.using(

	'system.http.server',
	'system.restful.service'
	
);

// Create a new HttpServer to listen, and the service
var server = $.httpServer.create(1337);
var service = $.restfulService.create(server);

// Define the temporary assets directories
server.setSessionDirectory('application.assets.sessions');
server.setUploadDirectory('application.assets.uploads');

// Register the service as the 'app' module and start listening
$.app = service;
server.start();

// Load all application modules
$.using(

	'application.modules.helloworld'

);

