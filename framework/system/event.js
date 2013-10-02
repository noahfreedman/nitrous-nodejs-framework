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
 * @param object source
 *	The object this event is being raised from.
 *
 * @param string name
 *	The name of the event represented.
 *
 * @param object data
 *	An object containing additional event data.
 */
function Event(source, name, data) {
	this._source = source;
	this._name = name;
	
	// Extend this event with additional data
	if(data) {
		$.object.extend(this, data);
	}
}

