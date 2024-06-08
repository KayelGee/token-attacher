'use strict';

(async () => {
	const moduleNameTA = "token-attacher";
	const moduleName = "wall-height";

	function doAttachmentsNeedUpdate(document, change, options, userId){
		if(foundry.utils.getProperty(options, `${moduleNameTA}.attachmentsNeedUpdate`)) return;

		if(!(change.flags?.[moduleName]?.hasOwnProperty("top")
			|| change.flags?.[moduleName]?.hasOwnProperty("bottom")
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
		if(!["Wall"].includes(type)) return;

		let  base_elevation = baseDoc.elevation ?? baseDoc.flags['levels']?.elevation ?? baseDoc.flags['levels']?.rangeBottom ?? baseDoc.flags['wallHeight']?.wallHeightBottom ?? baseDoc.flags['wall-height']?.bottom ?? 0;

		//Legacy code
		if(objData.flags['wallHeight']?.hasOwnProperty('wallHeightTop')){				
			offset.elevation.flags['wallHeight'] = {
				wallHeightTop:objData.flags['wallHeight'].wallHeightTop, 
				wallHeightBottom:objData.flags['wallHeight'].wallHeightBottom
			};
			
			if([null, Infinity, -Infinity].includes(offset.elevation.flags['wallHeight'].wallHeightTop) === false) offset.elevation.flags['wallHeight'].wallHeightTop -= base_elevation;
			if([null, Infinity, -Infinity].includes(offset.elevation.flags['wallHeight'].wallHeightBottom) === false) offset.elevation.flags['wallHeight'].wallHeightBottom -= base_elevation;
		}

		if(objData.flags[moduleName]?.hasOwnProperty('top')){				
			offset.elevation.flags[moduleName] = {
				top:objData.flags[moduleName].top, 
				bottom:objData.flags[moduleName].bottom
			};
			
			if([null, Infinity, -Infinity].includes(offset.elevation.flags[moduleName].top) === false) offset.elevation.flags[moduleName].top -= base_elevation;
			if([null, Infinity, -Infinity].includes(offset.elevation.flags[moduleName].bottom) === false) offset.elevation.flags[moduleName].bottom -= base_elevation;
		}
	}
	
	function offsetPositionOfElement(type, objData, baseType, baseData, baseOffset, update){
		if(!["Wall"].includes(type)) return;
		
		const offset = foundry.utils.getProperty(objData, `flags.${moduleNameTA}.offset`);

		//Legacy code
		if(offset.elevation?.flags?.wallHeight?.hasOwnProperty('wallHeightBottom') || offset.elevation?.flags?.wallHeight?.hasOwnProperty('wallHeightTop')){
			const wallHeightModule = game.modules.get(moduleName) ?? {version:0};
			if(isNewerVersion("4.0", wallHeightModule.version)){
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightBottom) === false) update['flags.wallHeight.wallHeightBottom'] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightBottom;
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightTop) === false) update['flags.wallHeight.wallHeightTop'] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightTop;
			}else{
				console.warn("Token Attacher | WallHeight flags.wallHeight is deprecated. Please use the macro 'Migrate Actors for Wall Height' and if this came from a compendium unlock the compendiums and run 'Migrate Compendiums for Wall Height!'");
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightBottom) === false) update[`flags.${moduleName}.bottom`] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightBottom;
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightTop) === false) update[`flags.${moduleName}.top`] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightTop;
			}
		}
		
		if(offset.elevation?.flags?.[moduleName]?.hasOwnProperty('bottom') || offset.elevation?.flags?.[moduleName]?.hasOwnProperty('top')){
			if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.[moduleName]?.bottom) === false) update[`flags.${moduleName}.bottom`] = baseOffset.elevation + offset.elevation.flags[moduleName].bottom;
			if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.[moduleName]?.top) === false) update[`flags.${moduleName}.top`] = baseOffset.elevation + offset.elevation.flags[moduleName].top;
		}
	}

	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	//Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	Hooks.on(`${moduleNameTA}.getElementOffset`, getElementOffset);
	Hooks.on(`${moduleNameTA}.offsetPositionOfElement`, offsetPositionOfElement);
})();
