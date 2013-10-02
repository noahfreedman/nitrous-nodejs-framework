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

// Nitrous dependencies
$path = require('path');

/**
 * Constructor
 */
function Nitrous() {

	// Determine the main module file name
	var pathSeparator = $path.sep;
	var mainScript = require.main.filename;
	var mainDirectoryIndex = mainScript.lastIndexOf(pathSeparator);
	var mainDirectory = mainDirectoryIndex > 0 ?
		mainScript.substring(0, mainDirectoryIndex) : pathSeparator;
	var mainPath = $path.normalize(mainDirectory);
	
	// Register the initial packages
	this._packages = {
		'system': __dirname + $path.sep + 'system',
		'application': mainPath
	};
	
	// Register the initial packages
	this._modules = {
		'path': $path,
	};
	
	this._moduleNames = [
		'path'
	];
	
	// Default nitrous flags
	this.flags = {
	
		log: {
			debug: true,
			warning: true,
			error: true,
			deprecated: true,
			event: true
		}
	
	};
	
	// Useful instances
	this._moduleDelimiterRegex = /\./g;

}

Nitrous.prototype = {
	
	/**
	 * Returns an array containing the instance of all modules loaded through 
	 * the 'using' or 'load' functions, indexed by name.
	 *
	 * @return object
	 */
	getModules: function() {
		return this._modules;
	},
	
	/**
	 * Returns an array containing the name of all modules loaded through the
	 * 'using' or 'load' functions.
	 *
	 * @return string[]
	 */
	getModuleNames: function() {
		return this._moduleNames;
	},
	
	/**
	 * Resolves and returns the path referenced by an alias.
	 *
	 * @param string alias
	 *	The alias to be resolved.
	 *
	 * @param string extension
	 *	The extension/prefix to be applied to the resolved path.
	 *
	 * @return string|bool
	 *	Returns the resolved path on success or FALSE on error.
	 */
	getAliasPath: function(alias, extension) {
	
		// Absolute paths can also be given
		if(alias.indexOf('@') === 0) {
			return alias.substring(1);
		}
	
		// Set the default extension
		if(extension === undefined) { 
			extension = '.js'; 
		}
	
		// Determine the package and the member value
		var index, packageName, memberName;
		
		if((index = alias.indexOf('.')) > -1) {
			packageName = alias.substring(0, index);
			packageMember = alias.substring(index + 1);
		} else {
			packageName = alias;
		}
		
		// Get package path, if possible
		var path = this._packages[packageName];
		
		if(!path) {
			return false;
		}
		
		// Add the member path, if applicable
		if(packageMember) {
			path += '/' + packageMember.replace(/\./g, $path.sep);
		}
		
		// Add the extension
		if(extension) {
			path += extension;
		}
		
		return path;
	},
	
	/**
	 * Loads the given module by name and returns its handle.
	 *
	 * @param string module
	 *	The module to be loaded.
	 *
	 * @return object
	 *	The module handle object.
	 */
	load: function(module) {
	
		// Skip previously loaded modules
		var instance = this._modules[module];
		
		if(instance) {
			return instance;
		}
	
		// Get the given module alias path, if possible
		var name = this.getAliasPath(module);
		var isCorePackage = name === false;
		
		// If the alias fails to be resolved, the module name will have to stay
		// as given in order to allow NodeJS modules to load.
		if(isCorePackage) {
			name = module;
		}
		
		// Require the module instance and cache it
		var instance = require(name);
		
		// Define the global variable and return it
		if(isCorePackage) {
		
			// Register nodejs modules
			global['$' + name] = instance;
			
		} else if(instance._id) {
		
			var id = instance._id;
		
			if(this[id]) {
			
				// Prevent some nasty bugs by disallowing property override
				throw 'The module "' + name + '" id "' + id + '" is invalid or already taken.';
				
			}
		
			// Register system and application modules
			this[id] = instance;
			
		}
		
		// Cache and return
		this._moduleNames.push(module);
		this._modules[module] = instance;
		return instance;
	
	},
	
	/**
	 * Loads the given modules by name if they were not loaded already.
	 *
	 * @param string module
	 *	The name of the module to load.
	 */
	using: function(/* 'module1', 'module2' */) {
	
		// Loads all the given modules
		for(var i in arguments) {
			this.load(arguments[i]);
		}
	
	},
	
	log: function(level, message) {
	
		// Make sure logging is enabled for this filter
		var flag = this.flags.log[level];
		
		if(flag === false) {
			return;
		}
	
		// Generate the formatted timestamp
		var now = new Date();
		var year = now.getFullYear();
		var month = now.getMonth() + 1;
		var day = now.getDate();
		var hour = now.getHours();
		var minute = now.getMinutes();
		var second = now.getSeconds();
		var millisecond = now.getMilliseconds();
		
		// Fix the milliseconds
		millisecond = millisecond.toString();
		
		var prefix = '';
		for(var i = millisecond.length; i < 4; ++i) {
			prefix += '0';
		}
		
		millisecond = prefix + millisecond;
		
		// Format the timestamp
		var timestamp = 
			year + '-' + 
			(month < 10 ? ('0' + month) : month) + '-' +
			(day < 10 ? ('0' + day) : day) + ' ' +
			(hour < 10 ? ('0' + hour) : hour) + ':' +
			(minute < 10 ? ('0' + minute) : minute) + ':' +
			(second < 10 ? ('0' + second) : second) + ' ' +
			millisecond
		;
		
		// Output the message
		console.log('[ ' + timestamp + ' ][ ' + level + ' ] ', message);
	
	},
	
	debug: function(message) {
		return this.log('debug', message);
	},
	
	error: function(message) {
		return this.log('error', message);
	},
	
	warning: function(message) {
		return this.log('warning', message);
	},
	
	deprecated: function(message) {
		return this.log('deprecated', message);
	}

};

// Register the global variables
var instance = new Nitrous();
global.Nitrous = instance;
global.$ = instance;



