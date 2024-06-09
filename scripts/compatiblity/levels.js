'use strict';

(async () => {
	const moduleNameTA = "token-attacher";
	const moduleName = "levels";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(foundry.utils.getProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`)) return;

		if(!(change.flags?.[moduleName]?.hasOwnProperty("rangeTop")
			|| change.flags?.[moduleName]?.hasOwnProperty("rangeBottom")
		)) return;

		foundry.utils.setProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`, true);
	}

	// const myLayer = "SomeLayerName";
	// function layerGetElement(layer, id, result){
	// 	if(layer != myLayer) return;

	// 	//Implement your get method here if your elements live in a non standard layer
	// 	//result.element = someobject.get(id);
	// }

	function getElementOffset(type, objData, base_type, baseDoc, grid, offset){
		if(!["Drawings","Tile", "AmbientLight", "AmbientSound"].includes(type)) return;
		
		let  base_elevation = baseDoc.elevation ?? baseDoc.flags[moduleName]?.elevation ?? baseDoc.flags[moduleName]?.rangeBottom ?? baseDoc.flags['wallHeight']?.wallHeightBottom ?? baseDoc.flags['wall-height']?.bottom ?? 0;
		
		if(objData.flags[moduleName]?.hasOwnProperty('elevation')){
			offset.elevation.flags[moduleName] = {
				elevation:objData.flags[moduleName].elevation
			};
			
			if([null, Infinity, -Infinity].includes(offset.elevation.flags[moduleName].elevation) === false) offset.elevation.flags[moduleName].elevation -= base_elevation;
		}
		if(objData.flags[moduleName]?.hasOwnProperty('rangeTop') || objData.flags[moduleName]?.hasOwnProperty('rangeBottom')){
			offset.elevation.flags[moduleName] = {
				rangeTop:objData.flags[moduleName].rangeTop ?? null, 
				rangeBottom:objData.flags[moduleName].rangeBottom ?? null
			};
			
			if([null, Infinity, -Infinity].includes(offset.elevation.flags[moduleName].rangeTop) === false) offset.elevation.flags[moduleName].rangeTop -= base_elevation;
			if([null, Infinity, -Infinity].includes(offset.elevation.flags[moduleName].rangeBottom) === false) offset.elevation.flags[moduleName].rangeBottom -= base_elevation;
		}
	}
	
	function offsetPositionOfElement(type, objData, baseType, baseData, baseOffset, grid_multi, update){
		if(!["Drawings","Tile", "AmbientLight", "AmbientSound"].includes(type)) return;
		
		const offset = foundry.utils.getProperty(objData, `flags.${moduleNameTA}.offset`);

		if(offset.elevation?.flags?.[moduleName]?.hasOwnProperty('elevation')){
			if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.[moduleName]?.elevation) === false) update[`flags.${moduleName}.elevation`] = baseOffset.elevation + offset.elevation.flags[moduleName].elevation;
		}
		if(offset.elevation?.flags?.[moduleName]?.hasOwnProperty('rangeTop')){
			if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.[moduleName]?.rangeTop) === false) update[`flags.${moduleName}.rangeTop`] = baseOffset.elevation + offset.elevation.flags[moduleName].rangeTop;
		}
	}

	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	//Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	Hooks.on(`${moduleNameTA}.getElementOffset`, getElementOffset);
	Hooks.on(`${moduleNameTA}.offsetPositionOfElement`, offsetPositionOfElement);
})();
