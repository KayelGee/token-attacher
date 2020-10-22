(async () => {
	const moduleName = "token-attacher";
	//CONFIG.debug.hooks = true
	class TokenAttacher {
		static get typeMap(){
			let map = {
				"MeasuredTemplate":{updateCallback: TokenAttacher._updateRectangleEntities},
				"Tile":{updateCallback: TokenAttacher._updateRectangleEntities},
				"Drawing":{updateCallback: TokenAttacher._updateRectangleEntities},
				"AmbientLight":{updateCallback: TokenAttacher._updateRectangleEntities},
				"AmbientSound":{updateCallback: TokenAttacher._updatePointEntities},
				"Note":{updateCallback: TokenAttacher._updatePointEntities},
				"Wall":{updateCallback: TokenAttacher._updateWalls},
			};
			//Hooks.callAll(`${moduleName}.getTypeMap`, map);
			return map;
		}

		static initialize(){
			if(TokenAttacher.isFirstActiveGM()){
				canvas.scene.unsetFlag(moduleName,"selected");
				console.log("Token Attacher| Initialized");
			}

			window.tokenAttacher = {};
			window.tokenAttacher.isPreSightUpdateVersion= isNewerVersion('0.7.0', game.data.version);
			window.tokenAttacher.selected = {};
			//Sightupdate workaround until 0.7.x fixes wall sight behaviour
			if(window.tokenAttacher.isPreSightUpdateVersion){
				window.tokenAttacher.updateSight={};
				window.tokenAttacher.updateSight.walls=[];
			}
			else{
				Hooks.off("updateWall", TokenAttacher.performSightUpdates)
			}
			
			window.tokenAttacher = {
				...window.tokenAttacher, 
				attachElementToToken: TokenAttacher.attachElementToToken,
				attachElementsToToken: TokenAttacher.attachElementsToToken,
				detachElementFromToken: TokenAttacher.detachElementFromToken,
				detachElementsFromToken: TokenAttacher.detachElementsFromToken,
				detachAllElementsFromToken: TokenAttacher.detachAllElementsFromToken,
				getAllAttachedElementsOfToken: TokenAttacher.getAllAttachedElementsOfToken,
				getAllAttachedElementsByTypeOfToken: TokenAttacher.getAllAttachedElementsByTypeOfToken,
				get typeMap() {return TokenAttacher.typeMap},
			};

			TokenAttacher.updatedLockedAttached();

		}

		static registerHooks(){
			Hooks.on('ready', () => {
				TokenAttacher.registerSettings();
				if(TokenAttacher.isFirstActiveGM()){
					TokenAttacher.startMigration();
				}
			});
		
			Hooks.on('getSceneControlButtons', (controls) => TokenAttacher._getControlButtons(controls));
			Hooks.on('canvasReady', () => TokenAttacher.initialize());
			Hooks.once('ready', () => {
				game.socket.on(`module.${moduleName}`, (data) => TokenAttacher.listen(data));
			});
		
			Hooks.on("preUpdateToken", (parent, doc, update, options, userId) => TokenAttacher.UpdateAttachedOfToken(parent, doc, update, options, userId));
			Hooks.on("updateToken", (parent, doc, update, options, userId) => TokenAttacher.AfterUpdateAttachedOfToken(parent, doc, update, options, userId));
			Hooks.on("updateActor", (entity, data, options, userId) => TokenAttacher.updateAttachedPrototype(entity, data, options, userId));
			Hooks.on("createToken", (parent, entity, options, userId) => TokenAttacher.updateAttachedCreatedToken(parent, entity, options, userId));
			Hooks.on("pasteToken", (copy, toCreate) => TokenAttacher.pasteTokens(copy, toCreate));
			Hooks.on("deleteToken", (entity, options, userId) => TokenAttacher.deleteToken(entity, options, userId));
		
			//Sightupdate workaround until 0.7.x fixes wall sight behaviour
			Hooks.on("updateWall", TokenAttacher.performSightUpdates);
			Hooks.once(`${moduleName}.getTypeMap`, (map) => {map.test = 5;console.log("hooked", map);});

			//Monkeypatch PlaceablesLayer.copyObjects to hook into it
			var oldCopyObjects= PlaceablesLayer.prototype.copyObjects;

			PlaceablesLayer.prototype.copyObjects= function() {
				const result = oldCopyObjects.apply(this, arguments);
				switch(this.constructor.placeableClass.name){
					case "Token": 
						TokenAttacher.copyTokens(this, result);
					break;
				}
				return result;
			};
		}

		static registerSettings() {
			game.settings.register(moduleName,"data-model-version",{
				name: "token attacher dataModelVersion",
				hint: "token attacher dataModelVersion",
				default: 0,
				type: Number,
				scope: "world",
				config: false
			});
		}

		static async startMigration(){

			const dataModelVersion = 2;
			let currentDataModelVersion = game.settings.get(moduleName, "data-model-version");

			if(currentDataModelVersion < 2){
				await TokenAttacher.migrateToDataModel_2();
				currentDataModelVersion = 2;
			}
			game.settings.set(moduleName, "data-model-version", currentDataModelVersion);
		}

		static async migrateToDataModel_2(){
			let lookupType = (element) =>{
				switch(element){
					case "templates": return 'MeasuredTemplate';
					case "drawings": return 'Drawing';
					case "notes": return 'Note';
					case "sounds": return 'AmbientSound';
					case "lighting": return 'AmbientLight';
					case "walls": return 'Wall';
					case "tiles": return 'Tile';
				}
				return 'unknown';
			};
			for (const scene of Scene.collection) {
				let deleteData = [];
				let updateData = [];
				let backupData = [];
				for (const token of scene.data.tokens) {
					const key = `${moduleName}.attached`;
					const attached=getProperty(token.flags, key)|| {};
					if(Object.keys(attached).length > 0){
						let migratedAttached = {};
						for (const key in attached) {
							if (attached.hasOwnProperty(key)) {
								migratedAttached[lookupType(key)] = attached[key];
							}
						}						
						backupData.push({_id: token._id, [`flags.${moduleName}.migrationBackup.1`]:  attached});
						deleteData.push({_id: token._id, [`flags.${moduleName}.-=attached`]:  null});
						updateData.push({_id: token._id, [`flags.${moduleName}.attached`]:  migratedAttached});
					}
				}

				if(updateData.length > 0){ 
					await scene.updateEmbeddedEntity("Token", backupData);
					await scene.updateEmbeddedEntity("Token", deleteData);
					await scene.updateEmbeddedEntity("Token", updateData);
					ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.DataModelMergedTo") + " 2");
				}					
			}
		}

		static getTypeCallback(className){
			if(TokenAttacher.typeMap.hasOwnProperty(className)) return this.typeMap[className].updateCallback;
			return () => {console.log(`Token Attacher - Unknown object attached`)};
		}

		static updatedLockedAttached(){
			const tokens = canvas.tokens.placeables;
			for (const token of tokens) {
				const attached=token.getFlag(moduleName, "attached") || {};
				if(Object.keys(attached).length == 0) continue;
				const isLocked = token.getFlag(moduleName, "locked") || false;
				if(isLocked)
					for (const key in attached) {
						if (attached.hasOwnProperty(key) && key !== "unknown") {
							let layer = eval(key).layer ?? eval(key).collection;
							for (const elementid of attached[key]) {
								let element = layer.get(elementid);
								TokenAttacher.lockElement(key, element, false);
							}
						}
					}
			}
		}

		static lockElement(type, element, interactive){
			switch(type){
				case "Wall":{
					element.line.interactive = interactive;
					element.endpoints.interactive = interactive;
					break;
				}
				case "AmbientLight":
				case "AmbientSound":
				case "Note":
				case "MeasuredTemplate":
					element.controlIcon.interactive = interactive;
					break;
				default:
					element.interactive = interactive;
			}
		}

		static async UpdateAttachedOfToken(parent, doc, update, options, userId){
			const token = canvas.tokens.get(update._id);
			const attached=token.getFlag(moduleName, "attached") || {};
			const tokenCenter = duplicate(token.center);
			if(Object.keys(attached).length == 0) return true;

			TokenAttacher.detectGM();

			let deltaX = 0;
			let deltaY = 0;
			let deltaRot = 0;
			let needUpdate= false;
			if(update.hasOwnProperty("x")){
				deltaX = update.x - token.data.x;
				needUpdate=true;
			}
			if(update.hasOwnProperty("y")){
				deltaY = update.y - token.data.y;
				needUpdate=true;
			}
			if(update.hasOwnProperty("rotation")){
				deltaRot = update.rotation - token.data.rotation;
				needUpdate=true;
			}
			
			if(!needUpdate) return true;
			const deltas = [tokenCenter, deltaX, deltaY, deltaRot, token.data, update];
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					await TokenAttacher.updateAttached(key, [key, attached[key]].concat(deltas));
				}
			}
			return true;
		}

		static updateAttached(type, data){
			if(TokenAttacher.isFirstActiveGM()) return TokenAttacher.getTypeCallback(type)(...data);
			else game.socket.emit(`module.${moduleName}`, {event: `attachedUpdate${type}`, eventdata: data});
		}

		static async AfterUpdateAttachedOfToken(parent, doc, update, options, userId){
			const token = canvas.tokens.get(update._id);
			const attached=token.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
			
			let needUpdate= false;
			if(		update.hasOwnProperty("x")
				||	update.hasOwnProperty("y")
				||	update.hasOwnProperty("rotation")){
				needUpdate= true;
			}

			if(!needUpdate) return;

			if(TokenAttacher.isFirstActiveGM()){
				await TokenAttacher.saveTokenPositon(token);
				TokenAttacher._CheckAttachedOfToken(token);
			}
		}

		static async saveTokenPositon(token){
			return token.setFlag(moduleName, "pos", {xy: {x:token.data.x, y:token.data.y}, center: {x:token.center.x, y:token.center.y}});
		}

		/**
		 * Workaround until 0.7.x fixes wall sight behaviour
		 */
		static performSightUpdates(entity, data, options, userId){
			if(window.tokenAttacher.updateSight.hasOwnProperty("walls")) {
				if(window.tokenAttacher.updateSight.walls.length > 0){
					const index = window.tokenAttacher.updateSight.walls.indexOf(data._id);
					if(index != -1){
						window.tokenAttacher.updateSight.walls.splice(index, 1);
						if(window.tokenAttacher.updateSight.walls.length == 0){
							TokenAttacher.updateSight();
						}
					}
				}
				return;
			}
		}
		/**
		 * Workaround until 0.7.x fixes wall sight behaviour
		 */
		static async updateSight(){
			console.log("Token Attacher| Force Sight update");
			await canvas.sight.initialize(); // This needs to happen first to rebuild FOV/LOS polygons
			canvas.lighting.initialize();
			canvas.sounds.initialize();
		}
		/**
		 * Workaround until 0.7.x fixes wall sight behaviour
		 */
		static pushSightUpdate(attached){
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					window.tokenAttacher.updateSight[key]= Array.from(new Set((window.tokenAttacher.updateSight[key] || []).concat(attached[key])));
					
				}
			}			
		}
		
		static _updateWalls(type, walls, tokenCenter, deltaX, deltaY, deltaRot, original_data, update_data){
				//Sightupdate workaround until 0.7.x fixes wall sight behaviour
				if(window.tokenAttacher.isPreSightUpdateVersion){
					TokenAttacher.pushSightUpdate(...[{walls:walls}]);
					game.socket.emit(`module.${moduleName}`, {event: "updateSight", eventdata: [{walls:walls}]});
				}
				return TokenAttacher._updateLineEntities(type, walls, tokenCenter, deltaX, deltaY, deltaRot, original_data, update_data);
		}

		static _updateLineEntities(type, line_entities, tokenCenter, deltaX, deltaY, deltaRot, original_data, update_data){
			const layer = eval(type).layer;
						
			if(deltaX != 0 || deltaY != 0 || deltaRot != 0){
				let updates = line_entities.map(w => {
					const line_entity = layer.get(w) || {};
					if(Object.keys(line_entity).length == 0) return;

					let c = duplicate(line_entity.data.c);
					[c[0],c[1]]  = TokenAttacher.moveRotatePoint({x:c[0], y:c[1], rotation:0}, tokenCenter,deltaX, deltaY, deltaRot);
					[c[2],c[3]]  = TokenAttacher.moveRotatePoint({x:c[2], y:c[3], rotation:0}, tokenCenter,deltaX, deltaY, deltaRot);

					//let p0 = layer._getWallEndpointCoordinates({x: c[0], y: c[1]}, {snap});
					//let p1 = layer._getWallEndpointCoordinates({x: c[2], y: c[3]}, {snap});

					return {_id: line_entity.data._id, c: c}
				});
				updates = updates.filter(n => n);
				if(Object.keys(updates).length == 0)  return; 
				return canvas.scene.updateEmbeddedEntity(type, updates);
			}
		}

		static _updateRectangleEntities(type, rect_entities, tokenCenter, deltaX, deltaY, deltaRot, original_data, update_data){
			const layer = eval(type).layer;

			if(deltaX != 0 || deltaY != 0 || deltaRot != 0){
				let updates = rect_entities.map(w => {
					const rect_entity = layer.get(w) || {};
					if(Object.keys(rect_entity).length == 0) return;
					return TokenAttacher.moveRotateRectangle(rect_entity, tokenCenter, deltaX, deltaY, deltaRot);
				});
				updates = updates.filter(n => n);
				if(Object.keys(updates).length == 0)  return; 
				return canvas.scene.updateEmbeddedEntity(type, updates);
			}
		}

		static _updatePointEntities(type, point_entities, tokenCenter, deltaX, deltaY, deltaRot, original_data, update_data){
			const layer = eval(type).layer;

			if(deltaX != 0 || deltaY != 0 || deltaRot != 0){
				let updates = point_entities.map(w => {
					const point_entity = layer.get(w) || {};
					let p = TokenAttacher.moveRotatePoint({x:point_entity.data.x, y:point_entity.data.y, rotation:0}, tokenCenter, deltaX, deltaY, deltaRot);
					return {_id: point_entity.data._id, x: p[0], y: p[1]};
				});
				updates = updates.filter(n => n);
				if(Object.keys(updates).length == 0)  return; 
				return canvas.scene.updateEmbeddedEntity(type, updates);
			}
		}

		static computeRotatedPosition(x,y,x2,y2,rotRad){
			const dx = x2 - x,
			dy = y2 - y;
			return [x + Math.cos(rotRad)*dx - Math.sin(rotRad)*dy,
				y + Math.sin(rotRad)*dx + Math.cos(rotRad)*dy];
		}

		/**
		 * Moves a rectangle by delta values and rotates around an anchor by a delta
		 * A rectangle is defined by having a center, data._id, data.x, data.y and data.rotation or data.direction
		 */
		static moveRotateRectangle(rect, anchor, deltaX, deltaY, deltaRot){			
			let rectCenter = duplicate(rect.center);
			rectCenter.x += deltaX;
			rectCenter.y += deltaY;

			let x = rect.data.x;
			let y = rect.data.y;
			x +=deltaX;
			y +=deltaY;
			let rotation = 0;
			if(rect.data.hasOwnProperty("rotation")){
			 	rotation = rect.data.rotation;
			}
			else if(rect.data.hasOwnProperty("direction")){
				rotation = rect.data.direction;
			}

			if(deltaRot !=0){
				// get vector from center to template
				const deltaRotRad = toRadians(deltaRot);
				// rotate vector around angle
				[rectCenter.x,rectCenter.y] = TokenAttacher.computeRotatedPosition(anchor.x, anchor.y, rectCenter.x, rectCenter.y, deltaRotRad);
				rotation+=deltaRot;
				
			}
			let rectDeltaX = rectCenter.x-(rect.center.x+deltaX);
			let rectDeltaY = rectCenter.y-(rect.center.y+deltaY);
			x += rectDeltaX;
			y += rectDeltaY;
		   if(rect.data.hasOwnProperty("direction")){
				return {_id: rect.data._id, x: x, y: y, direction: rotation};
		   }
			return {_id: rect.data._id, x: x, y: y, rotation: rotation};
		}

		/**
		 * Moves a rectangle by delta values and rotates around an anchor by a delta
		 * A rectangle is defined by having a center, data._id, data.x, data.y and data.rotation
		 */
		static moveRotatePoint(point, anchor, deltaX, deltaY, deltaRot){			
			point.x += deltaX;
			point.y += deltaY;
			point.rotation+=deltaRot;
			if(deltaRot !=0){
				// get vector from center to template
				const deltaRotRad = toRadians(deltaRot);
				// rotate vector around angle
				[point.x, point.y] = TokenAttacher.computeRotatedPosition(anchor.x, anchor.y, point.x, point.y, deltaRotRad);
				
			}	
			return [point.x, point.y, point.rotation];
		}

		/**
		 * Only the first active GM has to do the work
		 */
		static isFirstActiveGM(){
			const firstGm = game.users.find((u) => u.isGM && u.active);
			if (firstGm && game.user !== firstGm) {
				return false;
			}
			return true;
		}

		/**
		 * Warn the player if a token was moved that has attached parts
		 */
		static detectGM(){
			const firstGm = game.users.find((u) => u.isGM && u.active);
			if(!firstGm){
				return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoActiveGMFound"));
			}
		}
		
		/**
		 * Listen to custom socket events, so players can move elements indirectly through the gm
		 */
		static listen(data){
			//console.log("Token Attacher| some event");
			if(data.event.indexOf("attachedUpdate") === 0){
				if(TokenAttacher.isFirstActiveGM()){
					const type = data.event.split("attachedUpdate")[1];
					TokenAttacher.getTypeCallback(type)(...data.eventdata);
				}
			}
			else {
				switch (data.event) {
					case "updateSight":
						console.log("Token Attacher| Event updateSight");
						TokenAttacher.pushSightUpdate(...data.eventdata);
						break;
					default:
						console.log("Token Attacher| wtf did I just read?");
						break;
				}
			}
		}

		/**
		 * Attach previously saved selection to the currently selected token
		 */
		static async _AttachToToken(token, elements, suppressNotification=false){
			if(!token) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));
			if(!elements.hasOwnProperty("type")) return;

			let attached=token.getFlag(moduleName, `attached.${elements.type}`) || [];
			
			attached=elements.data;
			
			await token.setFlag(moduleName, `attached.${elements.type}`, attached);

			await TokenAttacher.saveTokenPositon(token);
			if(!suppressNotification) ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.ObjectsAttached"));
			return; 
		}

		static _AttachToTokenViaUI(){
			if(!canvas.tokens.controlled.length > 0) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));
			const target_token = canvas.tokens.controlled[0];
			const selected = window.tokenAttacher.selected;
			for (const key in selected) {
				if (selected.hasOwnProperty(key)) {
					TokenAttacher._AttachToToken( target_token, {type:key, data:selected[key]});
				}
			}
			window.tokenAttacher.selected = {};	
		}

		/**
		 * Detach previously saved selection of walls to the currently selected token
		 */
		static async _StartTokenAttach(token){
			if(!token) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));
			await canvas.scene.setFlag(moduleName, "attach_token", token.data._id);
			TokenAttacher.showTokenAttacherUI();
		}

		/**
		 * Check previously attached of the token and remove deleted items
		 */
		static _CheckAttachedOfToken(token){
			let attached=token.getFlag(moduleName, "attached") || {};
			let reducedAttached = duplicate(attached);
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					reducedAttached = TokenAttacher._removeAttachedRemnants(reducedAttached, key);
				}
			}
			
			if(Object.keys(reducedAttached).length == 0){
				token.unsetFlag(moduleName, "attached");
				return;
			}
			token.setFlag(moduleName, "attached", reducedAttached);
		}

		static _removeAttachedRemnants(attached, type){
			const col = eval(type).layer ?? eval(type).collection;
			
			let objects=attached[type].map(w => {
				const obj = col.get(w) || {};
				if(Object.keys(obj).length == 0) return;
				return w;
			});
			objects = objects.filter(n => n);
			attached[type]=objects;
			if(Object.keys(attached[type]).length == 0) {
				delete attached[type];
				attached[`-=${type}`] = null;
			}
			
			return attached;
		}

		/**
		 * Detach previously saved selection of walls to the currently selected token
		 */
		static _DetachFromToken(token, elements, suppressNotification=false){
			if(!token) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));
			if(!elements || !elements.hasOwnProperty("type")){
				token.unsetFlag(moduleName, "attached");
				if(!suppressNotification) ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.ObjectsDetached"));
				return;
			}
			else{
				let attached=token.getFlag(moduleName, `attached.${elements.type}`) || [];
				if(attached.length === 0) return;

				attached= attached.filter((item) => !elements.data.includes(item));
				
				token.setFlag(moduleName, `attached.${elements.type}`, attached).then(()=>{
					if(!suppressNotification) ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.ObjectsDetached"));
				});
			}
		}
		
		/**
		 * Save the selected objects so the selection can be reused later 
		 */
		static _SaveSelection(layer){
			if(layer.controlled.length <= 0) return ui.notifications.error(game.i18n.localize(`TOKENATTACHER.error.NothingSelected`));

			let selected = {}
			for (const element of layer.controlled) {
				const type = element.constructor.name;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}		
			window.tokenAttacher.selected= selected;
			ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.SelectionSaved"));
		}

		/**
		 * Hook into the toolbar and add buttons 
		 */
		static _getControlButtons(controls){
			for (let i = 0; i < controls.length; i++) {
				if(controls[i].name === "token"){
					controls[i].tools.push({
						name: "TAStartTokenAttach",
						title: game.i18n.localize("TOKENATTACHER.button.StartTokenAttach"),
						icon: "fas fa-link",
						visible: game.user.isGM,
						onClick: () => TokenAttacher._StartTokenAttach(canvas.tokens.controlled[0]),
						button: true
					  });
				}
			}
			console.log("WallToTokenLinker | Tools added.");
		}

		static attachElementToToken(element, target_token, suppressNotification=false){
			const type = element.constructor.name;
			const selected = [element.data._id];
			TokenAttacher._AttachToToken(target_token, {type:type, data:selected}, suppressNotification);
		}

		static async attachElementsToToken(element_array, target_token, suppressNotification=false){
			let selected = {}
			for (const element of element_array) {
				const type = element.constructor.name;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}
			for (const key in selected) {
				if (selected.hasOwnProperty(key)) {
					await TokenAttacher._AttachToToken(target_token, {type:key, data:selected[key]}, suppressNotification);
				}
			}
		}

		static async showTokenAttacherUI(){
			if(!canvas.scene.getFlag(moduleName, "attach_token")) return;
			if(document.getElementById("tokenAttacher"))TokenAttacher.closeTokenAttacherUI();
			
			const token = canvas.tokens.get(canvas.scene.getFlag(moduleName, "attach_token"));
			const path = `/modules/${moduleName}/templates`;
			const locked_status = token.getFlag(moduleName, "locked") || false;
			// Get the handlebars output
			const myHtml = await renderTemplate(`${path}/tokenAttacherUI.html`, {["token-image"]: token.data.img, ["token-name"]: token.data.name});

			document.getElementById("hud").insertAdjacentHTML('afterend', myHtml);

			let close_button=document.getElementById("tokenAttacher").getElementsByClassName("close")[0];
			let link_tool=document.getElementById("tokenAttacher").getElementsByClassName("link")[0];
			let unlink_tool=document.getElementById("tokenAttacher").getElementsByClassName("unlink")[0];
			let unlinkAll_tool=document.getElementById("tokenAttacher").getElementsByClassName("unlink-all")[0];
			let lock_tool=document.getElementById("tokenAttacher").getElementsByClassName("lock")[0];
			let highlight_tool=document.getElementById("tokenAttacher").getElementsByClassName("highlight")[0];
			let copy_tool=document.getElementById("tokenAttacher").getElementsByClassName("copy")[0];
			let paste_tool=document.getElementById("tokenAttacher").getElementsByClassName("paste")[0];

			if(locked_status){
				let icons = lock_tool.getElementsByTagName("i");
				icons[0].classList.toggle("hidden", true);
				icons[1].classList.toggle("hidden", false);
			}

			$(close_button).click(()=>{TokenAttacher.closeTokenAttacherUI();});
			$(link_tool).click(()=>{
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.localize(`TOKENATTACHER.error.NothingSelected`));
				if(current_layer.controlled.length == 1)
					TokenAttacher.attachElementToToken(current_layer.controlled[0], token);
				else{
					TokenAttacher.attachElementsToToken(current_layer.controlled, token);
				}
			});
			$(unlink_tool).click(()=>{
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.localize(`TOKENATTACHER.error.NothingSelected`));
				if(current_layer.controlled.length == 1)
					TokenAttacher.detachElementFromToken(current_layer.controlled[0], token);
				else{
					TokenAttacher.detachElementsFromToken(current_layer.controlled, token);
				}
			});
			$(unlinkAll_tool).click(()=>{
				TokenAttacher._DetachFromToken(token);
			});
			$(lock_tool).click(()=>{
				TokenAttacher.lockAttached(token, lock_tool);
			});
			$(highlight_tool).click(()=>{
				TokenAttacher.highlightAttached(token, highlight_tool);
			});
			$(copy_tool).click(()=>{
				TokenAttacher.copyAttached(token);
			});
			$(paste_tool).click(()=>{
				TokenAttacher.pasteAttached(token);
			});
		}

		static lockAttached(token, button){
			const attached=token.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
			const isLocked = token.getFlag(moduleName, "locked") || false;
			let icons = button.getElementsByTagName("i");
			
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					let layer = eval(key).layer ?? eval(key).collection;
					for (const elementid of attached[key]) {
						let element = layer.get(elementid);
						if(!isLocked) TokenAttacher.lockElement(key, element, false);
						else TokenAttacher.lockElement(key, element, true);
					}
				}
			}
			if(!isLocked){
				icons[0].classList.toggle("hidden", true);
				icons[1].classList.toggle("hidden", false);
			}
			else{
				icons[0].classList.toggle("hidden", false);
				icons[1].classList.toggle("hidden", true);
			}
			token.setFlag(moduleName, "locked", !isLocked); 
		}

		static highlightAttached(token, button){
			const attached=token.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
			let icons = button.getElementsByTagName("i");
			const isHighlighted = icons[0].classList.contains("hidden");

			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					let layer = eval(key).layer ?? eval(key).collection;
					for (const elementid of attached[key]) {
						let element = layer.get(elementid);
						if(!isHighlighted) element.alpha = 0.5;
						else element.alpha = 1;
					}
				}
			}
			if(!isHighlighted){
				icons[0].classList.toggle("hidden", true);
				icons[1].classList.toggle("hidden", false);
			}
			else{
				icons[0].classList.toggle("hidden", false);
				icons[1].classList.toggle("hidden", true);
			}
		}

		static async closeTokenAttacherUI(){
			document.getElementById("tokenAttacher").remove();
			canvas.scene.unsetFlag(moduleName, "attach_token");
		
		}

		static detachElementFromToken(element, target_token, suppressNotification=false){
			const type = element.constructor.name;
			const selected = [element.data._id];
			TokenAttacher._DetachFromToken(target_token, {type:type, data:selected}, suppressNotification);
		}

		static detachElementsFromToken(element_array, target_token, suppressNotification=false){
			let selected = {}
			for (const element of element_array) {
				const type = element.constructor.name;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}
			for (const key in selected) {
				if (selected.hasOwnProperty(key)) {
					TokenAttacher._DetachFromToken(target_token, {type:key, data:selected[key]}, suppressNotification);
				}
			}
		}

		static detachAllElementsFromToken(target_token, suppressNotification=false){
			TokenAttacher._DetachFromToken(target_token, {}, suppressNotification);
		}

		static getAllAttachedElementsOfToken(target_token, suppressNotification=false){
			return target_token.getFlag(moduleName, "attached") || {};
		}

		static getAllAttachedElementsByTypeOfToken(target_token, type, suppressNotification=false){
			return target_token.getFlag(moduleName, `attached.${type}`) || {};
		}

		static getObjectsFromIds(type, idArray, tokenxy, token_center){
			let layer = eval(type).layer ?? eval(type).collection;
			let copyArray = [];
			let offset = {x:Number.MAX_SAFE_INTEGER, y:Number.MAX_SAFE_INTEGER};
			for (const elementid of idArray) {
				let element = {data:duplicate(layer.get(elementid).data)};
				delete element.data._id;
				copyArray.push(element);
				if(offset.x == Number.MAX_SAFE_INTEGER){
					offset.x = element.data.x || (element.data.c[0] < element.data.c[2] ? element.data.c[0] : element.data.c[2]);
					offset.y = element.data.y || (element.data.c[1] < element.data.c[3] ? element.data.c[1] : element.data.c[3]);
				}
				else{
					let x = element.data.x || (element.data.c[0] < element.data.c[2] ? element.data.c[0] : element.data.c[2]);
					let y = element.data.y || (element.data.c[1] < element.data.c[3] ? element.data.c[1] : element.data.c[3]);
					if(x < offset.x) offset.x = x;
					if(y < offset.y) offset.y = y;
				}
			}
			if(type == "Wall"){
				offset.x -= tokenxy.x;
				offset.y -= tokenxy.y;
			}
			else{
				offset.x -= token_center.x; 
				offset.y -= token_center.y;
			}
			return {objs: copyArray, offset: offset};
		}

		static async copyAttached(token){
			let copyObjects = {};
			const attached=token.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
		
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					const offsetObjs = TokenAttacher.getObjectsFromIds(key, attached[key], {x:token.data.x, y:token.data.y}, token.center);

					copyObjects[key]=offsetObjs;
				}
			}
			await game.user.unsetFlag(moduleName, "copy");			
			await game.user.setFlag(moduleName, "copy", copyObjects);	
			ui.notifications.info(`Copied attached elements.`);	
		}

		static async pasteAttached(token){
			const copyObjects = game.user.getFlag(moduleName, "copy") || {};
			if(Object.keys(copyObjects).length == 0) return;
		
			let pasted = [];
			for (const key in copyObjects) {
				if (copyObjects.hasOwnProperty(key) && key !== "unknown") {
					let layer = eval(key).layer ?? eval(key).collection;

					let pos = {x:token.data.x + copyObjects[key].offset.x , y:token.data.y+ copyObjects[key].offset.y};
					const created = await TokenAttacher.pasteObjects(layer, copyObjects[key].objs, pos);
					if(Array.isArray(created)){
						pasted = pasted.concat(created.map((obj)=>{
							return layer.get(obj._id);
						}));
					}
					else{
						pasted.push(layer.get(created._id));
					}
				}
			}
			if(pasted.length <= 0) return;
			TokenAttacher.attachElementsToToken(pasted, token, true);
			ui.notifications.info(`Pasted elements and attached to token.`);
		}

		static async pasteObjects(layer, objects, pos, {hidden = false} = {}){
			if ( !objects.length ) return [];
			const cls = layer.constructor.placeableClass;

			if(cls.name == "Wall") return await TokenAttacher.pasteWalls(layer, objects, pos);

			// Adjust the pasted position for half a grid space
			pos.x += canvas.dimensions.size / 2;
			pos.y += canvas.dimensions.size / 2;

			// Get the left-most object in the set
			objects.sort((a, b) => a.data.x - b.data.x);
			let {x, y} = objects[0].data;

			// Iterate over objects
			const toCreate = [];
			for ( let c of objects) {
				let data = duplicate(c.data);
				delete data._id;
				toCreate.push(mergeObject(data, {
					x: pos.x + (data.x - x),
					y: pos.y + (data.y - y),
					hidden: data.hidden || hidden
				}));
			}

			// Create all objects
			const created = await canvas.scene.createEmbeddedEntity(cls.name, toCreate);
			//ui.notifications.info(`Pasted data for ${toCreate.length} ${cls.name} objects.`);
			return created;
		}

		static async pasteWalls(layer, objects, pos, options = {}){
			//----------------------------------------------------------------------------
			if ( !objects.length ) return;
			const cls = layer.constructor.placeableClass;
		
			// Transform walls to reference their upper-left coordinates as {x,y}
			const [xs, ys] = objects.reduce((arr, w) => {
			  arr[0].push(Math.min(w.data.c[0], w.data.c[2]));
			  arr[1].push(Math.min(w.data.c[1], w.data.c[3]));
			  return arr;
			}, [[], []]);
		
			// Get the top-left most coordinate
			const topX = Math.min(...xs);
			const topY = Math.min(...ys);
		
			// Get the magnitude of shift
			const dx = Math.floor(topX - pos.x);
			const dy = Math.floor(topY - pos.y);
			const shift = [dx, dy, dx, dy];
		
			// Iterate over objects
			const toCreate = [];
			for ( let w of objects ) {
			  let data = duplicate(w.data);
			  data.c = data.c.map((c, i) => c - shift[i]);
			  delete data._id;
			  toCreate.push(data);
			}
		
			// Create all objects
			const created = await canvas.scene.createEmbeddedEntity("Wall", toCreate);
			//ui.notifications.info(`Pasted data for ${toCreate.length} ${cls.name} objects.`);
			return created;
		}

		static async updateAttachedPrototype(entity, data, options, userId){
			if(data.hasOwnProperty("token")){
				if(data.token.hasOwnProperty("flags")){
					if(data.token.flags.hasOwnProperty(moduleName)){
						const attached = data.token.flags[moduleName].attached || {};
						if(Object.keys(attached).length == 0) return;

						let prototypeAttached = TokenAttacher.generatePrototypeAttached(data.token, attached);
						let deletes = {_id:data._id, [`token.flags.${moduleName}.-=attached`]: null, [`token.flags.${moduleName}.-=prototypeAttached`]: null};
						let updates = {_id:data._id, [`token.flags.${moduleName}`]: {prototypeAttached: prototypeAttached}};
						await entity.update(deletes);
						await entity.update(updates);
					}
				}
			}
		}

		static generatePrototypeAttached(token_data, attached){
			let prototypeAttached = {};
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					
					const offsetObjs = TokenAttacher.getObjectsFromIds(key, attached[key], token_data.flags[moduleName].pos.xy, token_data.flags[moduleName].pos.center);
					let layer = eval(key).layer ?? eval(key).collection;
					prototypeAttached[key] = {};
					prototypeAttached[key] = offsetObjs;
				}
			}	
			return prototypeAttached;
		}

		static async copyTokens(layer, tokens){
			const copyPrototypeMap = game.user.getFlag(moduleName, "copyPrototypeMap") || {};
			const prototypeMap= {};
			tokens.forEach(token => {
				if(		token.data.flags.hasOwnProperty(moduleName)
					&& 	token.data.flags[moduleName].hasOwnProperty("attached")){
					prototypeMap[token.id] = TokenAttacher.generatePrototypeAttached(token.data, token.data.flags[moduleName].attached);
				}
			});
			copyPrototypeMap[layer.constructor.placeableClass.name] = prototypeMap;
			await game.user.unsetFlag(moduleName, "copyPrototypeMap");
			await game.user.setFlag(moduleName, "copyPrototypeMap", copyPrototypeMap);
		}

		static pasteTokens(copy, toCreate){
			const copyPrototypeMap = game.user.getFlag(moduleName, "copyPrototypeMap") || {};
			for (let i = 0; i < toCreate.length; i++) {
				if(		toCreate[i].flags.hasOwnProperty(moduleName)
					&& 	toCreate[i].flags[moduleName].hasOwnProperty("attached")){
					delete toCreate[i].flags[moduleName].attached;
					const clsname = copy[i].layer.constructor.placeableClass.name;
					if(copyPrototypeMap.hasOwnProperty(clsname))
						toCreate[i].flags[moduleName].prototypeAttached = copyPrototypeMap[clsname][copy[i].data._id];				
				}
			}
		}

		static async deleteToken(entity, token_data, userId){
			const attached=getProperty(token_data, `flags.${moduleName}.attached`) || {};
			if(Object.keys(attached).length == 0) return true;

			TokenAttacher.detectGM();

			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					let layer = eval(key).layer ?? eval(key).collection;
					await layer.deleteMany(attached[key]);
				}
			}
		}

		static async updateAttachedCreatedToken(parent, entity, options, userId){
			const token = canvas.tokens.get(entity._id);
			const prototypeAttached = token.getFlag(moduleName, "prototypeAttached") || {};
			const attached = token.getFlag(moduleName, "attached") || {};

			if(getProperty(options, "isUndo") === true){
				if(Object.keys(attached).length > 0){
					await TokenAttacher.regenerateAttachedFromHistory(token, attached);
				}
				return;
			}

			if(Object.keys(prototypeAttached).length > 0) await TokenAttacher.regenerateAttachedFromPrototype(token, prototypeAttached);
			return;
		}

		static async regenerateAttachedFromPrototype(token, prototypeAttached){
			let pasted = [];
			for (const key in prototypeAttached) {
				if (prototypeAttached.hasOwnProperty(key) && key !== "unknown") {
					let layer = eval(key).layer ?? eval(key).collection;

					let pos = {x:token.data.x + prototypeAttached[key].offset.x , y:token.data.y+ prototypeAttached[key].offset.y};
					const created = await TokenAttacher.pasteObjects(layer, prototypeAttached[key].objs, pos);
					if(Array.isArray(created)){
						pasted = pasted.concat(created.map((obj)=>{
							return layer.get(obj._id);
						}));
					}
					else{
						pasted.push(layer.get(created._id));
					}
				}
			}
			if(pasted.length <= 0) return;
			await token.unsetFlag(moduleName, "prototypeAttached");
			TokenAttacher.attachElementsToToken(pasted, token, true);
			ui.notifications.info(`Pasted elements and attached to token.`);
		}

		static async regenerateAttachedFromHistory(token, attached){
			TokenAttacher.detectGM();
			const newattached= {};
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && attached[key].length > 0) {
					let layer = eval(key).layer ?? eval(key).collection;
					
					const undone = await layer.undoHistory();
					if(Array.isArray(undone)){
						newattached[key] = undone.map((obj)=>{
							return obj.data._id;
						});
					}
					else{
						newattached[key] = [undone.data._id];
					}
				}
			}
			
			await token.unsetFlag(moduleName, `attached`);
			await token.setFlag(moduleName, `attached`, newattached);
		}
	}

	TokenAttacher.registerHooks();
})();
