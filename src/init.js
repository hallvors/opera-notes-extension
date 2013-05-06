console.log('init.js')
console.log('init: '+(typeof DataManager)+' '+(typeof Treeview))

var datamanager, tree;
datamanager = new DataManager();

if (typeof Treeview != 'undefined') { console.log('will set up Treeview');
	datamanager.loadData(function () { console.log('and here\'s my loadData callback ');
		tree = new Treeview(document.getElementById('foldertree'));
		tree.associateDataManager( datamanager );
		tree.render();
	});
};
