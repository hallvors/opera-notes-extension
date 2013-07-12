// TODO: MAYBE: Cut, Copy, Paste)
// TODO: "Empty trash" ?
// TODO: create datamaintainer only on-demand
document.addEventListener('contextmenu', function (e) {
	var target = e.target;
	if(target.tagName === 'TEXTAREA') return; // normal right-click menu for TEXTAREA
	var list;
	if((list = document.getElementsByClassName('menu')).length){
		for (var i = list.length - 1; i >= 0; i--) {
			document.body.removeChild(list[i]);
		};
	} 
	var menu = document.createElement('div');
	menu.classList.add('menu');
	document.body.appendChild(menu);
	menu.style.left = e.pageX+'px', menu.style.top = e.pageY+'px';
	var commands = [
		{
			name:'New Note', 
			method:function(e){
				tree.addItem('note');
			}
		},
		{
			name:'New Folder', 
			method:function(e){
				tree.addItem('folder');
			}
		},
		{
			name:'Delete',
			method:function(e){
				tree.deleteItem(target);
			}
		},
		{
			name:'-'
		},
		{
			name:'Cut', 
			method:function(e){
				tree.cutItem(target);
			}
		},
		{
			name:'Copy', 
			method:function(e){
				tree.copyItem(target);
			}
		},
		{
			name:'Paste',
			method:function(e){
				tree.pasteItem(target);
			}, 
			isEnabled:function(){ 
				return tree.hasClipboardItems(); 
			}
		}
	];
	for (var i = 0; i < commands.length ; i++) {
		if(commands[i].name === '-'){
			menu.appendChild(document.createElement('hr'));
			continue;
		}
		var a=menu.appendChild(document.createElement('a'));
		a.appendChild(document.createTextNode(commands[i].name));
		a.href="#";
		if(commands[i].isEnabled && ! commands[i].isEnabled() ){
			a.classList.add( 'disabled');
		}
		a.addEventListener('click', function(e){
			if(!e.target.classList.contains('disabled'))this.method(e); 
			e.preventDefault();
		}.bind(commands[i]), false);
	};
	menu.getElementsByTagName('a')[0].focus();
	document.addEventListener('click', function(e){
		document.body.removeChild(menu);
		document.removeEventListener('click', arguments.callee, false);
	}, false);
	menu.addEventListener('mouseover', function(e){
		if(!e.target.classList.contains('disabled'))e.target.focus();
	}, false);
	window.addEventListener('keydown', function(e){
		var direction = e.keyCode === 38 ? 'previous' : e.keyCode === 40 ? 'next' : '';
		if (direction ) {
			var focusNode = e.target[direction+'Sibling'];
			if (focusNode && focusNode.tagName === 'HR') {
				focusNode = focusNode[direction+'Sibling'];
			};
			if(focusNode && !focusNode.classList.contains('disabled'))focusNode.focus();
			e.preventDefault();
		}else if(e.keyCode === 13){
			e.target.click ? e.target.click() : clickElm(e.target);
			e.stopPropagation();
			e.preventDefault();
		}else if (e.keyCode === 27) {
			document.body.removeChild(menu);
			e.stopPropagation();
			e.preventDefault();
		};
	}, false);
	e.preventDefault();
	function clickElm(elm){
		var evt = document.createEvent('MouseEvent');
		evt.initMouseEvent('click', true, true, window, 
                     0, 0, 0, 0, 0, 
                     false, false, false, false, 
                     1, e.target);
		e.target.dispatchEvent(evt);
	}
}, false);
