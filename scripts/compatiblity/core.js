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
		const baseCenter = tokenAttacher._compatiblity.getCenter(base_type, baseDoc, grid);
		const baseRotation =  baseDoc.rotation ?? baseDoc.direction;
		//As this is core functionality, allow all PlacableObjects to be checked
		
		//Regions consist of multiple shapes
		if(objData.shapes){
			offset.shapes = [];
			for (let i = 0; i < objData.shapes.length; i++) {
				const shape = objData.shapes[i];
				offset.shapes[i] = foundry.utils.duplicate(shape);				
				switch (shape.type) {
					case 'rectangle':
						offset.shapes[i].width = shape.width;
						offset.shapes[i].height = shape.height;	
						offset.shapes[i].center.x = shape.x + shape.width/2  - baseCenter.x;
						offset.shapes[i].center.y = shape.y + shape.height/2 - baseCenter.y;
						offset.shapes[i].rotation = shape.rotation % 360;
						offset.shapes[i].offsetRotation = (shape.rotation - baseRotation) % 360;
						break;
					case 'ellipse':
						offset.shapes[i].radiusX = shape.radiusX;
						offset.shapes[i].radiusY = shape.radiusY;	
						offset.shapes[i].x = shape.x - baseCenter.x;
						offset.shapes[i].y = shape.y - baseCenter.y;
						offset.shapes[i].rotation = shape.rotation % 360;	
						offset.shapes[i].offsetRotation = (shape.rotation - baseRotation) % 360;		
						break;				
					default:
						break;
				}
			}
		}

		let  baseElevation = baseDoc.elevation?.bottom ?? baseDoc.elevation ?? baseDoc.flags['levels']?.elevation ?? baseDoc.flags['levels']?.rangeBottom ?? baseDoc.flags['wallHeight']?.wallHeightBottom ?? baseDoc.flags['wall-height']?.bottom ?? 0;

		if(objData.elevation?.top || objData.elevation?.bottom){
			offset.elevation = offset.elevation ?? {};
			offset.elevation.top = objData.elevation.top ?? null;
			offset.elevation.bottom = objData.elevation.bottom ?? null;
			
			if([null, Infinity, -Infinity].includes(offset.elevation.top) === false) offset.elevation.top -= baseElevation;
			if([null, Infinity, -Infinity].includes(offset.elevation.bottom) === false) offset.elevation.bottom -= baseElevation;
		}
	}
	
	function offsetPositionOfElement(type, objData, baseType, baseData, baseOffset, grid_multi, update){
		//As this is core functionality, allow all PlacableObjects to be checked
		
		const offset = foundry.utils.getProperty(objData, `flags.${moduleNameTA}.offset`);
		const size_multi = {w: baseOffset.size[0] / offset.size.widthBase, h: baseOffset.size[1] / offset.size.heightBase};
		const baseRotation =  baseData.rotation ?? baseData.direction;

		//Regions consist of multiple shapes
		if(offset.shapes){
			const shapes = foundry.utils.duplicate(objData.shapes);	
			for (let i = 0; i < offset.shapes.length; i++) {
				const shape = offset.shapes[i];		
				switch (shape.type) {
					case 'rectangle':
						shapes[i].width = shape.width * size_multi.w;
						shapes[i].height = shape.height * size_multi.h;	
						shapes[i].center.x = shape.x + shape.width/2  - baseCenter.x;
						shapes[i].center.y = shape.y + shape.height/2 - baseCenter.y;
						shapes[i].rotation = (shape.rotation - baseRotation) % 360;
						break;
					case 'ellipse':
						shapes[i].radiusX = shape.radiusX * size_multi.w;
						shapes[i].radiusY = shape.radiusY * size_multi.h;	
						const [x,y] = tokenAttacher._compatiblity.moveRotatePoint({x:shape.x, y:shape.y, rotation:0}, {...shape, rot: shape.rotation, offRot:  shape.offsetRotation}, baseOffset.center, baseOffset.rotation, size_multi);
						shapes[i].x = x;
						shapes[i].y = y;		
						shapes[i].rotation = (shape.offsetRotation + baseRotation) % 360;		
						break;				
					default:
						break;
				}
			}
			update[`shapes`] = shapes;
		}

		if(offset.elevation?.top){
			if([null, Infinity, -Infinity].includes(offset.elevation?.top) === false) update[`elevation.top`] = baseOffset.elevation + offset.elevation?.top;
		}
		if(offset.elevation?.bottom){
			if([null, Infinity, -Infinity].includes(offset.elevation?.bottom) === false) update[`elevation.bottom`] = baseOffset.elevation + offset.elevation?.bottom;
		}
	}

	function initCompatibility(){
		window.tokenAttacher._compatiblity.registerLayerByDocumentName("Region");
	}

	Hooks.on(`${moduleNameTA}.doAttachmentsNeedUpdate`, doAttachmentsNeedUpdate);
	//Hooks.on(`${moduleNameTA}.layerGetElement`, layerGetElement);
	Hooks.on(`${moduleNameTA}.getElementOffset`, getElementOffset);
	Hooks.on(`${moduleNameTA}.offsetPositionOfElement`, offsetPositionOfElement);
	Hooks.once(`${moduleNameTA}.macroAPILoaded`, initCompatibility);

})();
