'use strict';

(async () => {
	const moduleNameTA = "token-attacher";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(getProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`)) return;

		if(change.z) setProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`, true);
	}

	const myLayer = "SomeLayerName"
	function layerGetElement(layer, id, result){
		if(layer != myLayer) return;

		//Implement your get method here if your elements live in a non standard layer
		//result.element = someobject.get(id);
	}
	
	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	TokenAttacher.registerHooks();
})();
