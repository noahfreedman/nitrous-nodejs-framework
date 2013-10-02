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

	_id: 'eventEmitter',
	
	prototype: {
	
		/**
		 * Constructor.
		 */
		__construct_eventEmitter: function() {
			this._handlers = {};
		},

		/**
		 * Raises the given event.
		 *
		 * @param string event
		 *	The name of the event to be raised.
		 *
		 * @param mixed ...
		 *	Additional arguments for the event handler callbacks.
		 *
		 * @return int
		 *	The number of callbacks invoked.
		 */
		raise: function(event) {

			// The number of invoked handlers
			var count = 0;
			var handlers = this._handlers[event];
			
			$.log('event', 'EventEmitter: raising event "' + event + '"');

			if(handlers) {
	
				// Create the initial arguments array
				var parameters = [ this ];
		
				// Add all extra arguments
				for(var i = 1, length = arguments.length; i < length; ++i) {
					parameters.push(arguments[i]);
				}
		
				// Invoke all registered event handlers
				for(var i in handlers) {
		
					var handler = handlers[i];
					handler[1].apply(handler[0], parameters);
			
					++count;
			
				}
	
			}
	
			return count;

		},

		/**
		 * Registers a callback method to handle a specific event.
		 *
		 * @param object context
		 *	The context to be applied to the callback function when it's called
		 *	at the time the event is raised. 
		 *
		 *	This argument can be omitted and, if so, the callback context will
		 *	be set to undefined.
		 *
		 * @param string event
		 *	The name of the event to register the callback handler to.
		 *
		 * @param function(source, event[, ...]) callback
		 *	The callback function to be called when the event is raised.
		 */
		on: function() {
	
			// Normalize the method arguments.
			var context, event, callback;
	
			switch(arguments.length) {
				case 2:
					event = arguments[0];
					callback = arguments[1];
				break;
				
				case 3:
					event = arguments[0];
					context = arguments[1];
					callback = arguments[2];
				break;
				
				default:
					throw 'Invalid argument count.';
			}
	
			// Create a new entry in the _handlers object.
			if(!this._handlers[event]) {
				this._handlers[event] = [];
			}
	
			// Register the event handler.
			this._handlers[event].push([ context, callback ]);
	
		}
		
	}
};


