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

module.exports = {

	_id: 'httpException',

	/**
	 * ServerException
	 *
	 * @param int code
	 *	The unique exception code.
	 *
	 * @param string message
	 *	The exception message.
	 */
	ServerException: function(code, message) {
		this.code = code;
		this.message = message;
	},
	
	/**
	 * MessageException
	 *
	 * @param int code
	 *	The unique exception code.
	 *
	 * @param string message
	 *	The exception message.
	 */
	MessageException: function(code, message) {
		this.code = code;
		this.message = message;
	},
	
	/**
	 * MessagePayloadParseException
	 *
	 * @param int code
	 *	The unique exception code.
	 *
	 * @param string message
	 *	The exception message.
	 */
	MessagePayloadParseException: function(code, message) {
		this.code = code;
		this.message = message;
	},
	
	/**
	 * MultipartParseException
	 *
	 * @param int code
	 *	The unique exception code.
	 *
	 * @param string message
	 *	The exception message.
	 */
	MultipartParseException: function(code, message) {
		this.code = code;
		this.message = message;
	},
	
	/**
	 * ConnectionStateException
	 *
	 * @param int code
	 *	The unique exception code.
	 *
	 * @param string message
	 *	The exception message.
	 */
	ConnectionStateException: function(code, message) {
		this.code = code;
		this.message = message;
	}

}
