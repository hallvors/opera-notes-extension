
// Now the context menu entry in the browser's built-in selection menu
var title = "Copy to note";
var id = chrome.contextMenus.create({"title": title, "contexts":['selection'], 
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
			this.saveData(); // we make sure this is saved immediately rather than waiting up to a minute
			// because if someone opens the popup, the new entry must be available immediately
		});
}
