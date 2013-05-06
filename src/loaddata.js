var datamanager, tree;
var demodata, storageReturned=false;
if(typeof chrome != 'undefined'){ console.log( 'will try to get data'  );
	chrome.storage.local.get('notesdata', function(data){ // chrome.runtime.lastError ?
		storageReturned = true;
		console.log( 'notesdata getter returns.. '+data );
		if(data.notesdata){
			demodata = JSON.parse(data.notesdata);
		}
	});
}else{
	storageReturned=true;
}
setTimeout(function(){
	//console.log('timeout '+storageReturned);
	if (window.chrome && !storageReturned) { // while we're awaiting futures..
		return setTimeout(arguments.callee, 5);
	};
	if (!demodata) {
		demodata = [ {
		   "created": 1366117078000.0,
		   "name": "text line 1\ntext line 2\ntext line 3\n\n\u0105\u0119\u0107\u0144",
		   "type": "note"
		}, {
		   "children": [ {
		      "created": 1366122753000.0,
		      "name": "child note",
		      "type": "note"
		   }, {
		      "children": [ {
		         "created": 1366122768000.0,
		         "name": "nested child note",
		         "type": "note"
		      } ],
		      "created": 1366122758000.0,
		      "expanded": true,
		      "name": "child folder",
		      "type": "folder"
		   }, {
		      "created": 1366122773000.0,
		      "name": "child note 2",
		      "type": "note"
		   } ],
		   "created": 1366122740000.0,
		   "expanded": true,
		   "name": "folder",
		   "type": "folder"
		}, {
		   "created": 1366122799000.0,
		   "name": "note in root",
		   "type": "note"
		}, {
		   "created": 1366190377000.0,
		   "name": "ros\u0142ych dusili plastikowymi torbami, niemowl\u0119ta czeka\u0142 jeszcze gors",
		   "type": "note",
		   "url": "http://www.wp.pl/?src01=oj2"
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
	datamanager = new DataManager(demodata);
	if (typeof Treeview != 'undefined') {
		tree = new Treeview(document.getElementById('foldertree'));
		tree.associateDataManager( datamanager );
		tree.render();
	};

}, 4);


