(async () => {
	//CONFIG.debug.hooks = true
	class TokenAttacher {
		static initialize(){
			if(TokenAttacher.isFirstActiveGM()){
				canvas.scene.unsetFlag("token-attacher","selected");
				console.log("Token Attacher| Initzialized");
			}

			window['token-attacher'] = {};
			window['token-attacher'].selected = {};
			//Sightupdate workaround until 0.7.x fixes wall sight behaviour
			window['token-attacher'].updateSight={};
			window['token-attacher'].updateSight.walls=[];

			Hooks.on("preUpdateToken", (parent, doc, update, options, userId) => TokenAttacher.UpdateWallsWithToken(parent, doc, update, options, userId));
			Hooks.on("UpdateToken", (parent, doc, update, options, userId) => TokenAttacher.AfterUpdateWallsWithToken(parent, doc, update, options, userId));
			//Sightupdate workaround until 0.7.x fixes wall sight behaviour
			Hooks.on("updateWall", (entity, data, options, userId) => TokenAttacher.performSightUpdates(entity, data, options, userId));
		}


		static UpdateWallsWithToken(parent, doc, update, options, userId){
			const token = canvas.tokens.get(update._id);
			const attached=token.getFlag("token-attacher", "attached") || {};
			const tokenCenter = token.center;
			if(Object.keys(attached).length = 0) return;

			console.log("WallToTokenLinker |  this is a attached ");
			TokenAttacher.detectGM();
			if(attached.hasOwnProperty("walls")){
				console.log("Token Attacher| this is a attached with attached walls");
				console.log(attached);
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

				if(needUpdate){
					const data = [attached.walls, tokenCenter, deltaX, deltaY, deltaRot];
					if(TokenAttacher.isFirstActiveGM()){
						TokenAttacher._updateWalls(...data);
					}
					else{
						game.socket.emit('module.token-attacher', {event: "updateWalls", eventdata: data});
					}
				}
			}
		}

		static AfterUpdateWallsWithToken(parent, doc, update, options, userId){
			const token = canvas.tokens.get(update._id);
			const attached=token.getFlag("token-attacher", "attached") || {};
			if(Object.keys(attached).length = 0) return;

			console.log("WallToTokenLinker |  this is a attached ");
			if(attached.hasOwnProperty("walls")){
				console.log("Token Attacher| this is a attached with attached walls after update");
				console.log(attached);
				if(		update.hasOwnProperty("x")
					||	update.hasOwnProperty("y")
					||	update.hasOwnProperty("rotation")){
					if(TokenAttacher.isFirstActiveGM()){
						TokenAttacher._CheckAttachedOfToken(token);
					}
				}
			}
		}

		/**
		 * Workaround until 0.7.x fixes wall sight behaviour
		 */
		static performSightUpdates(entity, data, options, userId){
			if(window['token-attacher'].updateSight.hasOwnProperty("walls")) {
				if(window['token-attacher'].updateSight.walls.length > 0){
					const index = window['token-attacher'].updateSight.walls.indexOf(data._id);
					if(index != -1){
						window['token-attacher'].updateSight.walls.splice(index, 1);
						if(window['token-attacher'].updateSight.walls.length == 0){
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
					window['token-attacher'].updateSight[key]= Array.from(new Set((window['token-attacher'].updateSight[key] || []).concat(attached[key])));
					
				}
			}			
		}
		
		static _updateWalls(walls, tokenCenter, deltaX, deltaY, deltaRot){
			
				//Sightupdate workaround until 0.7.x fixes wall sight behaviour
				TokenAttacher.pushSightUpdate(...[{walls:walls}]);
				game.socket.emit('module.token-attacher', {event: "updateSight", eventdata: [{walls:walls}]});

				const layer = Wall.layer;
				const snap = false;
						
				// Move Token
				if(deltaX != 0 || deltaY != 0 || deltaRot != 0){
					let updates = walls.map(w => {
						const wall = canvas.walls.get(w) || {};
						if(Object.keys(wall).length == 0) return;

						let c = duplicate(wall.data.c);

						c[0] = c[0]+deltaX;
						c[1] = c[1]+deltaY
						c[2] = c[2]+deltaX;
						c[3] = c[3]+deltaY;
						if(deltaRot !=0){
							// get vector from center to template
							const deltaRotRad = toRadians(deltaRot);
							// rotate vector around angle
							[c[0],c[1]] = TokenAttacher.computeRotatedPosition(tokenCenter.x, tokenCenter.y, c[0], c[1], deltaRotRad);
							[c[2],c[3]] = TokenAttacher.computeRotatedPosition(tokenCenter.x, tokenCenter.y, c[2], c[3], deltaRotRad);
							
						}
						let p0 = layer._getWallEndpointCoordinates({x: c[0], y: c[1]}, {snap});
						let p1 = layer._getWallEndpointCoordinates({x: c[2], y: c[3]}, {snap});

						

						return {_id: wall.data._id, c: p0.concat(p1)}
					});
					updates = updates.filter(n => n);
					if(Object.keys(updates).length == 0)  return; 
					canvas.scene.updateEmbeddedEntity("Wall", updates);
				}
		}

		static computeRotatedPosition(x,y,x2,y2,rotRad){
			const dx = x2 - x,
			dy = y2 - y;
			return [x + Math.cos(rotRad)*dx - Math.sin(rotRad)*dy,
				y + Math.sin(rotRad)*dx + Math.cos(rotRad)*dy];
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
		 * Listen to custom socket events, so players can move walls indirectly through the gm
		 */
		static listen(data){
			console.log("Token Attacher| some event");
			switch (data.event) {
				case "updateWalls":
					if(TokenAttacher.isFirstActiveGM()){
						console.log("Token Attacher| Event updateWalls");
						TokenAttacher._updateWalls(...data.eventdata);
					}
					break;
				case "updateSight":
					console.log("Token Attacher| Event updateSight");
					TokenAttacher.pushSightUpdate(...data.eventdata);
					break;
				default:
					console.log("Token Attacher| wtf did I just read?");
					break;
			}
		}

		/**
		 * Attach previously saved selection to the currently selected token
		 */
		static _AttachToToken(){
			if(Object.keys(canvas.tokens._controlled).length <= 0) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));

			const controlledTokens = Object.keys(canvas.tokens._controlled);
			for (let index = 0; index < controlledTokens.length; index++) {
				const controlledToken = canvas.tokens.get(controlledTokens[index]);
				
				const selection=window['token-attacher'].selected || {};
				if(selection.hasOwnProperty("type")){
					let attached=controlledToken.getFlag("token-attacher", "attached") || {};
					switch ( selection.type ) {
						case "walls":
							attached["walls"]=selection.data;
							controlledToken.unsetFlag("token-attacher", "attached").then(()=>{
								controlledToken.setFlag("token-attacher", "attached", attached);
								ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.ObjectsAttached"));
							})
						default:
							;
					  }
					window['token-attacher'].selected = {};
					return; 
				}
			}
		}

		/**
		 * Check previously attached of the token and remove deleted items
		 */
		static _CheckAttachedOfToken(token){
			let attached=token.getFlag("token-attacher", "attached") || {};
					
			if(attached.hasOwnProperty("walls")){
				let walls=attached.walls.map(w => {
					const wall = canvas.walls.get(w) || {};
					if(Object.keys(wall).length == 0) return;
					return w;
				});
				walls = walls.filter(n => n);
				attached.walls=walls;
			}
			token.unsetFlag("token-attacher", "attached").then(()=>{
				token.setFlag("token-attacher", "attached", attached);
			});
		}

		/**
		 * Detach previously saved selection of walls to the currently selected token
		 */
		static _DetachFromToken(){
			if(Object.keys(canvas.tokens._controlled).length <= 0) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoTokensSelected"));

			const controlledTokens = Object.keys(canvas.tokens._controlled);
			for (let index = 0; index < controlledTokens.length; index++) {
				const controlledToken = canvas.tokens.get(controlledTokens[index]);
				
				controlledToken.unsetFlag("token-attacher", "attached");
				ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.ObjectsDetached"));
			}
		}
		

		/**
		 * Save the selected walls so the selection can be reused later 
		 */
		static _SaveWallSelection(){
			if(Object.keys(canvas.walls._controlled).length <= 0) return ui.notifications.error(game.i18n.localize("TOKENATTACHER.error.NoWallsSelected"));
			const selectedWalls = Object.keys(canvas.walls._controlled);
			
			canvas.scene.setFlag("token-attacher","selected", {type:"walls", data:selectedWalls});
			ui.notifications.info(game.i18n.localize("TOKENATTACHER.info.SelectionSaved"));
		}

		/**
		 * Hook into the toolbar and add buttons 
		 */
		static _getControlButtons(controls){
			for (let i = 0; i < controls.length; i++) {
				if(controls[i].name === "token"){
					controls[i].tools.push({
						name: "TAAttachToToken",
						title: game.i18n.localize("TOKENATTACHER.button.AttachToToken"),
						icon: "fas fa-link",
						visible: game.user.isGM,
						onClick: () => TokenAttacher._AttachToToken(),
						button: true
					  });
					  controls[i].tools.push({
						  name: "TADetachFromToken",
						  title: game.i18n.localize("TOKENATTACHER.button.DetachFromToken"),
						  icon: "fas fa-unlink",
						  visible: game.user.isGM,
						  onClick: () => TokenAttacher._DetachFromToken(),
						  button: true
						});
				}
				else if(controls[i].name === "walls"){
					controls[i].tools.push({
						name: "TASaveWallSelection",
						title: game.i18n.localize("TOKENATTACHER.button.SaveSelection"),
						icon: "fas fa-object-group",
						visible: game.user.isGM,
						onClick: () => TokenAttacher._SaveWallSelection(),
						button: true
					  });
				}
			}
			console.log("WallToTokenLinker | Tools added.");
		}
	}

	Hooks.on('getSceneControlButtons', (controls) => TokenAttacher._getControlButtons(controls));
	Hooks.on('canvasReady', () => TokenAttacher.initialize());
	Hooks.once('ready', () => {
		game.socket.on('module.token-attacher', (data) => TokenAttacher.listen(data));
	});
})();
