chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	if(request.text_to_insert){
  		var elm = document.activeElement;
  		if(elm && ('selectionStart' in elm) && ('value' in elm)){ // INPUT, TEXTAREA
  			var start = elm.selectionStart, end=elm.selectionEnd;
  			elm.value = elm.value.substr(0,start)+request.text_to_insert+elm.value.substr(start);
  			elm.selectionStart = start+request.text_to_insert.length, elm.selectionEnd = end+request.text_to_insert.length;
  		}else{ // inserting into rich text editable context?
			var sel=window.getSelection();
			if(sel.focusNode && 'data' in sel.focusNode){
				var start = sel.focusOffset;
				sel.focusNode.data = sel.focusNode.data.substr(0, start) + request.text_to_insert + sel.focusNode.data.substr(start)
				var newRng = document.createRange();
				newRng.setStart(sel.focusNode, start+request.text_to_insert.length);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(newRng);				
			} // Else?! I have no idea if this outcome is possible, nor what to do..
  		}
	}
});