/*
* Treeview.js - implements visuals and action of the Notes folder tree
* var tree = new Treeview(root);
* tree.associateDataManager(datamanager);
* tree.render();
* tree.add() ?
* tree.remove() ?
*/

var Treeview = function(root){
	this.root = root;
	this.editor = document.getElementsByTagName('textarea')[0];
	this._clipboard={data:undefined, node:undefined, method:undefined};
	var counter=0;
	var activeNode;
	this.render = function(parentNode, data){
		// recursively adds all visible nodes and folders to tree
		if(!parentNode)parentNode = this.root;
		this._insertionParentElm = parentNode;
		this.datamanager.iterate(this, function(obj, parentArray, index, parentObj){
			if (parentObj && !parentObj.expanded) {return;};
			this._addToDOM(this._insertionParentElm, obj);
			if(obj.type === 'folder' && obj.children && obj.children.length){
				if ( obj.expanded) { // if this has children, it needs to be set as the new parentElm
					this._insertionParentElm = obj.elm;
				}
			}else if (obj.type === 'folder') {
				obj.elm.classList.add('empty');			
			}
			if ((parentArray.length === index+1) && (obj.type === 'note' || (obj.type === 'folder' && (obj.expanded === false || obj.children.length === 0))) && root.contains(obj.elm.parentNode.parentNode)) {
				this._insertionParentElm = obj.elm.parentNode.parentNode;
			};
			if(obj.active){
				activeNode = obj.elm;
			}
		}, data?data.children:undefined, data, parentNode);
		if(!activeNode)activeNode = document.getElementsByTagName('button')[0];
		if (activeNode.tagName === 'DIV') {
			activeNode = activeNode.getElementsByTagName('button')[0];
		};
		activeNode.focus(); // auto-focus active (or first) element in list
		tryReallyHardToFocus(activeNode);			
		this._insertionParentElm = undefined;
	}
	this._addToDOM = function(parent, item){
		if (item instanceof Array) {
			for(var i=0;i<item.length;i++){
				arguments.callee.call(this, parent, item[i]);
			}
			return;
		};
		var elm;
		item.label = firstLine(item.name);
		if(item.type === 'folder'){
			elm = addElm('div', parent, {'class':'folder'});
			addElm('button', elm, {'class':'folderheader', 'draggable':'true', 'data-item-i-d':item.id }).appendChild(document.createTextNode(item.label));
			if( item.expanded ){
				elm.classList.add('expanded');
			}
			// Remember this folder if it's the trash folder				
			if (item['trash_folder']) {
				this.trash = elm;
				elm.firstChild.removeAttribute('draggable');
				elm.classList.add('trash');
			};
		}else{
			elm = addElm('button', parent, {'class':item.type, 'draggable':'true'});
			elm.appendChild(document.createTextNode(item.label));
			if (item.url) {
				elm.setAttribute('data-url', item.url);
				elm.classList.add('web');
			}
		}
		item.elm = elm;
		elm.dataset.itemID = item.id || (item.id = counter++);
		return elm;
	}
	this.addItem = function(type, url, focusNode){
		// find folder of currently active note/folder
		var elm;
		var data = {'type':type, name:''};
		if(type === 'folder')data.children = [];
		if(url)data.url = url;
		if(focusNode){
			elm = focusNode;
		}else if(document.activeElement === this.editor){
			elm = this._editingFocus;
		}else if (document.activeElement.tagName === 'BUTTON') {
			elm = document.activeElement;
		}else{
			elm = document.getElementsByTagName('button')[0];
		}
		elm=elm.parentNode; // now points to <div class="folder"> ..
		if (elm.classList.contains('trash')) { // No "new" notes in Trash, please
			elm = this.root;
		};
		this.datamanager.add(data, elm.dataset.itemID);
		if( elm.classList.contains('empty') ){
			elm.classList.remove('empty');
		}
		if(!(elm === this.root || elm.classList.contains('expanded'))){
			this.toggleFolderState(elm, 'expanded'); // toggleFolderState() will add children to DOM
			var newelm = elm.lastChild;
		}else{
			var newelm = this._addToDOM(elm, data);
		}
		if (type === 'folder') {
			newelm.classList.add('empty');
			newelm.firstChild.focus();
		}else if (type === 'note') {
			newelm.focus();		
		};
		this.editor.focus();
		this.editor.select();
	}
	this._navInList = function(direction, startNode){
		for(var i=0,btns=root.getElementsByTagName('button'),btn; btn=btns[i]; i++){
			if( btn === startNode ){
				i = (direction === 'UP') ? i-1 : i+1;
				if (btns[i]) {
					btns[i].focus();
				};
				break;
			}
		}
	}
	this._pgMove = function(direction){
		// here's a fun challenge (though if we used A instead of BUTTON maybe it would just work?)
		// height of container: this.root.offsetHeight, current scroll position: this.root.scrollTop
		// top of focused node (relative to body): document.activeElement.offsetTop
		var onePageHeight = this.root.offsetHeight;
		var currentPageTop = this.root.scrollTop;
		var newTopPos = (direction == 'up') ? currentPageTop - onePageHeight : currentPageTop + onePageHeight;
		var focusedElmDistanceFromScrollTop = document.activeElement.offsetTop - this.root.scrollTop;
		this.root.scrollTop = newTopPos;
		// SFSG?! Wait until we calculate what the next node to focus should be...
		var list = document.getElementsByTagName('button');
		if(newTopPos<0){
			list[0].focus();
		}else if(newTopPos >= this.root.scrollHeight){
			list[list.length-1].focus();
		}else{
			focusedElmDistanceFromScrollTop = focusedElmDistanceFromScrollTop + newTopPos;
			for (var i =0, l = list.length; i < l; i++) {
				if(list[i].offsetTop >= focusedElmDistanceFromScrollTop){
					list[i].focus();
					break;
				}
			};
		}
	}
	this.toggleFolderState = function(node, newState){
		if (!(node.classList.contains('folderheader')||node.classList.contains('folder'))) {return};
		if (node.tagName === 'BUTTON') { node = node.parentNode; };
		if (newState == undefined) {
			newState = node.classList.contains('expanded') ? 'collapsed' : 'expanded';
		};
		var data = this.datamanager.find(node.dataset.itemID);
		// returns [array reference, index]
		var parentArray=data[0], data=data[0][data[1]];
		if(!data || data && data.type === 'folder' && data.children.length === 0){
			node.classList.add('empty');
			node.classList.remove('expanded');
			return;
		}
		// No matter if the folder is expanded or collapsed, it's still focused and thus should be remembered as "active" node
		this.setAsActiveID(node.dataset.itemID);
		if (newState === 'collapsed') {
			while( node.childNodes.length>1 ){
				node.removeChild(node.lastChild);
			}
			node.classList.remove('expanded');
			this.datamanager.update(node.dataset.itemID, 'expanded', false);
		}else if (!node.classList.contains('expanded')) {
			this.datamanager.update(node.dataset.itemID, 'expanded', true); // must happen first, or render() shows nothing
			this.render(node, data);
			//this._addToDOM(node, data.children);
			node.classList.add('expanded');
		};
	}
	this.deleteItem = function(node, skipTrash){
		var nodeToFocus = nextNodeOfType(node);
		if ( node.classList.contains('folderheader') && node.tagName === 'BUTTON' ) {
			node = node.parentNode; // we want to remove/move the DIV that marks the folder
		};
		var parent = node.parentNode;
		if(node === this.trash || node.contains(this.trash)){return;} // don't allow deleting the Trash itself
		var nodeindex = nodeListIndexOf(parent.childNodes, node);
		if (this.trash.contains(node) || skipTrash) { // already in trash, let's remove it completely
			this.datamanager.remove(node.dataset.itemID);
			node.parentNode.removeChild(node);
		}else{
			this.datamanager.move(node.dataset.itemID, this.trash.dataset.itemID);
			if (this.trash.classList.contains('expanded')) { // only append stuff in the DOM if the folder is expanded
				this.trash.appendChild(node);
			}else{
				node.parentNode.removeChild(node);
				if(!this.trash.classList.contains('collapsed')){
					this.trash.classList.add('collapsed');
				}
				this.trash.classList.remove('empty');
			}
		}
		this.toggleFolderState(parent, 'expanded'); // update state of folder - will set empty if empty
		// moving focus..
		if(! root.contains(nodeToFocus)){ 
			// the node we wanted to focus is in trash or gone completely - what do we do?
			if(parent.childNodes[nodeindex]){
				parent.childNodes[nodeindex].focus();
			}else if (parent.childNodes[nodeindex-1]) {
				parent.childNodes[nodeindex-1].focus();
			}else{ // we assume that the last-ish node was removed, so set focus to the last one..
				var list = document.getElementsByTagName('button');
				list[list.length-1].focus();
			}
		}else if (root.contains(nodeToFocus)) {// still in the main tree, let's keep focus there
			nodeToFocus.focus();
		}
		if(document.activeElement.dataset.itemID)this.setAsActiveID(document.activeElement.dataset.itemID);
	}
	this.hasClipboardItems = function(){
		return typeof this._clipboard.data !== 'undefined';
	}
	this._writeClipboard = function(node){
		if(node.classList.contains('folderheader')){
			node = node.parentNode; // make sure we refer to the DIV that contains all the folder children
		}
		this._clipboard.node = node;
		var data = this.datamanager.find(node.dataset.itemID);
		this._clipboard.data = data[0][data[1]];
	}
	this.cutItem = function(node){
		if(this.trash === node || this.trash.firstChild === node){
			return; // hi there, don't cut away the trash..
		}
		this._writeClipboard(node);
		this.deleteItem(node, true);
	}
	this.copyItem = function(node){
		this._writeClipboard(node);
	}
	this.pasteItem = function(target){
		// clone data and node to enable multiple paste operations:
		var newData = JSON.parse(this.datamanager.toJSON(this._clipboard.data));
		var newNode = this._clipboard.node.cloneNode(true);
		this.datamanager.add(newData); // data will be moved to the right place from the insertNode method thanks to being linked to the new node by id reference
		newNode.dataset.itemID = newData.id;
		newData.elm = newNode;
		this._insertNode(target, newNode);
		this._syncItemIDs(newNode, newData);
	}
	this._insertNode = function(refNode, elm, posHint){
		// refNode: target of drop, focused node when pasting..
		// elm: element that should be moved/inserted
		// posHint: should new element be above or below refNode?
		var index, newParentNode = refNode;
		if(this.root.contains(elm.parentNode)){ // presumably being DnD'ed (not pasted), as it exists in tree
			if(elm.parentNode.classList.contains('folder') && elm.parentNode.childNodes.length === 2){
				elm.parentNode.classList.add('empty'); // will be empty (only folderheader element left) when dragged item is removed
			}
		}
		if(refNode.classList.contains('note')){
			newParentNode = refNode.parentNode;
			index = nodeListIndexOf(newParentNode.childNodes, refNode);
		}else if (refNode.classList.contains('folderheader')) {
			newParentNode = refNode.parentNode;
			index = newParentNode.childNodes.length; // folder is focused, just add to end of list..
		}else if (refNode.tagName === 'DIV') { // dropped at / pasted into main root DIV?
			index = refNode.childNodes.length; 
		}
		if(newParentNode.classList.contains('expanded')){ // only actually modify the DOM if we work on/in an expanded folder
			if(posHint == 'after'){
				if (newParentNode.childNodes[index].nextSibling) {
					index++;
				}
			}
			if (index === newParentNode.childNodes.length) {
				newParentNode.appendChild(elm);
			}else{	
				newParentNode.insertBefore(elm, newParentNode.childNodes[index]);
				index--; // decrementing here gets the placement correct in the data arrays
			}
		}else{
			if(elm.parentNode)elm.parentNode.removeChild(this._dragElm); // even when dropping on a collapsed folder, the item we started dragging should be removed from the DOM
			if(refNode.focus)refNode.focus(); // Make sure focus doesn't disappear..
		}
		newParentNode.classList.remove('empty');
		this.datamanager.move(elm.dataset.itemID, newParentNode.dataset.itemID, index);
	}
	this._syncItemIDs = function( elm, data ){
		if(data.id){
			elm.dataset.itemID = data.id;
			data.elm = elm;
		}
		// if data has a "children" array, we expect corresponding DOM nodes..
		// but we do have to work around the extra DIV for folders.
		if (!(data.children||data.length)){
			return;
		};
		var array = data.length ? data : data.children && data.children.length ? data.children : null;
		var childElm;
		if(! array) return;
		for (var i = array.length - 1; i >= 0; i--) {
			//console.log(i+ ' '+data.children[i].type+' '+elm.childNodes[i].classList);
			childElm = elm.childNodes[i + 1]; // 1 for the folderheader
			if (array[i].type === 'note') {
				// there should be a BUTTON class="note" at elm.childNodes[i]..
				if (childElm && childElm.classList && childElm.classList.contains('note')) {
					childElm.dataset.itemID = array[i].id;
					array[i].elm = childElm;
				}else{
					debugger; // Help!
				}
			}else if (array[i].type === 'folder') {
				// now we expect a DIV class="folder" with - *if* the folder is expanded - 
				// a BUTTON class="folderheader" inside, both of these should have itemID pointing to
				// array[i].id
				if (childElm && childElm.classList && childElm.classList.contains('folder')) {
					childElm.dataset.itemID = array[i].id; // this is the DIV
					array[i].elm = childElm;
					if(array[i].expanded){
						childElm.childNodes[0].dataset.itemID = array[i].id; // this is the folderheader
						if(array[i].children){// folder has children!
							this._syncItemIDs(childElm, array[i].children);
						}
					}
				}else{
					debugger; // Help!
				}

			}
			/*
			elm.childNodes[i].dataset.itemID = array[i].id;
			array[i].elm = elm.childNodes[i];
			if (elm.childNodes[i-1] && elm.childNodes[i-1].classList.contains('folderheader')) {
				array[i].elm = elm;
				elm.childNodes[i-1].dataset.itemID = array[i].id;
			}*/
		};
	}
	this._openURL = function(node, active){
		if (node.getAttribute('data-url')) {
			if (active === undefined) {active = true};
			chrome.tabs.create({url:node.getAttribute('data-url'), 'active':active});
			return true;
		};
	}

	var keys = {'38':'UP', '40':'DOWN', '37':'LEFT', '39':'RIGHT', '9':'TAB', '13':'ENTER','46':'DEL', '78':'N', '88':'X', '86':'V','67':'C', '36':'HOME', '35':'END', '33':'PGUP', '34':'PGDOWN'};

	document.addEventListener('keydown', function(e){
		if(!this.root.contains(e.target) && e.keyCode !== 9)return; // the only key we need to detect in the TEXTAREA is the TAB key
		if(e.keyCode === 9 && e.altKey)return; // another attempt at allowing alt-tab...
		if( e.keyCode in keys  ){
			switch(keys[e.keyCode]){
				case 'UP':
				case 'DOWN':
					if(e.target != this.editor){
						this._navInList( keys[e.keyCode], e.target );
						e.preventDefault();
						e.stopPropagation();
					}
					break;
				case 'TAB':
					if(e.altKey)return true; // allow alt-tab'ing
					if (document.activeElement === this.editor) {
						this._editingFocus.focus();
						tryReallyHardToFocus(this._editingFocus);
					}else{
						this.editor.focus();
						tryReallyHardToFocus(this.editor);
						this.editor.selectionStart = this.editor.value.length;
					}
					e.preventDefault();
					break;
				case 'ENTER':
					if(this._openURL(e.target, !e.ctrlKey)){
						e.preventDefault();
					}
					break;
				case 'DEL':
					this.deleteItem(e.target);
					break;
				case 'LEFT':
					this.toggleFolderState(e.target, 'collapsed')
					e.preventDefault();
					e.stopPropagation();
					break;

				case 'RIGHT':
					this.toggleFolderState(e.target, 'expanded')
					e.preventDefault();
					e.stopPropagation();
					break;
				case 'HOME':
					document.getElementsByTagName('button')[0].focus();
					e.preventDefault();
					e.stopPropagation();
					break;
				case 'END':
					var list = document.getElementsByTagName('button');
					list[list.length-1].focus();
					e.preventDefault();
					e.stopPropagation();
					break;
				case 'N':
					if(e.target === this.editor) break;
					if (e.shiftKey){
						this.addItem('folder');
						e.preventDefault();
					}else{
						this.addItem('note');
						e.preventDefault();
					};
					break;
				case 'V':
				case 'X':
				case 'C':
					if(e.ctrlKey){
						var action = keys[e.keyCode] === 'C' ? 'copy' : keys[e.keyCode] == 'X' ? 'cut': 'paste';
						this[action+'Item'](e.target);
						e.preventDefault();
					}
					break;
				case 'PGUP':
					this._pgMove('up');
					break;
				case 'PGDOWN':
					this._pgMove('down');
					break;
			}
		}
	}.bind(this), false);
	// for some reason clicking our elements in Chrome/Opium doesn't focus them
	this.root.addEventListener('click', function(e){
		if(e.target.focus && e.target.tagName !== 'DIV'){
			e.target.focus();
		}else if(e.target === this.root){
			document.getElementsByTagName('button')[0].focus();
		}
		// TODO: click should collapse/expand folders
		if (e.target.classList.contains('folder')) {
			if(e.offsetX <= 18){ // clicked on the collapse/expand icon's area
				this.toggleFolderState(e.target);
			}
		};
	}.bind(this),false);
	this.root.addEventListener('dblclick', function(e){
		if (e.target.classList.contains('web')) {
			this._openURL(e.target, !e.ctrlKey);
		}else if (e.target.classList.contains('folderheader')) {
			this.toggleFolderState(e.target);
		};
	}.bind(this), false);
	this.root.addEventListener('focus', function(e){
		var elm = e.target;
		if(elm.tagName === 'BUTTON'){
			this.editor.value = this.datamanager.get(elm.dataset.itemID).name;
			removeAllClasses(document, 'inactive_focus');
		}
		var activeID = elm.dataset.itemID ? elm.dataset.itemID  : null;
		this.setAsActiveID(activeID);
		this._editingFocus = elm;
	}.bind(this), true);
	this.setAsActiveID = function (activeID) {
		// make sure the active property is set on the right folder object in the data store
		if(!activeID)return;
		if(this.activeID){
			this.datamanager.update(this.activeID, 'active', false);
		}
		this.datamanager.update(activeID, 'active', true);
		this.activeID = activeID;			
	}
	this.root.addEventListener('dragstart', function(e){
		e.dataTransfer.setData("text/plain",e.target.dataset.itemID);
		this._dragElm = e.target.classList.contains('folderheader') ? e.target.parentNode : e.target;
	}.bind(this), false)
	this.root.addEventListener('dragover', function(e){
		if(e.target.classList.contains('note') || e.target.classList.contains('folderheader')){
			e.preventDefault();
			e.target.classList.add('droptarget');
		}
	}.bind(this), false);
	this.root.addEventListener('dragenter', function(e){
		e.target.classList.add('droptarget');
	}, false);
	this.root.addEventListener('dragleave', function(e){
		e.target.classList.remove('droptarget');
	}, false);
	this.root.addEventListener('drop', function(e){
		var posHint = (e.clientY - e.target.offsetTop) > e.target.offsetHeight / 2 ? 'after' : 'before';
		e.target.classList.remove('droptarget');
		this._insertNode(e.target, this._dragElm, posHint);
	}.bind(this), false);
	this.editor.addEventListener('focus', function(e){
		if (this._editingFocus) {
			this._editingFocus.classList.add('inactive_focus');
		}
	}.bind(this), false)
	this.editor.addEventListener('input', function(){
		this._editingFocus.textContent = firstLine(this.editor.value);
		this.datamanager.update(this._editingFocus.dataset.itemID, 'name', this.editor.value);
	}.bind(this), false);
	this.associateDataManager = function(datamanager){
		this.datamanager = datamanager;
	}
	// General DOM utility methods
	function addElm(tag, parent, props){
		var elm=parent.appendChild(document.createElement(tag));
		for(var p in props){
			elm.setAttribute(p, props[p]);
		}
		return elm;
	}
	function nodeListIndexOf(list, node){
		for (var i = list.length - 1; i >= 0; i--) {
			if(list[i] === node) return i;
		};
		return -1;
	}
	function removeAllClasses(root, className){
		for (var list=root.getElementsByClassName(className), i = list.length - 1; i >= 0; i--) {
			list[i].classList.remove(className);
		};
	}
	function nextNodeOfType(refNode){
		var list = document.getElementsByTagName(refNode.tagName);
		var index = nodeListIndexOf(list, refNode);
		if (index+1 >= list.length) { // beyond list length.. 
			index = index-1;
		}else{
			index++;
		}
		return list[index];
	}
	function tryReallyHardToFocus(elm){ // Stupid bug in Chrome? WebKit? Focus often goes missing..
		setTimeout(function(){elm.focus();}, 0);
		setTimeout(function(){elm.focus();}, 4);
		setTimeout(function(){elm.focus();}, 8);
	}
	function firstLine (str) {
		return str.indexOf('\n') > -1 ? str.substr(0, str.indexOf('\n')) : str;
	}
}

