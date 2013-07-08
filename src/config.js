function saveData(){
	if(confirm('This will overwrite all current notes in the extension. Continue?')){
		var isJSON = false, data = document.getElementsByTagName('textarea')[0].value;
		try{
			JSON.parse(data);
			isJSON = true;
		}catch(e){}
		if(!isJSON){
			data = adrToJSON(data);
		}
		chrome.storage.local.set({notesdata:data}, function () { 
			if(chrome.runtime.lastError){ 
				alert('Unexpected import error: '+chrome.runtime.lastError.message); 
			}else{ 
				alert('Notes imported successfully.') 
			}
		});
	}
}

function adrToJSON(data){
	var obj={children:[]}, currentParent=obj, hierarchy=[obj];
	data = data.split(/\n\n/);
	for(var i=1, entry; entry=data[i]; i++){
		entry = entry.trim();
		if(entry === '-'){
			hierarchy.pop();
			currentParent = hierarchy[hierarchy.length - 1] || obj;
		}else if(/^#SEPERATOR/.test(entry)){
			continue; // skip separators, we don't really use them..
		}else{
			entry = entryToObject(entry)
			currentParent.children.push(entry);
			if(entry.type === 'folder'){
				entry.children=[];
				currentParent = entry;
				hierarchy.push(entry);
			}
		}
	}
	return JSON.stringify(obj.children);
}
function entryToObject(data){
	data = data.split(/\n/); 
	var obj={};
	for(var i=0, line, details; line = data[i]; i++){
		line = line.trim();
		if(/^#/.test(line)){
			obj.type = line.substr(1).toLowerCase();
		}else{
			details = line.split('=');
			details[1] = details[1].replace(/\u0002/g, '\n'); // STX => line feed
			if (details[0] in {EXPANDED:1, ACTIVE:1, 'TRASH FOLDER':1}) {
				details[1] = details[1] === 'YES'; // turn into boolean
			};
			obj[details[0].replace(/ /, '_').toLowerCase()] = details[1];
		}
	}
	return obj;
}
document.addEventListener('DOMContentLoaded', function (e) {
	document.getElementById('saveData_button').addEventListener('click', saveData);
});
