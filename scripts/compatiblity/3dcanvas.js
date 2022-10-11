'use strict';

(async () => {
	const moduleName = "token-attacher";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(getProperty(options, `${moduleName}.attachmentsNeedUpdate`)) return;

		if(change.z) setProperty(options, `${moduleName}.attachmentsNeedUpdate`, true);
	}

	const myLayer = "SomeLayerName"
	function layerGetElement(layer, id, result){
		if(layer != myLayer) return;

		//Implement your get method here if your elements live in a non standard layer
		//result.element = someobject.get(id);
	}
	
	Hooks.on(`${moduleName}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	TokenAttacher.registerHooks();
})();
