'use strict';
//This is named core, but for now this will only contain logic for Regions.
//TODO: Refactor out the rest of the core PlacableObjects logic into this file
(async () => {
	const moduleNameTA = "token-attacher";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(foundry.utils.getProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`)) return;

		if(!(change.elevation?.rangeBottom)
			|| (change.elevation?.rangeTop)
		) return;

		foundry.utils.setProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`, true);
	}

	// const myLayer = "SomeLayerName";
	// function layerGetElement(layer, id, result){
	// 	if(layer != myLayer) return;

	// 	//Implement your get method here if your elements live in a non standard layer
	// 	//result.element = someobject.get(id);
	// }

	function getElementOffset(type, objData, base_type, baseDoc, grid, offset){
		//As this is core functionality, allow all PlacableObjects to be checked
		
		let  base_elevation = baseDoc.elevation?.rangeBottom ?? 0;
		
		if(objData.elevation?.rangeTop || objData.elevation?.rangeBottom){
			offset.elevation = offset.elevation ?? {};
			offset.elevation.rangeTop = objData.elevation.rangeTop ?? null;
			offset.elevation.rangeBottom = objData.elevation.rangeBottom ?? null;
			
			if([null, Infinity, -Infinity].includes(offset.elevation.rangeTop) === false) offset.elevation.rangeTop -= base_elevation;
			if([null, Infinity, -Infinity].includes(offset.elevation.rangeBottom) === false) offset.elevation.rangeBottom -= base_elevation;
		}
	}
	
	function offsetPositionOfElement(type, objData, baseType, baseData, baseOffset, update){
		//As this is core functionality, allow all PlacableObjects to be checked
		
		const offset = foundry.utils.getProperty(objData, `flags.${moduleNameTA}.offset`);

		if(offset.elevation?.rangeTop){
			if([null, Infinity, -Infinity].includes(offset.elevation?.rangeTop) === false) update[`elevation.rangeTop`] = baseOffset.elevation + offset.offset.elevation?.rangeTop;
		}
		if(offset.elevation?.rangeBottom){
			if([null, Infinity, -Infinity].includes(offset.elevation?.rangeBottom) === false) update[`elevation.rangeBottom`] = baseOffset.elevation + offset.offset.elevation?.rangeBottom;
		}
	}

	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	//Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	Hooks.on(`${moduleNameTA}.getElementOffset`, getElementOffset);
	Hooks.on(`${moduleNameTA}.offsetPositionOfElement`, offsetPositionOfElement);
})();
