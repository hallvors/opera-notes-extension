/*
* datamanager.js - maintains the data
*/
// TODO: listen for storage events and update?
// TODO: split "Data loading" to other script or method, context menu/background page needs only DataManager
function DataManager(){
	this._dirty=false; // needs saving
	this.update = function(id, property, value){
		this._map[id][property] = value;
		this._dirty=true;
	}
	this.get = function (id) {
		return this._map[id];
	}
	this.remove = function(id){
		var array = this._findParentArray(this.data, id);
		if (array) {
			this._dirty=true;
			return array[0].splice(array[1],1)
		}
	}
	this.add = function(newData, newParentId, nextSiblingIndex){
		// inserts the object newData somewhere in the hierarchy, typically inside the 
		// .children array of the object whose id is newParentId.
		// Also supports adding the object at a specific index in the array
		if (!newData) {return};
		if(newData instanceof Array)throw 'Object expected here, Sir';
		var arrayToModify;
		if(newParentId === undefined){ 
			// inserting either into "active" folder, 
			// or into the top-level array that contains all objects and folders
			var obj = this._findByProperty('active', true);
			if(obj && obj.children && ! obj['trash_folder']){
				arrayToModify = obj.children;
			}else{
				arrayToModify = this.data;
			}
		}else if(this._map[newParentId].type === 'folder'){
			if(this._map[newParentId].children){ // Is folder, has 'children'
				arrayToModify = this._map[newParentId].children;
			}else{ // unexpected error condition, but easy to recover from..
				arrayToModify = this._map[newParentId].children = [];
			}
		}
		if (!arrayToModify) {
			throw 'No way to add this item (wrong newParentId?)';			
		};
		if (nextSiblingIndex === undefined) {
			nextSiblingIndex = arrayToModify.length;
		};
		arrayToModify.splice(nextSiblingIndex,0,newData);
		if (!('id' in newData)) {
			this._mapIDs(newData);
		};
		this._dirty=true;
	}
	this.find = function(id){
		return this._findParentArray(this.data, id);
	}
	this._findByProperty = function(name, value){
		var found;
		try{
			this.iterate(this, function(obj){ 
				if(obj[name] === value){
					found = obj;
					throw 'found'; // interrupt iteration (is this a dumb way to do it?)
				}
			});
		}catch(e){} 
		return found;
	}
	this.move = function(id, newParentId, nextSiblingIndex){
		this.add(this.remove(id)[0], newParentId, nextSiblingIndex);
		this._dirty=true;
	}
	this._init = function(){
		this._map = [];
		this._counter = 0;
		this._mapIDs(this.data);
	}
	this._findParentArray = function(array, id){
		for( var i=0; i<array.length; i++ ){
			if (array[i].id == id) {
				return [array, i]
			};
			if(array[i].children){
				var maybe = this._findParentArray(array[i].children, id);
				if (maybe) { return maybe; };
			}
		}		
	}
	// make sure every object has a consecutive ID reference
	this._mapIDs = function(data){
		if (data instanceof Array) {
			this.iterate(this, function(obj){
				this._addID(obj);
			}, data );
		}else if(data instanceof Object){
			this._addID(data);
			if (data.children) {
				this._mapIDs(data.children);
			};
		}
	}
	this._addID = function(obj){
		obj.id = this._counter ++;
		this._map[obj.id] = obj;		
	}
	this.toJSON = function(data){ // our generated IDs will not be stored
		if(!data)data=this.data;
		return JSON.stringify(data, function(key, value){ return key === 'id' || key === 'elm' ? undefined : value; }, "  ");
	}
	this.saveData = function(){
		if(typeof chrome === 'undefined')return;
		chrome.storage.local.set({notesdata:this.toJSON()}, function(){
			//console.log(chrome.runtime.lastError);
			//console.log('save possibly complete?');
			//chrome.storage.local.get('notesdata', function(data){ console.log(data.notesdata) });
		}.bind(this)); // we could just store the object without JSON stringification,
		// but we'd have to make a clone to remove the generated IDs
		chrome.extension.sendMessage({'update_insert_note_menu':true})
		this._dirty=false; 
	}
	this.iterate = function(thisObj, func, array, parentObj){ // calls func on all objects in all arrays, recursively
		// thisObj is "this" inside func. Its first argument is the object, second is parent array, third index, fourth is the object that referenced the array
		if(!array){
			array = this.data; // start from the top if no "array" argument is supplied..
		}
		var args = [].slice.call(arguments, 4);
		args.splice(0,0,'','','',''); // placeholders for the four first entries, set for every loop iteration
		for (var i = 0, l=array.length; i < l; i++) {
			args.splice(0,4,array[i], array, i, parentObj);
			func.apply(thisObj, args);
			if(array[i].children){
				var iterateArgs = [thisObj, func, array[i].children, array[i]];
				if(arguments.length > 4){ // take care of extra arguments passed to iterate()
					iterateArgs = iterateArgs.concat([].slice.call(arguments, 4));
				}
				this.iterate.apply(this, iterateArgs);
			}
		};
	}
	// save regularly if updated
	setInterval( function(){
		if(this._dirty){
			this.saveData();
		}
	}.bind(this), 100 ); // the unload event doesn't save data, it seems. So this interval needs to be small
	window.addEventListener('unload', function(e){if(this._dirty)this.saveData();}.bind(this), false);
	this._setData = function(data){this.data = data;}
	this.loadData = function( callback ){
		var demodata;
		this._storageReturned=false;
		if(typeof chrome != 'undefined'){
			chrome.storage.local.get('notesdata', function(data){ // chrome.runtime.lastError ?
				this._storageReturned = true;
				//console.log( 'notesdata getter returns.. '+data );
				if(data.notesdata){
					demodata = JSON.parse(data.notesdata);
					//console.log('parsed '+demodata);
				}
			}.bind(this));
		}else{
			this._storageReturned=true;
		}
		setTimeout(function(){
			//console.log('timeout '+this._storageReturned);
			if (window.chrome && !this._storageReturned) { // while we're awaiting futures..
				return setTimeout(arguments.callee.bind(this), 5);
			};
			if (!demodata) {
				demodata = [ {
				   "created": 1366117078000.0,
				   "name": "Welcome to Opera Notes\n\nShortcuts: N for new note, Shift-N for new folder.\n\nMany other common shortcuts work as you might expect.",
				   "type": "note"
				}, {
				   "children": [ {
				      "created": 1366122814000.0,
				      "name": "trashed note",
				      "type": "note"
				   } ],
				   "created": 1366116808000.0,
				   "expanded": false,
				   "name": "Trash",
				   "trash_folder":true,
				   "type": "folder"
				} ];
			};
			this._setData(demodata);
			this._init();
			callback.call(this);
		}.bind(this), 4);
	}
}
