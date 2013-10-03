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

/**
 * Constructor.
 *
 * @param RestfulService service
 *	The service instance this context belongs to.
 *
 * @param HttpMessage request
 *	The instance of the request linked to this context.
 *
 * @param HttpResponse response
 *	The instance of the response linked to this context.
 *
 * @param HttpSession session
 *	The instance of the session linked to this context.
 */
function RestfulContext(service, request, response, session) {
	this.service = service;
	this.request = request;
	this.response = response;
	this.session = session;
}

module.exports = {

	_id: 'restfulContext',
	
	prototype: RestfulContext.prototype,
	
	create: function(service, request, response, session) {
		return new RestfulContext(service, request, response, session);
	}

};
