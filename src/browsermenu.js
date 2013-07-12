// Now the context menu entry in the browser's built-in selection menu
var title = "Copy to Note";
chrome.contextMenus.create({"title": title, "contexts":['selection'], 
                   "onclick": menuClickHandler});

function menuClickHandler(info, tab) {
	// pageUrl, frameUrl, selectionText
	datamanager.loadData( 
		// we load data "on demand" whenever right-click menu entry is clicked
		// this avoids tricky sync'ing problems where the background process' copy of the data
		// potentially had to be kept in sync with the popup's
		// Now, because getting data is async the actual action has to happen in a callback function..
		function(){
			this.add( {type:'note', name:info.selectionText, url:info.pageUrl} );
			this.saveData(); // we make sure this is saved immediately
			// because if someone opens the popup, the new entry must be available
		});
}

// Feature request: menu for inserting note data into fields. 
var insertNoteMenu = chrome.contextMenus.create({'title':'Insert Note', 'contexts':['editable']});
var menuObjects = {'root':insertNoteMenu};
datamanager.loadData(
	function(){
		datamanager.iterate(null, function (obj, parentAr, idx, parentObj) { // Its first argument is the object, second is parent array, third index, fourth is the object that referenced the array
			var parent = parentObj ? menuObjects[parentObj.id] : menuObjects.root;
			var title;
			if(/\n/.test(obj.name) && obj.name.indexOf('\n')<41){
				title = obj.name.substr(0, obj.name.indexOf('\n'));
			}else if(obj.name.length > 40){
				title = obj.name.substr(0,40)+'...';
			}else{
				title = obj.name;
			}
			menuObjects[obj.id] = chrome.contextMenus.create({'title':title, 'contexts':['editable'], 'parentId': parent, 'onclick':function(){
				chrome.tabs.getSelected(null, function(tab) {
					chrome.tabs.sendMessage(tab.id, {text_to_insert: obj.name});
				});
			}});
		});
	}
);
