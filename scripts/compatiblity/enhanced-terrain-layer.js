'use strict';

(async () => {
	const moduleNameTA = "token-attacher";
	const moduleName = "enhanced-terrain-layer";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(getProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`)) return;

		// if(!(change.flags?.[moduleName]?.hasOwnProperty("top")
		// 	|| change.flags?.[moduleName]?.hasOwnProperty("bottom")
		// )) return;

		//setProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`, true);
	}

	// const myLayer = "SomeLayerName";
	// function layerGetElement(layer, id, result){
	// 	if(layer != myLayer) return;

	// 	//Implement your get method here if your elements live in a non standard layer
	// 	//result.element = someobject.get(id);
	// }

	function getElementOffset(type, objData, base_type, baseDoc, grid, offset){
		if(!["Terrain"].includes(type)) return;

		let  base_elevation = baseDoc.elevation ?? baseDoc.flags['levels']?.elevation ?? baseDoc.flags['levels']?.rangeBottom ?? baseDoc.flags['wallHeight']?.wallHeightBottom ?? baseDoc.flags['wall-height']?.bottom ?? 0;

	}
	
	function offsetPositionOfElement(type, objData, baseType, baseData, baseOffset, update){
		if(!["Terrain"].includes(type)) return;

		const offset = getProperty(objData, `flags.${moduleNameTA}.offset`);
	}

	function _registerLayerByDocumentName(){
		window.tokenAttacher._registerLayerByDocumentName("Terrain");
	}
	
	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	//Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	Hooks.on(`${moduleNameTA}.getElementOffset`, getElementOffset);
	Hooks.on(`${moduleNameTA}.offsetPositionOfElement`, offsetPositionOfElement);
	Hooks.once(`${moduleNameTA}.macroAPILoaded`, _registerLayerByDocumentName);
})();
