'use strict';
import {libWrapper} from './shim.js';
 
(async () => {
	const moduleName = "token-attacher";
	const templatePath = `/modules/${moduleName}/templates`;
	const dataModelVersion = 3;
	//CONFIG.debug.hooks = true
	const localizedStrings = {
		error : {
			NothingSelected: 				"TOKENATTACHER.error.NothingSelected",
			NoTokensSelected:				"TOKENATTACHER.error.NoTokensSelected",
			NoActiveGMFound:				"TOKENATTACHER.error.NoActiveGMFound",	
			ExportAllowsOnlyActor:			"TOKENATTACHER.error.ExportAllowsOnlyActor",	
			NoValidJSONProvided:			"TOKENATTACHER.error.NoValidJSONProvided",	
			ElementAlreadyAttachedInChain:	"TOKENATTACHER.error.ElementAlreadyAttachedInChain",
			ActorDataModelNeedsMigration:	"TOKENATTACHER.error.ActorDataModelNeedsMigration",
			MigrationErrorScene:			"TOKENATTACHER.error.MigrationErrorScene",
			QuickEditNotFinished:			"TOKENATTACHER.error.QuickEditNotFinished",
			PostProcessingNotFinished:		"TOKENATTACHER.error.PostProcessingNotFinished",
			OnlyTokenToggleAnimate:			"TOKENATTACHER.error.OnlyTokenToggleAnimate",
			BaseDoesntExist:				"TOKENATTACHER.error.BaseDoesntExist",
			UIisOpenOnAssign:				"TOKENATTACHER.error.UIisOpenOnAssign"
		},
		info : {
			ObjectsAttached:				"TOKENATTACHER.info.ObjectsAttached",
			ObjectsDetached:				"TOKENATTACHER.info.ObjectsDetached",
			SelectionSaved:					"TOKENATTACHER.info.SelectionSaved",
			MigrationInProgress:			"TOKENATTACHER.info.MigrationInProgress",
			MigratedScene:					"TOKENATTACHER.info.MigratedScene",
			DataModelMergedTo:				"TOKENATTACHER.info.DataModelMergedTo",
			MigratedActors:					"TOKENATTACHER.info.MigratedActors",
			MigratingCompendium:			"TOKENATTACHER.info.MigratingCompendium",
			MigratedCompendiums:			"TOKENATTACHER.info.MigratedCompendiums",
			DragSelectElements:				"TOKENATTACHER.info.DragSelectElements",
			PostProcessingFinished:			"TOKENATTACHER.info.PostProcessingFinished",
			PastedAndAttached:				"TOKENATTACHER.info.PastedAndAttached",
			ObjectsUnlocked:				"TOKENATTACHER.info.ObjectsUnlocked",
			ObjectsLocked:					"TOKENATTACHER.info.ObjectsLocked",
			AnimationToggled:				"TOKENATTACHER.info.AnimationToggled"
		},
		button : {
			AttachToToken:					"TOKENATTACHER.button.AttachToToken",
			DetachFromToken:				"TOKENATTACHER.button.DetachFromToken",
			SaveSelection:					"TOKENATTACHER.button.SaveSelection",
			StartTokenAttach:				"TOKENATTACHER.button.StartTokenAttach",
			ToggleQuickEditMode:			"TOKENATTACHER.button.ToggleQuickEditMode",
			select:							"TOKENATTACHER.button.select",
			link:							"TOKENATTACHER.button.link",
			unlink:							"TOKENATTACHER.button.unlink",
			'unlink-all':					"TOKENATTACHER.button.unlink-all",
			lock:							"TOKENATTACHER.button.lock",
			highlight:						"TOKENATTACHER.button.highlight",
			copy:							"TOKENATTACHER.button.copy",
			paste:							"TOKENATTACHER.button.paste",
			toggleAnimate:					"TOKENATTACHER.button.toggleAnimate",
			close:							"TOKENATTACHER.button.close",
			gmMenu: {
				SceneMigration:				"TOKENATTACHER.button.gmMenu.SceneMigration",
				ActorsMigration:			"TOKENATTACHER.button.gmMenu.ActorsMigration",
				CompendiumsMigration:		"TOKENATTACHER.button.gmMenu.CompendiumsMigration",
				ImportJSONDialog:			"TOKENATTACHER.button.gmMenu.ImportJSONDialog",
				ExportActorsToJSON:			"TOKENATTACHER.button.gmMenu.ExportActorsToJSON",
				ResetMigration:				"TOKENATTACHER.button.gmMenu.ResetMigration",
				PurgeTADataInScene:			"TOKENATTACHER.button.gmMenu.PurgeTADataInScene"
			}
		},
		setting : {
			MLTBlockMovement:				"TOKENATTACHER.setting.MLTBlockMovement",
			MLTBlockMovementHint:			"TOKENATTACHER.setting.MLTBlockMovementHint"
		}
	}
	class TASettings extends FormApplication {
		static init() {
		game.settings.registerMenu(moduleName, 'menu', {
			name: '',
			label: 'Token Attacher GM Menu',
			type: TASettings,
			restricted: true
		  });
		game.settings.register(moduleName, 'MLTBlockMovement', {
			name: game.i18n.localize("TOKENATTACHER.setting.MLTBlockMovement"),
			hint: game.i18n.localize("TOKENATTACHER.setting.MLTBlockMovementHint"),
			scope: "world",
			config: true,
			type: Boolean,
			default: false
		});
		}
	
		static get defaultOptions() {
			return {
				...super.defaultOptions,
				template: `${templatePath}/tokenAttacherSettings.html`,
				height: "auto",
				title: "Token Attacher GM Menu",
				width: 600,
				classes: ["token-attacher-gm-menu","settings"],
				tabs: [ 
					{
						navSelector: '.tabs',
						contentSelector: 'form',
						initial: 'info'
					} 
				],
				submitOnClose: false
			}
		}
	
	
		constructor(object = {}, options) {
			super(object, options);
		}
	
		_getHeaderButtons() {
			return super._getHeaderButtons();
		}
	
	
		getData() {
			return  super.getData();
		}
	
		activateListeners(html) {
			let reset_migration=html.find(".reset-migration");
			let force_scene_migration=html.find(".scene-migration");
			let force_actor_migration=html.find(".actor-migration");
			let force_compendium_migration=html.find(".compendium-migration");
			let import_json_dialog=html.find(".import-json-dialog");
			let export_actors_to_json=html.find(".export-actors-to-json");
			let purge_ta_data_in_scene=html.find(".purge-ta-data-in-scene");

			reset_migration.click(()=>{TokenAttacher._resetMigration();});
			force_scene_migration.click(()=>{TokenAttacher._migrateScene();});
			force_actor_migration.click(()=>{TokenAttacher.migrateAllPrototypeActors();});
			force_compendium_migration.click(()=>{TokenAttacher.migrateAllActorCompendiums();});
			import_json_dialog.click(()=>{TokenAttacher.importFromJSONDialog();});
			export_actors_to_json.click(()=>{TokenAttacher.getActorsWithPrototype();});
			purge_ta_data_in_scene.click(()=>{TokenAttacher.purgeTAData();});
		}
	
	}

	class TokenAttacher {
		static initMacroAPI(){
			if(getProperty(window,'tokenAttacher.attachElementToToken')) return;
			window.tokenAttacher = {
				...window.tokenAttacher, 
				attachElementToToken: TokenAttacher.attachElementToToken,
				attachElementsToToken: TokenAttacher.attachElementsToToken,
				detachElementFromToken: TokenAttacher.detachElementFromToken,
				detachElementsFromToken: TokenAttacher.detachElementsFromToken,
				detachAllElementsFromToken: TokenAttacher.detachAllElementsFromToken,
				getAllAttachedElementsOfToken: TokenAttacher.getAllAttachedElementsOfToken,
				getAllAttachedElementsByTypeOfToken: TokenAttacher.getAllAttachedElementsByTypeOfToken,
				getActorsWithPrototype: TokenAttacher.getActorsWithPrototype,
				getActorsWithPrototypeInCompendiums: TokenAttacher.getActorsWithPrototypeInCompendiums,
				importFromJSONDialog: TokenAttacher.importFromJSONDialog,
				importFromJSON: TokenAttacher.importFromJSON,
				setElementsLockStatus: TokenAttacher.setElementsLockStatus,
				regenerateLinks: TokenAttacher.regenerateLinks,
				toggleQuickEditMode: TokenAttacher.toggleQuickEditMode,
				deleteMissingLinks: TokenAttacher.deleteMissingLinks,
				toggleAnimateStatus: TokenAttacher.toggleAnimateStatus,
				setAnimateStatus: TokenAttacher.setAnimateStatus,
				migrateElementsInCompendiums: TokenAttacher.migrateElementsInCompendiums,
				migrateAttachedOfBase: TokenAttacher.migrateAttachedOfBase,
			};
			Hooks.callAll(`${moduleName}.macroAPILoaded`);
		}

		static initialize(){
			if(TokenAttacher.isFirstActiveGM()){
				canvas.scene.unsetFlag(moduleName,"selected");
				console.log("Token Attacher| Initialized");
			}

			window.tokenAttacher = {};
			window.tokenAttacher.selected = {};
			
			TokenAttacher.initMacroAPI();

			TokenAttacher.updatedLockedAttached();

		}

		static registerHooks(){
			Hooks.on('init', () => {
				TokenAttacher.registerSettings();
			});

			Hooks.on('ready', () => {
				TokenAttacher.initMacroAPI();
				if(TokenAttacher.isFirstActiveGM()){
					TokenAttacher.startMigration();
				}
			});
		
			Hooks.on('getSceneControlButtons', (controls) => TokenAttacher._getControlButtons(controls));
			Hooks.on('canvasReady', () => TokenAttacher.initialize());
			Hooks.once('ready', () => {
				game.socket.on(`module.${moduleName}`, (data) => TokenAttacher.listen(data));
			});
			
			Hooks.on('canvasReady', () => {
				libWrapper.register(moduleName, 'canvas.mouseInteractionManager.callbacks.dragLeftDrop', function (wrapped, ...args) {
					let result = wrapped(...args);

					TokenAttacher._RectangleSelection(...args);
					return result;
				}, 'WRAPPER');
			});

			Hooks.on("preUpdateToken", (document, change, options, userId) => TokenAttacher.UpdateBasePosition("Token", document, change, options, userId));
			Hooks.on("updateToken", (document, change, options, userId) => TokenAttacher.UpdateAttachedOfToken("Token", document, change, options, userId));
			Hooks.on("updateActor", (document, change, options, userId) => TokenAttacher.updateAttachedPrototype(document, change, options, userId));
			Hooks.on("preCreateToken", (document, data, options, userId) => TokenAttacher.preCreateBase(document, data, options, userId));
			Hooks.on("createToken", (document, options, userId) => TokenAttacher.updateAttachedCreatedToken("Token", document, options, userId));
			Hooks.on("pasteToken", (copy, toCreate) => TokenAttacher.pasteTokens(copy, toCreate));
			Hooks.on("deleteToken", (document, options, userId) => TokenAttacher.deleteToken(document, options, userId));
			Hooks.on("canvasInit", (canvasObj) => TokenAttacher.canvasInit(canvasObj));
			Hooks.on("createPlaceableObjects", (parent, createdObjs, options, userId) => TokenAttacher.batchPostProcess(parent, createdObjs, options, userId));

			for (const type of ["AmbientLight", "AmbientSound", "Drawing", "MeasuredTemplate", "Note", "Tile", "Token", "Wall"]) {
				//Attached elements are not allowed to be moved by anything other then Token Attacher
				Hooks.on(`update${type}`, (document, change, options, userId) => TokenAttacher.updateOffset(type, document, change, options, userId));
				Hooks.on(`preUpdate${type}`, (document, change, options, userId) => TokenAttacher.isAllowedToMove(document, change, options, userId));
				Hooks.on(`preUpdate${type}`, (document, change, options, userId) => TokenAttacher.handleBaseMoved(document, change, options, userId));
				Hooks.on(`preDelete${type}`, (document, options, userId) => TokenAttacher.isAllowedToMove(document, {}, options, userId));
				Hooks.on(`control${type}`, (object, isControlled) => TokenAttacher.isAllowedToControl(object, isControlled)); //Check hook signature
				//Deleting attached elements should detach them
				Hooks.on(`delete${type}`, (document, options, userId) => TokenAttacher.DetachAfterDelete(type, document, options, userId));
				//Recreating an element from Undo History will leave them detached, so reattach them
				Hooks.on(`create${type}`, (document, options, userId) => TokenAttacher.ReattachAfterUndo(type, document, options, userId));
				//Instant Attach on create if UI is open
				Hooks.on(`preCreate${type}`, (document, data, options, userId) => TokenAttacher.PreInstantAttach(type, document, data, options, userId));
				Hooks.on(`create${type}`, (document,  options, userId) => TokenAttacher.InstantAttach(type, document, options, userId));
			}
			
		
			Hooks.on("getCompendiumDirectoryEntryContext", async (html, options) => {
				options.push( 
					{
					  name : "(TA)Export to JSON",
					  condition: game.user.isGM,
					  icon: '<i class="fas fa-file-export"></i>',
					  callback: target => {
						let pack = game.packs.get(target.data("pack"));
						if(pack.metadata.entity !== "Actor") return ui.notifications.error(game.i18n.format(localizedStrings.error.ExportAllowsOnlyActor));
						TokenAttacher.exportCompendiumToJSON(pack);
					  }
					  
					})
			});

			//Monkeypatch PlaceablesLayer.copyObjects to hook into it
			var oldCopyObjects= PlaceablesLayer.prototype.copyObjects;

			PlaceablesLayer.prototype.copyObjects= function() {
				const result = oldCopyObjects.apply(this, arguments);
				switch(this.constructor.documentName){
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
				default: dataModelVersion,
				type: Number,
				scope: "world",
				config: false
			});

			TASettings.init();
		}
		static async _resetMigration(){
			await game.settings.set(moduleName, "data-model-version", dataModelVersion-1);
			TokenAttacher.startMigration();
		}
		static async startMigration(){
			let currentDataModelVersion = game.settings.get(moduleName, "data-model-version");
			//Migration to Model 2 is last supported on 3.2.3
			if(currentDataModelVersion < 3){
				game.settings.set(moduleName, "data-model-version", dataModelVersion + 99999);
				await TokenAttacher.migrateToDataModel_3();
			}
		}

		static async migrateToDataModel_3(){
			ui.notifications.info(game.i18n.format(localizedStrings.info.MigrationInProgress, {version: dataModelVersion}));
			let scene_id_array = [];
			let scene_collection = game.collections.get("Scene");
			for (const scene of scene_collection) {
				scene_id_array.push(scene.data._id);	
			}
			
			if(game.scenes.get(scene_id_array[0]) !== game.scenes.active){
				Hooks.once('canvasReady', () => TokenAttacher.migrateSceneHook(scene_id_array));
				await game.scenes.get(scene_id_array[0]).activate();
			}
			else{
				TokenAttacher.migrateSceneHook(scene_id_array);
			}
		}

		static async _migrateScene(){
			TokenAttacher.migrateSceneHook([game.scenes.active._id]);
		}

		static async migrateSceneHook(remaining_scenes){
			try {				
				if(remaining_scenes.length > 0){
					if(game.scenes.get(remaining_scenes[0]) !== game.scenes.active){
						Hooks.once('canvasReady', () => TokenAttacher.migrateSceneHook(remaining_scenes));
						return;
					}
					else {
						for (const token of canvas.tokens.placeables) {
							const attached=token.document.getFlag(moduleName, 'attached') || {};
							if(Object.keys(attached).length > 0){
								await TokenAttacher._attachElementsToToken(attached, token, true);					
							}
						}
						
						console.log("Token Attacher | " + game.i18n.format(localizedStrings.info.MigratedScene, {scenename: game.scenes.active.name}) );
						ui.notifications.info(game.i18n.format(localizedStrings.info.MigratedScene, {scenename: game.scenes.active.name}));
						remaining_scenes.shift();
						if(remaining_scenes.length > 0){
							Hooks.once('canvasReady', () => TokenAttacher.migrateSceneHook(remaining_scenes));
							await game.scenes.get(remaining_scenes[0]).activate();
							return;	
						}
					}
				}
				game.settings.set(moduleName, "data-model-version", dataModelVersion);
				console.log("Token Attacher | " + game.i18n.format(localizedStrings.info.DataModelMergedTo, {version: dataModelVersion}) );
				ui.notifications.info(game.i18n.format(localizedStrings.info.DataModelMergedTo, {version: dataModelVersion}));
			} catch (error) {
				console.error(error);
				ui.notifications.error(game.i18n.format(localizedStrings.error.MigrationErrorScene, {scene: game.scenes.active.name}));				
			}	
		}

		static migrateAllPrototypeActors(){
			const folders = {};
			const allActors = [...game.actors].filter(actor =>{
				const attached = getProperty(actor, `data.token.flags.${moduleName}.prototypeAttached`) || {};
				if(Object.keys(attached).length > 0) return true;
				return false;
			});
			const allMappedActors = allActors.map(async (actor) => {return await TokenAttacher.migrateActor(actor)});
			
			console.log("Token Attacher | " + game.i18n.format(localizedStrings.info.MigratedActors) );
			ui.notifications.info(game.i18n.format(localizedStrings.info.MigratedActors));
		}
		
		static async migrateActor(actor, return_data = false){
			let tokenData = await TokenAttacher.migrateElement(null, null, duplicate(getProperty(actor, `data.token`)), "Token");
			setProperty(tokenData, `flags.${moduleName}.grid`, {size:canvas.grid.size, w: canvas.grid.w, h:canvas.grid.h});
			if(!return_data) await actor.update({token: tokenData});
			return tokenData;
		}

		static isPrototypeAttachedModel(prototypeAttached, model){
			switch(model){
				case 2:
					return prototypeAttached[Object.keys(prototypeAttached)[0]].hasOwnProperty("objs");
			}
			return false;
		}

		static async migrateElement(parent_data, parent_type, data, type, migrationid=1){
			let updates = {};
			//Migrate to offset
			if(parent_data){
				const offset = getProperty(data, `flags.${moduleName}.offset`);
				if(!offset){
					let parent_pos = duplicate(getProperty(parent_data, `flags.${moduleName}.pos`));
					setProperty(data, `flags.${moduleName}.parent`, parent_pos.base_id);
					setProperty(data, `flags.${moduleName}.offset`, TokenAttacher.getElementOffset(type, data, parent_type, mergeObject(mergeObject(parent_pos, parent_data), parent_pos.xy), {}));
				}
				else{
					let migrated_offset = TokenAttacher.getElementOffset(type, data, parent_type, mergeObject(mergeObject(parent_pos, parent_data), parent_pos.xy), {})
					setProperty(data, `flags.${moduleName}.offset`, mergeObject(migrated_offset, offset));
				}
			}
			//Migrate Attached
			const prototypeAttached = getProperty(data, `flags.${moduleName}.prototypeAttached`);
			if(prototypeAttached){
				
				if(TokenAttacher.isPrototypeAttachedModel(prototypeAttached, 2)){					
					//Set Pos
					let posData = getProperty(data, `flags.${moduleName}.pos`);
					posData.base_id = migrationid++;
					posData.rotation = data.rotation;
					setProperty(data, `flags.${moduleName}.pos`, posData);
					//Update attached
					let migratedPrototypeAttached = {};
					for (const key in prototypeAttached){
						if (prototypeAttached.hasOwnProperty(key)) {
							migratedPrototypeAttached[key]=prototypeAttached[key].objs.map(item => item.data);
							for (let i = 0; i < migratedPrototypeAttached[key].length; i++) {
								const element = migratedPrototypeAttached[key][i];
								await TokenAttacher.migrateElement(data, type, element, key, migrationid);								
							}
						}
					}
					setProperty(data, `flags.${moduleName}.prototypeAttached`, migratedPrototypeAttached);
				}
			}
			return data;
		}

		static async migrateAllActorCompendiums(){
			const allCompendiums = [...game.packs].filter(pack =>{
				if(pack.locked) return false;
				if(pack.metadata.entity !== "Actor") return false;
				return true;
			});
			
			for (let i = 0; i < allCompendiums.length; i++) {
				const pack = allCompendiums[i];
				const packIndex = await pack.getIndex();
				console.log("Token Attacher | " + game.i18n.format(localizedStrings.info.MigratingCompendium, {compendium: pack.metadata.label}) );
				ui.notifications.info(game.i18n.format(localizedStrings.info.MigratingCompendium, {compendium: pack.metadata.label}));
				
				for (const index of packIndex) {
					const entity = await pack.getDocument(index._id);
					const prototypeAttached = getProperty(entity, `data.token.flags.${moduleName}.prototypeAttached`);
					if(prototypeAttached){
						if(TokenAttacher.isPrototypeAttachedModel(prototypeAttached, 2)){
							const update = await TokenAttacher.migrateActor(entity, true);
							await pack.updateEntity({_id: index._id, [`token`]: update});
						}
					}
				}
			}
			console.log("Token Attacher | " + game.i18n.format(localizedStrings.info.MigratedCompendiums));
			ui.notifications.info(game.i18n.format(localizedStrings.info.MigratedCompendiums));
		}

		static updatedLockedAttached(){
			const tokens = canvas.tokens.placeables;
			for (const token of tokens) {
				const attached=token.document.getFlag(moduleName, "attached") || {};
				if(Object.keys(attached).length == 0) continue;
				const isLocked = token.document.getFlag(moduleName, "locked") || false;
				if(isLocked)
					for (const key in attached) {
						if (attached.hasOwnProperty(key) && key !== "unknown") {
							let layer = TokenAttacher.getLayerOrCollection(key);
							for (const elementid of attached[key]) {
								let element = TokenAttacher.layerGetElement(layer, elementid);
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
		static async UpdateBasePosition(type, document, change, options, userId){
			if(!(	change.hasOwnProperty("x")
				||	change.hasOwnProperty("y")
				||	change.hasOwnProperty("c")
				||	change.hasOwnProperty("rotation")
				||	change.hasOwnProperty("direction")
				||	change.hasOwnProperty("width")
				||	change.hasOwnProperty("height")
				||	change.hasOwnProperty("radius")
				||	change.hasOwnProperty("dim")
				||	change.hasOwnProperty("bright")
				||	change.hasOwnProperty("distance")
				||	change.hasOwnProperty("hidden")

				||	change.hasOwnProperty("elevation")
				||	change.flags?.levels?.hasOwnProperty("rangeTop")
				||	change.flags?.wallHeight?.hasOwnProperty("wallHeightTop")
				)){
				return true;
			}
			let baseData = duplicate(document.data);
			mergeObject(baseData, change);
			let basePos = await TokenAttacher.saveBasePositon(type, baseData, true);
			mergeObject(change, basePos);
			return true;
		}

		static async UpdateAttachedOfToken(type, document, change, options, userId){
			if(!(	change.hasOwnProperty("x")
				||	change.hasOwnProperty("y")
				||	change.hasOwnProperty("c")
				||	change.hasOwnProperty("rotation")
				||	change.hasOwnProperty("direction")
				||	change.hasOwnProperty("width")
				||	change.hasOwnProperty("height")
				||	change.hasOwnProperty("radius")
				||	change.hasOwnProperty("dim")
				||	change.hasOwnProperty("bright")
				||	change.hasOwnProperty("distance")
				||	change.hasOwnProperty("hidden")

				||	change.hasOwnProperty("elevation")
				||	change.flags?.levels?.hasOwnProperty("rangeTop")
				||	change.flags?.wallHeight?.hasOwnProperty("wallHeightTop")
				)){
				return;
			}
			const layer = canvas.getLayerByEmbeddedName(type);
			let base = TokenAttacher.layerGetElement(layer, document.data._id);
			const attached=base.document.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return true;

			if(game.user.data._id === userId && game.user.isGM){
				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvas.scene.data._id === quickEdit.scene){
					if(!getProperty(options, `${moduleName}.QuickEdit`)) return;
					clearTimeout(quickEdit.timer);
					TokenAttacher._quickEditUpdateOffsetsOfBase(quickEdit, type, document.data);
					quickEdit.timer = setTimeout(TokenAttacher.saveAllQuickEditOffsets, 1000);
					return;
				}
			}
			if(!TokenAttacher.isFirstActiveGM()) return;
			if(getProperty(options, `${moduleName}.QuickEdit`)) return;
			const tokenCenter = duplicate(base.center);
			if(Object.keys(attached).length == 0) return true;
			if(getProperty(options, `${moduleName}.update`)) return true;

			TokenAttacher.detectGM();

			const data = [type, mergeObject(duplicate(base.data), change)];
			if(TokenAttacher.isFirstActiveGM()) return TokenAttacher._UpdateAttachedOfBase(...data);
			else return game.socket.emit(`module.${moduleName}`, {event: `_UpdateAttachedOfBase`, eventdata: data});
		}

		static async _UpdateAttachedOfBase(type, baseData, return_data=false){
			const attached=getProperty(baseData, `flags.${moduleName}.attached`) || {};
			let attachedEntities = {};
			
			//Get Entities
			for (const key in attached) {
				const layer = canvas.getLayerByEmbeddedName(key);
				attachedEntities[key] = attached[key].map(id => TokenAttacher.layerGetElement(layer, id));
			}

			let updates = {};

			//Get updates for attached elements
			for (const key in attachedEntities) {
				if (attachedEntities.hasOwnProperty(key)) {
					if(!updates.hasOwnProperty(key)) updates[key] = [];
					updates[key] = await TokenAttacher.offsetPositionOfElements(key, attachedEntities[key].map(entity => duplicate(entity.data)), type, baseData, {});
					if(!updates[key]) delete updates[key];
				}
			}

			for (const key in attachedEntities) {
				if (attachedEntities.hasOwnProperty(key)) {
					for (let i = 0; i < attachedEntities[key].length; i++) {
						const element = attachedEntities[key][i];
						const elem_id = element.data._id;
						
						const elem_attached=getProperty(element, `data.flags.${moduleName}.attached`) || {};
						if(Object.keys(elem_attached).length > 0){
							const elem_update = updates[key].find(item => item._id === elem_id );
							const updatedElementData = mergeObject(duplicate(element.data), elem_update);
							const subUpdates = await TokenAttacher._UpdateAttachedOfBase(key, updatedElementData, true);
							for (const key in subUpdates) {
								if (subUpdates.hasOwnProperty(key)) {
									updates[key] = subUpdates[key].concat(updates[key] ?? []);	
									let base_updates = updates[key].filter(item => item._id === elem_id);
									if(base_updates.length > 0){
										let non_base_updates = updates[key].filter(item => item._id !== elem_id);
										let merge_update = {};
										for (let j = 0; j < base_updates.length; j++) {
											merge_update = mergeObject(merge_update, base_updates[j]);
											
										}
										non_base_updates.push(merge_update);
										updates[key] = non_base_updates;
									}
								
								}
							}
						}
					}
				}
			}
			if(return_data) return updates;
			
			//Fire all updates by type
			for (const key in updates) {
				await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});
			}

			return;
		}

		//base can be an PlacableObject but als plain data if return_data is true
		static async saveBasePositon(type, base, return_data=false, overrideData){
			let pos;
			let data = base.data ?? base;
			data = duplicate(data);
			const center = TokenAttacher.getCenter(type, data);
			if(overrideData) data = mergeObject(data, overrideData);

			pos = {base_id: getProperty(data, '_id')
				, xy: {x:data.x, y:data.y}
				, center: {x:center.x, y:center.y}
				, rotation:data.rotation ?? data.direction
				, hidden: data.hidden
				, elevation: data.elevation ?? data.flags?.levels?.rangeBottom ?? data.flags?.wallHeight?.wallHeightBottom
			};


			if(!return_data) return base.document.setFlag(moduleName, "pos", pos);

			return {_id:data._id, 
				[`flags.${moduleName}.pos`]: pos};
		}

		static offsetPositionOfElements(type, data, baseType, baseData, grid){
			let baseOffset = {};
			baseOffset.center = TokenAttacher.getCenter(baseType, baseData, grid);
			baseOffset.rotation = getProperty(baseData, "rotation") ?? getProperty(baseData, "direction");
			baseOffset.size = TokenAttacher.getSize(baseData);
			baseOffset.elevation = baseData.elevation ?? baseData.flags?.levels?.elevation ?? baseData.flags?.levels?.rangeBottom ?? baseData.flags?.wallHeight?.wallHeightBottom;
			
			if(!Array.isArray(data)) data = [data];

			let updates = data.map(w => {
				return mergeObject(
					{_id: w._id},
					TokenAttacher.offsetPositionOfElement(type, w, baseOffset)
					);
			});
			if(Object.keys(updates).length == 0)  return; 
			return updates;		
		}

		static offsetPositionOfElement(type, data, baseOffset){
			const offset = getProperty(data, `flags.${moduleName}.offset`);
			const size_multi = {w: baseOffset.size[0] / offset.size.widthBase, h: baseOffset.size[1] / offset.size.heightBase};
			let update = {};
			
			//Elevation
			if(offset.elevation?.hasOwnProperty('elevation')){
				update.elevation = baseOffset.elevation + offset.elevation.elevation;
			}
			if(offset.elevation?.flags?.levels?.hasOwnProperty('elevation')){
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.levels?.elevation) === false) update['flags.levels.elevation'] = baseOffset.elevation + offset.elevation.flags.levels.elevation;
			}
			if(offset.elevation?.flags?.levels?.hasOwnProperty('rangeBottom') || offset.elevation?.flags?.levels?.hasOwnProperty('rangeTop')){
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.levels?.rangeBottom) === false) update['flags.levels.rangeBottom'] = baseOffset.elevation + offset.elevation.flags.levels.rangeBottom;
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.levels?.rangeTop) === false) update['flags.levels.rangeTop'] = baseOffset.elevation + offset.elevation.flags.levels.rangeTop;
			}
			if(offset.elevation?.flags?.wallHeight?.hasOwnProperty('wallHeightBottom') || offset.elevation?.flags?.wallHeight?.hasOwnProperty('wallHeightTop')){
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightBottom) === false) update['flags.wallHeight.wallHeightBottom'] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightBottom;
				if([null, Infinity, -Infinity].includes(offset.elevation?.flags?.wallHeight?.wallHeightTop) === false) update['flags.wallHeight.wallHeightTop'] = baseOffset.elevation + offset.elevation.flags.wallHeight.wallHeightTop;
			}

			//Line Entities
			if('c' in data){
				let c = duplicate(data.c);	
				[offset.x, offset.y] = [offset.c[0], offset.c[1]];
				[c[0],c[1]]  = TokenAttacher.moveRotatePoint({x:c[0], y:c[1], rotation:0}, offset, baseOffset.center, baseOffset.rotation, size_multi);
				[offset.x, offset.y] = [offset.c[2], offset.c[3]];
				[c[2],c[3]]  = TokenAttacher.moveRotatePoint({x:c[2], y:c[3], rotation:0}, offset, baseOffset.center, baseOffset.rotation, size_multi);
				update.c=c;
				return update;
			}
			//Rectangle Entities
			if('width' in data || 'distance' in data || 'dim' in data || (data.hasOwnProperty('config') && 'dim' in data.config) || 'radius' in data){
				const [x,y,rotation] =TokenAttacher.moveRotateRectangle(data, offset, baseOffset.center, baseOffset.rotation, size_multi);
				update.x = x;
				update.y = y;
				if(data.hasOwnProperty("direction")) update.direction = rotation;
				if(data.hasOwnProperty("rotation")) update.rotation = rotation;
				
				if(data.hasOwnProperty('width')){
					update.width 	= offset.size.width  * size_multi.w;
					update.height 	= offset.size.height * size_multi.h;
				}
				if(data.hasOwnProperty('distance')){
					update.distance = offset.size.distance * size_multi.w;
				}
				if(data.hasOwnProperty('dim')){
					update.dim 		= offset.size.dim    * size_multi.w;
					update.bright 	= offset.size.bright * size_multi.w;
				}
				if(data.hasOwnProperty('config') && data.config.hasOwnProperty('dim')){
					update.config = {};
					update.config.dim 		= (offset.size.config?.dim ?? offset.size.dim)   * size_multi.w;
					update.config.bright 	= (offset.size.config?.bright ?? offset.size.bright) * size_multi.w;
				}
				if(data.hasOwnProperty('radius')){
					update.radius 	= offset.size.radius * size_multi.w;
				}
				if(data.hasOwnProperty('points')){
					let points = duplicate(data.points);
					for (let i = 0; i < points.length; i++) {
						points[i][0] = offset.points[i][0] * size_multi.w;
						points[i][1] = offset.points[i][1] * size_multi.h;					
					}
					update.points = points;
				}
				return update;
			}
			//Point Entities
			const [x,y] = TokenAttacher.moveRotatePoint({x:data.x, y:data.y, rotation:0}, offset, baseOffset.center, baseOffset.rotation, size_multi);
			update.x = x;
			update.y = y;
			return update;
		}

		static computeRotatedPosition(x,y,x2,y2,rotRad, size_multi){
			const dx = (x2 - x) * size_multi.w,
			dy = (y2 - y) * size_multi.h;
			return [x + Math.cos(rotRad)*dx - Math.sin(rotRad)*dy,
				y + Math.sin(rotRad)*dx + Math.cos(rotRad)*dy];
		}

		/**
		 * Moves a rectangle by offset values and rotates around an anchor
		 * A rectangle is defined by having a center, data._id, data.x, data.y and data.rotation or data.direction
		 */
		static moveRotateRectangle(rect, offset, anchorCenter, anchorRot, size_multi){
			let x =anchorCenter.x + offset.x;
			let	y =anchorCenter.y + offset.y; 
			let newRot = (anchorRot + offset.offRot) % 360;
			//if(newRot != offset.rot){
				// get vector from center to template
				const deltaRotRad = Math.toRadians((newRot - offset.rot) % 360);
				// rotate vector around angle
				let rectCenter = {};
				rectCenter.x = anchorCenter.x + offset.centerX;
				rectCenter.y = anchorCenter.y + offset.centerY;
				[rectCenter.x,rectCenter.y] = TokenAttacher.computeRotatedPosition(anchorCenter.x, anchorCenter.y, rectCenter.x, rectCenter.y, deltaRotRad, size_multi);
				x = rectCenter.x - (offset.centerX - offset.x) * size_multi.w;
				y = rectCenter.y - (offset.centerY - offset.y) * size_multi.h;
			//}
			return [x, y, newRot];
		}

		/**
		 * Moves a point by offset values and rotates around an anchor
		 * A point is defined by x,y,rotation
		 */
		static moveRotatePoint(point, offset, anchorCenter, anchorRot, size_multi){			
			point.x = anchorCenter.x + offset.x;
			point.y = anchorCenter.y + offset.y; 
			point.rotation=(anchorRot + offset.offRot) % 360;
			//if(point.rotation != offset.rot){
				// get vector from center to template
				const deltaRotRad = Math.toRadians((point.rotation - offset.rot) % 360);
				// rotate vector around angle
				[point.x, point.y] = TokenAttacher.computeRotatedPosition(anchorCenter.x, anchorCenter.y, point.x, point.y, deltaRotRad, size_multi);
				
			//}	
			return [point.x, point.y, point.rotation];
		}

		/**
		 * Only the first active GM has to do the work
		 */
		static isFirstActiveGM(){
			const firstGm = game.users.find((u) => u.isGM && u.active);
			if (firstGm && game.user === firstGm) {
				return true;
			}
			return false;
		}

		/**
		 * Warn the player if a token was moved that has attached parts
		 */
		static detectGM(){
			const firstGm = game.users.find((u) => u.isGM && u.active);
			if(!firstGm){
				return ui.notifications.error(game.i18n.format(localizedStrings.error.NoActiveGMFound));
			}
		}
		
		/**
		 * Listen to custom socket events, so players can move elements indirectly through the gm
		 */
		static listen(data){
			switch (data.event) {
				case "createPlaceableObjects":
					{
						let [parent, createdObjs, options, userId] = data.eventdata;
						parent = game.scenes.get(parent._id);
						Hooks.callAll("createPlaceableObjects", parent, createdObjs, options, userId);
					}
					break;
				case "AttachToToken":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._AttachToToken(...data.eventdata);
					break;
				case "DetachFromToken":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._DetachFromToken(...data.eventdata);
					break;
				case "attachElementsToToken":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._attachElementsToToken(...data.eventdata);
					break;
				case "detachElementsFromToken":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._detachElementsFromToken(...data.eventdata);
					break;
				case "ReattachAfterUndo":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._ReattachAfterUndo(...data.eventdata);
					break;
				case "UpdateAttachedOfBase":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._UpdateAttachedOfBase(...data.eventdata);
					break;
				case "setElementsLockStatus":
					if(TokenAttacher.isFirstActiveGM())	TokenAttacher._setElementsLockStatus(...data.eventdata);
					break;
				default:
					console.log("Token Attacher| wtf did I just read?");
					break;
			}
		}

		/**
		 * Attach elements to token
		 */
		static async _AttachToToken(token, elements, suppressNotification=false, return_data=false){
			if(typeof token === 'string' || token instanceof String) token = canvas.tokens.get(token);
			if(!token) return ui.notifications.error(game.i18n.format(localizedStrings.error.NoTokensSelected));
			if(!elements.hasOwnProperty("type")) return;
			
			let updates = {};
			let attached=duplicate(token.document.getFlag(moduleName, `attached.${elements.type}`) || []);
			
			const col = TokenAttacher.getLayerOrCollection(elements.type);
			attached = attached.concat(elements.data.filter((item) => attached.indexOf(item) < 0))
			//Filter non existing
			attached = attached.filter((item) => TokenAttacher.layerGetElement(col, item));
			let all_attached=duplicate(token.document.getFlag(moduleName, `attached`) || {});
			all_attached[elements.type] = attached;
			const dup = TokenAttacher.areDuplicatesInAttachChain(token, all_attached);
			if(dup !== false){
				console.log("Token Attacher | Element already in Attached Chain: ", dup);
				return ui.notifications.error(game.i18n.format(localizedStrings.error.ElementAlreadyAttachedInChain));
			}

			let token_update = await TokenAttacher.saveBasePositon(token.layer.constructor.documentName, token, true);
			token_update[`flags.${moduleName}.attached.${elements.type}`] = attached;
			updates[token.layer.constructor.documentName] = [token_update];

			const xy = {x:token.data.x, y:token.data.y};
			const center = {x:token.center.x, y:token.center.y};
			const rotation = token.data.rotation;

			const tokensize = TokenAttacher.getElementSize(token);
			if(!updates.hasOwnProperty(elements.type)) updates[elements.type] = [];

			for (let i = 0; i < attached.length; i++) {
				const element = col.get(attached[i]);
				updates[elements.type].push({_id:attached[i], 
					[`flags.${moduleName}.parent`]: token.data._id, 
					[`flags.${moduleName}.offset`]: TokenAttacher.getElementOffset(elements.type, element.data, token.layer.constructor.documentName, token.data, {})});
			}
			if(return_data){
				return updates;
			}
			if(token.layer.constructor.documentName !== elements.type) {
				await canvas.scene.updateEmbeddedDocuments(token.layer.constructor.documentName, updates[token.layer.constructor.documentName]);
			}
			await canvas.scene.updateEmbeddedDocuments(elements.type, updates[elements.type]);

			if(!suppressNotification) ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsAttached));
			return; 
		}

		/**
		 * Detach previously saved selection of walls to the currently selected token
		 */
		static async _StartTokenAttach(token){
			if(!token) return ui.notifications.error(game.i18n.format(localizedStrings.error.NoTokensSelected));
			TokenAttacher.showTokenAttacherUI(token);
		}

		/**
		 * Update Offset of all Attached elements
		 */
		static async _updateAttachedOffsets({type, element}){
			const updateFunc = async (base) =>{
				let attached=base.document.getFlag(moduleName, "attached") || {};
				for (const key in attached) {
					if (attached.hasOwnProperty(key) && key !== "unknown") {
						await TokenAttacher._AttachToToken(base, {type:key, data:attached[key]}, true);
						await TokenAttacher._updateAttachedOffsets({type:key, element:attached[key]});
					}
				}
			}
			const layer = canvas.getLayerByEmbeddedName(type);
			if(typeof element === 'string' || element instanceof String) element = TokenAttacher.layerGetElement(layer, element);
			if(Array.isArray(element)){
				for (let i = 0; i < element.length; i++) {
					const elem = TokenAttacher.layerGetElement(layer, element[i]);
					await updateFunc(elem);
				}
			}
			else await updateFunc(element);
		}

		/**
		 * Detach previously saved selection of walls to the currently selected token
		 */
		static async _DetachFromToken(token, elements, suppressNotification=false, options={}){
			if(!token) return ui.notifications.error(game.i18n.format(localizedStrings.error.NoTokensSelected));
			if(typeof token === 'string' || token instanceof String) token = canvas.tokens.get(token);
			if(!token) return;
			if(!elements || !elements.hasOwnProperty("type")){
				//Detach all
				let attached=token.document.getFlag(moduleName, `attached`);
				if(Object.keys(attached).length > 0){
					for (const key in attached) {
						if (attached.hasOwnProperty(key)) {
							const arr = attached[key];
							let deletes = [];
							for (let i = 0; i < arr.length; i++) {
								deletes.push({_id: arr[i], [`flags.${moduleName}.-=parent`]: null, [`flags.${moduleName}.-=offset`]: null, [`flags.${moduleName}.-=unlocked`]: null});
							}	
							if(deletes.length > 0)	await canvas.scene.updateEmbeddedDocuments(key, deletes, {[moduleName]:{update:true}});						
						}
					}
				}

				await token.document.unsetFlag(moduleName, "attached");
				if(!suppressNotification) ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsDetached));
				return;
			}
			else{
				//Detach all passed elements
				let attached=token.document.getFlag(moduleName, `attached.${elements.type}`) || [];
				if(attached.length === 0) return;

				attached= attached.filter((item) => !elements.data.includes(item));
								
				let deletes = [];
				for (let i = 0; i < elements.data.length; i++) {
					deletes.push({_id: elements.data[i], [`flags.${moduleName}.-=parent`]: null, [`flags.${moduleName}.-=offset`]: null, [`flags.${moduleName}.-=unlocked`]: null});
				}
				if(deletes.length > 0 && !options.skip_update) await canvas.scene.updateEmbeddedDocuments(elements.type, deletes, {[moduleName]:{update:true}});	
				await token.document.setFlag(moduleName, `attached.${elements.type}`, attached);
				if(!suppressNotification) ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsDetached));
			}
		}
		
		/**
		 * Hook into the toolbar and add buttons 
		 */
		static _getControlButtons(controls){
			for (let i = 0; i < controls.length; i++) {
				if(controls[i].name === "token"){
					controls[i].tools.push({
						name: "TAStartTokenAttach",
						title: game.i18n.format(localizedStrings.button.StartTokenAttach),
						icon: "fas fa-link",
						visible: game.user.isGM,
						onClick: () => TokenAttacher._StartTokenAttach(canvas.tokens.controlled[0]),
						button: true
					  });
					controls[i].tools.push({
						name: "TAToggleQuickEdit",
						title: game.i18n.format(localizedStrings.button.ToggleQuickEditMode),
						icon: "fas fa-feather-alt",
						visible: game.user.isGM,
						onClick: () => TokenAttacher.toggleQuickEditMode(),
						button: true
					});
				}
			}
			console.log("Token Attacher | Tools added.");
		}

		static async attachElementToToken(element, target_token, suppressNotification=false){
			const type = element.layer.constructor.documentName;
			const selected = [element.data._id];
			
			if(TokenAttacher.isFirstActiveGM()) return await TokenAttacher._AttachToToken(target_token, {type:type, data:selected}, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `AttachToToken`, eventdata: [target_token.data._id, {type:type, data:selected}, suppressNotification]});
			
		}

		static async attachElementsToToken(element_array, target_token, suppressNotification=false){
			let selected = {}
			for (const element of element_array) {
				const type = element.layer.constructor.documentName;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}
			if(TokenAttacher.isFirstActiveGM()) return await TokenAttacher._attachElementsToToken(selected, target_token, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `attachElementsToToken`, eventdata: [selected, target_token.data._id, suppressNotification]});
		}

		static async _attachElementsToToken(selected, target_token, suppressNotification=false){
			if(typeof target_token === 'string' || target_token instanceof String) target_token = canvas.tokens.get(target_token);
			let updates = {};
			const type = target_token.layer.constructor.documentName;
			for (const key in selected) {
				if (selected.hasOwnProperty(key)) {
					let newUpdates =await TokenAttacher._AttachToToken(target_token, {type:key, data:selected[key]}, suppressNotification, true);
					if(Object.keys(updates).length <= 0) updates = newUpdates;
					else{
						for (const key in newUpdates) {
							if (newUpdates.hasOwnProperty(key)) {
								if(!updates.hasOwnProperty(key)) updates[key] = [];
								updates[key] = updates[key].concat(newUpdates[key]);
							}
						}
					}
				}
			}
			if(updates.hasOwnProperty(type)){
				let target_token_updates = updates[type].filter(item => item._id === target_token.data._id);
				let other_updates = updates[type].filter(item => item._id !== target_token.data._id);
				let base_updates = {};
				for (let i = 0; i < target_token_updates.length; i++) {
					base_updates = mergeObject(base_updates, target_token_updates[i]);					
				}
				other_updates.push(base_updates);
				updates[type] = other_updates;
			}

			for (const key in updates) {
				if (updates.hasOwnProperty(key)) {
					await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});	
				}
			}
		}
		static isAttachmentUIOpen(){
			return window.document.getElementById("tokenAttacher") !== null;
		}
		static async showTokenAttacherUI(token){
			if(!token) return;
			if(TokenAttacher.isAttachmentUIOpen()) await TokenAttacher.closeTokenAttacherUI();			
			await canvas.scene.setFlag(moduleName, "attach_base", {type:token.layer.constructor.documentName, element:token.document.data._id});
			const locked_status = token.document.getFlag(moduleName, "locked") || false;
			// Get the handlebars output
			const myHtml = await renderTemplate(`${templatePath}/tokenAttacherUI.html`, {["token-image"]: token.document.data.img, ["token-name"]: token.document.data.name});

			window.document.getElementById("hud").insertAdjacentHTML('afterend', myHtml);

			const attachmentUI=window.document.getElementById("tokenAttacher");

			let close_button=attachmentUI.getElementsByClassName("close")[0];
			let link_tool=attachmentUI.getElementsByClassName("link")[0];
			let unlink_tool=attachmentUI.getElementsByClassName("unlink")[0];
			let unlinkAll_tool=attachmentUI.getElementsByClassName("unlink-all")[0];
			let select_tool=attachmentUI.getElementsByClassName("select")[0];
			let highlight_tool=attachmentUI.getElementsByClassName("highlight")[0];
			let copy_tool=attachmentUI.getElementsByClassName("copy")[0];
			let paste_tool=attachmentUI.getElementsByClassName("paste")[0];
			let lock_tool=attachmentUI.getElementsByClassName("lock")[0];
			let unlock_tool=attachmentUI.getElementsByClassName("unlock")[0];
			let toggle_animate_tool=attachmentUI.getElementsByClassName("toggle-animate")[0];

			const base_exists = ()=>{				
				const attachment_base = canvas.scene.getFlag(moduleName, "attach_base");			
				const layer = canvas.getLayerByEmbeddedName(attachment_base.type);
				const base = this.layerGetElement(layer, attachment_base.element);
				if(!base){
					TokenAttacher.closeTokenAttacherUI();
					ui.notifications.error(game.i18n.format(localizedStrings.error.BaseDoesntExist));
					return false;
				}
				return true;
			}

			$(close_button).click(()=>{
				if(!base_exists()) return;
				TokenAttacher.closeTokenAttacherUI();
			});
			$(link_tool).click(()=>{
				if(!base_exists()) return;
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.format(localizedStrings.error.NothingSelected));
				if(current_layer.controlled.length == 1)
					TokenAttacher.attachElementToToken(current_layer.controlled[0], token);
				else{
					TokenAttacher.attachElementsToToken(current_layer.controlled, token);
				}
			});
			$(unlink_tool).click(()=>{
				if(!base_exists()) return;
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.format(localizedStrings.error.NothingSelected));
				if(current_layer.controlled.length == 1)
					TokenAttacher.detachElementFromToken(current_layer.controlled[0], token);
				else{
					TokenAttacher.detachElementsFromToken(current_layer.controlled, token);
				}
			});
			$(unlinkAll_tool).click(()=>{
				if(!base_exists()) return;
				TokenAttacher._DetachFromToken(token);
			});
			$(select_tool).click(()=>{
				if(!base_exists()) return;
				select_tool.classList.toggle("active");				
				if($(attachmentUI).find(".control-tool.select.active").length > 0){
					ui.notifications.info(game.i18n.format(localizedStrings.info.DragSelectElements));
				}
			});
			$(highlight_tool).click(()=>{
				if(!base_exists()) return;
				TokenAttacher.highlightAttached(token, highlight_tool);
			});
			$(copy_tool).click(()=>{
				if(!base_exists()) return;
				TokenAttacher.copyAttached(token);
			});
			$(paste_tool).click(()=>{
				if(!base_exists()) return;
				TokenAttacher.pasteAttached(token);
			});
			$(toggle_animate_tool).click(()=>{
				if(!base_exists()) return;
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.format(localizedStrings.error.NothingSelected));
				if(current_layer !== canvas.getLayerByEmbeddedName("Token")) return ui.notifications.error(game.i18n.format(localizedStrings.error.OnlyTokenToggleAnimate));
				TokenAttacher.toggleAnimateStatus(current_layer.controlled);
			});
			
			$(lock_tool).click(()=>{
				if(!base_exists()) return;
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.format(localizedStrings.error.NothingSelected));
				TokenAttacher.setElementsLockStatus(current_layer.controlled, true);
			});
			$(unlock_tool).click(()=>{
				if(!base_exists()) return;
				const current_layer = canvas.activeLayer;
				if(current_layer.controlled.length <= 0) return ui.notifications.error(game.i18n.format(localizedStrings.error.NothingSelected));
				TokenAttacher.setElementsLockStatus(current_layer.controlled, false);
			});
		}

		static async setElementsLockStatus(elements, isLocked, suppressNotification = false){
			let selected = {}
			if(!Array.isArray(elements)) elements=[elements];
			for (const element of elements) {
				const type = element.layer.constructor.documentName;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}
			if(TokenAttacher.isFirstActiveGM()) return await TokenAttacher._setElementsLockStatus(selected, isLocked, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `setElementsLockStatus`, eventdata: [selected, isLocked,  suppressNotification]});

		}

		static async _setElementsLockStatus(elements, isLocked, suppressNotification){
			let updates = {};
			for (const key in elements) {
				if (elements.hasOwnProperty(key)) {
					const layer = canvas.getLayerByEmbeddedName(key);
					for (let i = 0; i < elements[key].length; i++) {
						const element = TokenAttacher.layerGetElement(layer, elements[key][i]);
						if(getProperty(element, `data.flags.${moduleName}.parent`)){
							if(!updates.hasOwnProperty(key)) updates[key] = [];
							if(!isLocked) updates[key].push({_id:element.data._id, [`flags.${moduleName}.unlocked`]:true});
							else updates[key].push({_id:element.data._id, [`flags.${moduleName}.-=unlocked`]:null});
						}
					}
				}
			}
			//Fire Updates
			for (const key in updates) {
				if (updates.hasOwnProperty(key)) {
					if(updates[key].length > 0) await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});	
				}
			}
			if(!suppressNotification) {
				if(!isLocked) ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsUnlocked));
				else ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsLocked));
			}
		}

		static lockAttached(token, button){
			const attached=token.document.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
			const isLocked = token.document.getFlag(moduleName, "locked") || false;
			let icons = button.getElementsByTagName("i");
			
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					let layer = TokenAttacher.getLayerOrCollection(key);
					for (const elementid of attached[key]) {
						let element = TokenAttacher.layerGetElement(layer, elementid);
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
			token.document.setFlag(moduleName, "locked", !isLocked); 
		}

		static highlightAttached(token, button){
			const attached=token.document.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
			let icons = button.getElementsByTagName("i");
			const isHighlighted = icons[0].classList.contains("hidden");

			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					let layer = TokenAttacher.getLayerOrCollection(key);
					for (const elementid of attached[key]) {
						let element = TokenAttacher.layerGetElement(layer, elementid);
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
			const attachment_base = canvas.scene.getFlag(moduleName, "attach_base");			
			const layer = canvas.getLayerByEmbeddedName(attachment_base.type);
			const base = this.layerGetElement(layer, attachment_base.element);
			if(base) TokenAttacher._updateAttachedOffsets(attachment_base);
			window.document.getElementById("tokenAttacher").remove();
			return await canvas.scene.unsetFlag(moduleName, "attach_base");		
		}

		static detachElementFromToken(element, target_token, suppressNotification=false){
			const type = element.layer.constructor.documentName;
			const selected = [element.data._id];
			
			if(TokenAttacher.isFirstActiveGM()) TokenAttacher._DetachFromToken(target_token, {type:type, data:selected}, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `DetachFromToken`, eventdata: [target_token.data._id, {type:type, data:selected}, suppressNotification]});
		}

		static detachElementsFromToken(element_array, target_token, suppressNotification=false){
			let selected = {}
			for (const element of element_array) {
				const type = element.layer.constructor.documentName;
				if(!selected.hasOwnProperty(type)) selected[type] = [];
				selected[type].push(element.data._id);
			}
		
			if(TokenAttacher.isFirstActiveGM()) TokenAttacher._detachElementsFromToken(selected, target_token, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `detachElementsFromToken`, eventdata: [selected, target_token.data._id, suppressNotification]});
		}

		static async _detachElementsFromToken(selected, target_token, suppressNotification=false){
			if(typeof target_token === 'string' || target_token instanceof String) target_token = canvas.tokens.get(target_token);
			for (const key in selected) {
				if (selected.hasOwnProperty(key)) {
					await TokenAttacher._DetachFromToken(target_token, {type:key, data:selected[key]}, suppressNotification);
				}
			}
		}

		static detachAllElementsFromToken(target_token, suppressNotification=false){			
			if(TokenAttacher.isFirstActiveGM()) TokenAttacher._DetachFromToken(target_token, {}, suppressNotification);
			else game.socket.emit(`module.${moduleName}`, {event: `DetachFromToken`, eventdata: [target_token.data._id, {}, suppressNotification]});
		}

		static getAllAttachedElementsOfToken(target_token, suppressNotification=false){
			return target_token.document.getFlag(moduleName, "attached") || {};
		}

		static getAllAttachedElementsByTypeOfToken(target_token, type, suppressNotification=false){
			return target_token.document.getFlag(moduleName, `attached.${type}`) || {};
		}

		/*
			Calculates the offset of and element relative to a position(center) and rotation
			x/y 		= offset of x/y of element to the passed center
			centerX/Y 	= offset of center x/y of element to the passed center
			rot			= initial rotation of the element
			offRot		= offset rotation of element to the passed rotation 
			size		= width/height/distance/dim/bright/radius of element and widthBase/heightBase of parent
		*/
		static getElementOffset(type, data, base_type, base, grid){
			const center = TokenAttacher.getCenter(base_type, base, grid);
			const rotation =  base.rotation ?? base.direction;
			let offset = {x:Number.MAX_SAFE_INTEGER, y:Number.MAX_SAFE_INTEGER, rot:Number.MAX_SAFE_INTEGER};
			offset.x = data.x ?? (data.c[0] < data.c[2] ? data.c[0] : data.c[2]);
			offset.y = data.y ?? (data.c[1] < data.c[3] ? data.c[1] : data.c[3]);
			const offsetCenter = TokenAttacher.getCenter(type, data, grid);;
			[offset.centerX, offset.centerY] = [offsetCenter.x, offsetCenter.y];
			offset.rot = data.rotation ?? data.direction ?? rotation;
			offset.offRot = data.rotation ?? data.direction ?? rotation;
			if(data.hasOwnProperty('c')){
				offset.c = [];
				offset.c[0] = data.c[0] - center.x;
				offset.c[2] = data.c[2] - center.x;
				offset.c[1] = data.c[1] - center.y;
				offset.c[3] = data.c[3] - center.y;
			}
			
			if(data.hasOwnProperty('points')){
				offset.points = [];
				for (let i = 0; i < data.points.length; i++) {
					offset.points[i] = [];
					offset.points[i][0] = data.points[i][0];
					offset.points[i][1] = data.points[i][1];			
				}
			}
			offset.x -= center.x; 
			offset.y -= center.y;
			offset.centerX -= center.x;
			offset.centerY -= center.y;
			offset.offRot -= rotation % 360;
			offset.rot %= 360;
			offset.offRot %= 360;

			offset.size = {};
			if(data.hasOwnProperty('width')){
				offset.size.width  	= data.width;
				offset.size.height	= data.height;
			}
			if(data.hasOwnProperty('distance')){
				offset.size.distance= data.distance;
			}
			if(data.hasOwnProperty('dim')){
				offset.size.dim= data.dim;
				offset.size.bright= data.bright;
			}
			if(data.hasOwnProperty('config') && data.config.hasOwnProperty('dim')){
				offset.size.config = {};
				offset.size.config.dim 		= data.config.dim;
				offset.size.config.bright 	= data.config.bright;
			}
			if(data.hasOwnProperty('radius')){
				offset.size.radius= data.radius;
			}
			let  base_elevation = base.elevation ?? base.flags['levels']?.elevation ?? base.flags['levels']?.rangeBottom ?? base.flags['wallHeight']?.wallHeightBottom ?? 0;
			offset.elevation = {};
			offset.elevation.flags = {};
			if(data.hasOwnProperty('elevation')){
				offset.elevation.elevation= data.elevation;
				if([null, Infinity, -Infinity].includes(offset.elevation.elevation) === false) offset.elevation.elevation -= base_elevation;
			}
			if(data.flags['levels']?.hasOwnProperty('elevation')){
				offset.elevation.flags['levels'] = {
					elevation:data.flags['levels'].elevation
				};
				
				if([null, Infinity, -Infinity].includes(offset.elevation.flags['levels'].elevation) === false) offset.elevation.flags['levels'].elevation -= base_elevation;
			}
			if(data.flags['levels']?.hasOwnProperty('rangeTop')){
				offset.elevation.flags['levels'] = {
					rangeTop:data.flags['levels'].rangeTop, 
					rangeBottom:data.flags['levels'].rangeBottom
				};
				
				if([null, Infinity, -Infinity].includes(offset.elevation.flags['levels'].rangeTop) === false) offset.elevation.flags['levels'].rangeTop -= base_elevation;
				if([null, Infinity, -Infinity].includes(offset.elevation.flags['levels'].rangeBottom) === false) offset.elevation.flags['levels'].rangeBottom -= base_elevation;
			}
			if(data.flags['wallHeight']?.hasOwnProperty('wallHeightTop')){				
				offset.elevation.flags['wallHeight'] = {
					wallHeightTop:data.flags['wallHeight'].wallHeightTop, 
					wallHeightBottom:data.flags['wallHeight'].wallHeightBottom
				};
				
				if([null, Infinity, -Infinity].includes(offset.elevation.flags['wallHeight'].wallHeightTop) === false) offset.elevation.flags['wallHeight'].wallHeightTop -= base_elevation;
				if([null, Infinity, -Infinity].includes(offset.elevation.flags['wallHeight'].wallHeightBottom) === false) offset.elevation.flags['wallHeight'].wallHeightBottom -= base_elevation;
			}

			[offset.size.widthBase, offset.size.heightBase] = TokenAttacher.getSize(base);
			return offset;
		}

		//Modify offset based on grid_multi
		static updateOffsetWithGridMultiplicator(type, offset, grid_multi){
			offset.x *= grid_multi.w;
			offset.y *= grid_multi.h;
			offset.centerX *= grid_multi.w;
			offset.centerY *= grid_multi.h;
			if(offset.hasOwnProperty('c')){
				offset.c[0] *= grid_multi.w;
				offset.c[2] *= grid_multi.w;
				offset.c[1] *= grid_multi.h;
				offset.c[3] *= grid_multi.h;
			}
			if(offset.hasOwnProperty('points')){
				for (let i = 0; i < offset.points.length; i++) {
					offset.points[i][0] *= grid_multi.w;
					offset.points[i][1] *= grid_multi.h;					
				}
			}

			if(type === "Tile" || type === "Drawing"){
				offset.size.width  *= grid_multi.w;
				offset.size.height *= grid_multi.h;
			}
			return offset;
		}

		static getElementSize(element){
			let size = {};
			size.width 	= element.data.width 	?? element.data.distance ?? element.data.config?.dim ?? element.data.dim ?? element.data.radius;
			size.height = element.data.height 	?? element.data.distance ?? element.data.config?.dim ?? element.data.dim ?? element.data.radius;
			return size;
		}

		static getObjectsFromIds(base_type, base_data, type, idArray){
			let layer = TokenAttacher.getLayerOrCollection(type);
			let copyArray = [];
			for (const elementid of idArray) {
				const element = TokenAttacher.layerGetElement(layer, elementid);
				const elem_attached = element.document.getFlag(moduleName, "attached") ?? {};
				let dup_data = duplicate(element.data);
				delete dup_data._id;
				setProperty(dup_data, `flags.${moduleName}.offset`, TokenAttacher.getElementOffset(type, dup_data, base_type, mergeObject(duplicate(base_data), getProperty(base_data, `flags.${moduleName}.pos.xy`)), {}));
				if(Object.keys(elem_attached).length > 0){
					const prototypeAttached = TokenAttacher.generatePrototypeAttached(element.data, elem_attached);
					delete dup_data.flags[moduleName].attached;
					dup_data.flags[moduleName].prototypeAttached = prototypeAttached;
				}
				copyArray.push(dup_data);
			}
			return copyArray;
		}

		static async copyAttached(token){
			let copyObjects = {map: {}};
			const attached=token.document.getFlag(moduleName, "attached") || {};
			if(Object.keys(attached).length == 0) return;
		
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					copyObjects.map[key] = TokenAttacher.getObjectsFromIds("Token", token.data, key, attached[key]);
				}
			}
			copyObjects.grid = {size:canvas.grid.size, w: canvas.grid.w, h:canvas.grid.h};
			await game.user.unsetFlag(moduleName, "copy");			
			await game.user.setFlag(moduleName, "copy", copyObjects);	
			ui.notifications.info(`Copied attached elements.`);	
		}

		static async pasteAttached(token){
			const copyObjects = duplicate(game.user.getFlag(moduleName, "copy")) || {};
			if(Object.keys(copyObjects).length == 0) return;
			await TokenAttacher.saveBasePositon(token.layer.constructor.documentName, token);
			//Set parent in copyObjects
			for (const key in copyObjects.map) {
				if (copyObjects.map.hasOwnProperty(key) && key !== "unknown") {
					for (let i = 0; i < copyObjects.map[key].length; i++) {
						copyObjects.map[key][i].flags[moduleName].parent = token.data._id;
					}
				}				
			}
			let grid_multi = copyObjects.grid;
				grid_multi.size = canvas.grid.size / grid_multi.size;
				grid_multi.w = canvas.grid.w / grid_multi.w;
				grid_multi.h = canvas.grid.h / grid_multi.h ;
			await TokenAttacher.regenerateAttachedFromPrototype(token.layer.constructor.documentName, token, copyObjects.map, grid_multi, {});
		}

		static async pasteObjects(layer, objects, pos, grid_multi, {hidden = false} = {}, return_data=false){
			if ( !objects.length ) return [];
			const cls = layer.constructor.documentName;

			// Iterate over objects
			const toCreate = [];
			for ( let dat of objects) {
				let data = duplicate(dat);
				delete data._id;
				data.flags[moduleName].offset = TokenAttacher.updateOffsetWithGridMultiplicator(cls, data.flags[moduleName].offset, grid_multi);
				const offset = data.flags[moduleName].offset;
				if(data.hasOwnProperty('c')){
					data.c = data.c.map((c, i) => {
						if(!(i%2)) return pos.x + offset.c[i];
						else	return pos.y + offset.c[i];
					});
				}
				else{
					mergeObject(data, {
						x: pos.x + offset.x,
						y: pos.y + offset.y,
						hidden: data.hidden || hidden
					});
				}

				if(data.hasOwnProperty('points')){
					data.points = data.points.map((c, i) => {
						return [offset.points[i][0], offset.points[i][1]];
					});
				}
				
				if(data.hasOwnProperty('width')){
					mergeObject(data, {
						width : offset.size.width,
						height: offset.size.height
					});
				}
				if(data.hasOwnProperty('distance')){
					mergeObject(data, {
						distance : offset.size.distance
					});
				}
				if(data.hasOwnProperty('dim')){
					mergeObject(data, {
						dim : offset.size.dim,
						bright: offset.size.bright
					});
				}
				if(data.hasOwnProperty('config') && data.config.hasOwnProperty('dim')){
					mergeObject(data.config, {
						dim : offset.size.config?.dim ?? offset.size.dim,
						bright: offset.size.config?.bright ?? offset.size.bright
					});
				}
				if(data.hasOwnProperty('radius')){
					mergeObject(data, {
						radius : offset.size.radius
					});
				}

				toCreate.push(data);
			}

			if(return_data) return toCreate;
			// Create all objects
			const created = await canvas.scene.createEmbeddedDocuments(cls, toCreate);
			//ui.notifications.info(`Pasted data for ${toCreate.length} ${cls.name} objects.`);
			return created;
		}

		static async updateAttachedPrototype(document, change, options, userId){
			if(!TokenAttacher.isFirstActiveGM()) return;
			if(change.hasOwnProperty("token")){
				if(change.token.hasOwnProperty("flags")){
					if(change.token.flags.hasOwnProperty(moduleName)){
						const attached = change.token.flags[moduleName].attached || {};
						if(Object.keys(attached).length == 0) return;

						if(TokenAttacher.isAttachmentUIOpen()){			
							console.log("Token Attacher | " + 	game.i18n.format(localizedStrings.error.UIisOpenOnAssign));			
							ui.notifications.error(game.i18n.format(localizedStrings.error.UIisOpenOnAssign));
						}

						let prototypeAttached = TokenAttacher.generatePrototypeAttached(change.token, attached);
						let deletes = {_id:change._id, [`token.flags.${moduleName}.-=attached`]: null, [`token.flags.${moduleName}.-=prototypeAttached`]: null};
						let updates = {_id:change._id, [`token.flags.${moduleName}`]: {prototypeAttached: prototypeAttached, grid:{size:canvas.grid.size, w: canvas.grid.w, h:canvas.grid.h}}};
						await document.update(deletes);
						await document.update(updates);
					}
				}
			}
		}

		static generatePrototypeAttached(token_data, attached){
			let prototypeAttached = {};
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					prototypeAttached[key] = TokenAttacher.getObjectsFromIds("Token", token_data, key, attached[key]);
				}
			}	
			return prototypeAttached;
		}

		static async copyTokens(layer, tokens){
			const copyPrototypeMap = {map: {}};
			const prototypeMap= {};
			tokens.forEach(token => {
				if(token.data.flags.hasOwnProperty(moduleName)
					&& 	token.data.flags[moduleName].hasOwnProperty("attached")){
					prototypeMap[token.id] = TokenAttacher.generatePrototypeAttached(token.data, token.data.flags[moduleName].attached);
				}
			});
			copyPrototypeMap.map[layer.constructor.documentName] = prototypeMap;
			copyPrototypeMap.grid = {size:canvas.grid.size, w: canvas.grid.w, h:canvas.grid.h};
			await game.user.unsetFlag(moduleName, "copyPrototypeMap");
			await game.user.setFlag(moduleName, "copyPrototypeMap", copyPrototypeMap);
		}

		static pasteTokens(copy, toCreate){
			const copyPrototypeMap = game.user.getFlag(moduleName, "copyPrototypeMap") || {};
			for (let i = 0; i < toCreate.length; i++) {
				if(toCreate[i].flags.hasOwnProperty(moduleName)
					&& 	toCreate[i].flags[moduleName].hasOwnProperty("attached")){
					delete toCreate[i].flags[moduleName].attached;
					const clsname = copy[i].layer.constructor.documentName;
					if(copyPrototypeMap.map.hasOwnProperty(clsname)){
						toCreate[i].flags[moduleName].prototypeAttached = copyPrototypeMap.map[clsname][copy[i].data._id];	
						toCreate[i].flags[moduleName].grid = copyPrototypeMap.grid;	
					}			
				}
			}
		}

		static async deleteToken(document, options, userId){
			if(!TokenAttacher.isFirstActiveGM()) return;
			const attached=getProperty(document, `data.flags.${moduleName}.attached`) || {};
			if(Object.keys(attached).length == 0) return true;

			if(getProperty(options, `${moduleName}.update`)) return true;
			TokenAttacher.detectGM();
			//Combine with eventual bases
			let deletes = TokenAttacher.getChildrenIds(attached, {});

			//Fire deletes
			for (const key in deletes) {
				if (deletes.hasOwnProperty(key)) {
					let layer = TokenAttacher.getLayerOrCollection(key);
					await canvas.scene.deleteEmbeddedDocuments(layer.constructor.documentName, deletes[key], {[moduleName]:{update:true}});
				}
			}
		}

		static getChildrenIds(attached, all_ids){
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					let layer = TokenAttacher.getLayerOrCollection(key);

					if(!all_ids.hasOwnProperty(key)) all_ids[key] = [];

					for (let i = 0; i < attached[key].length; i++) {
						const id = attached[key][i];		

						let element = TokenAttacher.layerGetElement(layer, id);
						if(!element) continue;		

						all_ids[key].push(id);
						const child_attached=getProperty(element.document, `data.flags.${moduleName}.attached`) || {};

						if(Object.keys(child_attached).length > 0) {
							const child_ids = TokenAttacher.getChildrenIds(child_attached, all_ids);
							
							for (const key in child_ids) {
								if(!all_ids.hasOwnProperty(key)) all_ids[key] = [];
								all_ids[key].concat(child_ids[key]);
							}
						}
						
					}
				}
			}
			return all_ids;
		}

		static preCreateBase(document, data, options, userId){
			if(getProperty(data,`flags.${moduleName}.prototypeAttached`)){
				setProperty(data, `flags.${moduleName}.needsPostProcessing`, true);
			}
		}

		static async updateAttachedCreatedToken(type, document, options, userId){
			if(!TokenAttacher.isFirstActiveGM()) return;
			const token = canvas.tokens.get(document.data._id);
			if(!token) return;
			//Checks for multilevel tokens and v&m
			if(getProperty(game, 'multilevel')) {
				if(game.multilevel._isReplicatedToken(token)) token.document.unsetFlag(moduleName, 'attached');
			}
			if(getProperty(options, "isUndo") === true && getProperty(options, "mlt_bypass") === true) return;

			if(getProperty(options, `${moduleName}.update`)) return;
			
			const prototypeAttached = token.document.getFlag(moduleName, "prototypeAttached") || {};
			const attached = token.document.getFlag(moduleName, "attached") || {};
			
			if(getProperty(options, "isUndo") === true){
				if(Object.keys(attached).length > 0){
					await TokenAttacher.regenerateAttachedFromHistory(token, attached);
				}
				return;
			}

			if(Object.keys(prototypeAttached).length > 0){
				if(TokenAttacher.isPrototypeAttachedModel(prototypeAttached, 2)) return ui.notifications.error(game.i18n.format(localizedStrings.error.ActorDataModelNeedsMigration));
				
				let grid_multi = token.document.getFlag(moduleName, "grid") || {size: canvas.grid.size, w:canvas.grid.w, h:canvas.grid.h};
				grid_multi.size = canvas.grid.size / grid_multi.size;
				grid_multi.w = canvas.grid.w / grid_multi.w;
				grid_multi.h = canvas.grid.h / grid_multi.h ;
				await TokenAttacher.regenerateAttachedFromPrototype(type, token, prototypeAttached, grid_multi, options);
				
			}
			return;
		}

		static async regenerateAttachedFromPrototype(type, token, prototypeAttached, grid_multi, options={},  return_data = false){
			grid_multi = mergeObject({size:1, w: 1, h:1}, grid_multi);
			let pasted = {};
			let toCreate = {};
			for (const key in prototypeAttached) {
				if (prototypeAttached.hasOwnProperty(key) && key !== "unknown") {
					let layer = TokenAttacher.getLayerOrCollection(key);

					let pos = TokenAttacher.getCenter(type, token.data);
					if(!toCreate.hasOwnProperty(key)) toCreate[key] = [];
					toCreate[key] = await TokenAttacher.pasteObjects(layer, prototypeAttached[key], pos, grid_multi, {}, true);
					if(!toCreate[key]) delete toCreate[key];					
				}
			}

			
			for (const key in prototypeAttached) {
				for (let i = 0; i < prototypeAttached[key].length; i++) {
					const element = prototypeAttached[key][i];
					const element_protoAttached = getProperty(element, `flags.${moduleName}.prototypeAttached`);
					if(element_protoAttached){
						const toCreateElement = toCreate[key].find(item => getProperty(item , `flags.${moduleName}.pos.base_id`) === getProperty(element , `flags.${moduleName}.pos.base_id`));
						let subCreated = await TokenAttacher.regenerateAttachedFromPrototype(key, {data:toCreateElement}, element_protoAttached, grid_multi, options, true);
						for (const subKey in subCreated) {
							if (subCreated.hasOwnProperty(subKey)) {
								const element = subCreated[subKey];
								if(!toCreate.hasOwnProperty(subKey)) toCreate[subKey] = [];
								toCreate[subKey] = toCreate[subKey].concat(subCreated[subKey]);
							}
						}
					}
				}
			}
			if(return_data) return toCreate;
			
			setProperty(options,`${moduleName}.base`, {type: token.layer.constructor.documentName, data:token.data})
			setProperty(options,`${moduleName}.update`, true)
			const allowed = Hooks.call("preCreatePlaceableObjects", canvas.scene, toCreate, options, game.userId);
			if (allowed === false) {
			  console.debug(`${moduleName} | creation of PlacableObjects prevented by preCreatePlaceableObjects hook`);
			  return;
			}

			for (const key in toCreate) {
				if (toCreate.hasOwnProperty(key)) {
					if(key === "Tile") {
						toCreate[key] = TokenAttacher.zSort(true, key, toCreate[key]);
						let promises = [];
						for (let i = 0; i < toCreate[key].length; i++) {
							const element = toCreate[key][i];
							promises.push(loadTexture(element.img, {fallback: 'icons/svg/hazard.svg'}));
						}
						await Promise.all(promises);
					}
					if(key === "Drawing") {
						let promises = [];
						for (let i = 0; i < toCreate[key].length; i++) {
							const element = toCreate[key][i];
							if(element.texture !== "" && element.texture !== null) promises.push(loadTexture(element.texture, {fallback: 'icons/svg/hazard.svg'}));
						}
						await Promise.all(promises);
					}
					const created = await canvas.scene.createEmbeddedDocuments(key, toCreate[key], options);
					if(!pasted.hasOwnProperty(key)) pasted[key] = [];
					if(Array.isArray(created)) pasted[key] = pasted[key].concat(created);
					else pasted[key].push(created);
				}
			}

			Hooks.callAll("createPlaceableObjects", canvas.scene, pasted, options, game.userId);
			game.socket.emit(`module.${moduleName}`, {event: `createPlaceableObjects`, eventdata: [canvas.scene.data, pasted, options, game.userId]});
			ui.notifications.info(game.i18n.format(localizedStrings.info.PastedAndAttached));
			return;
		}

		/*	RegenerateLinks on pasted objects
			example: pasted = {'Token': [someobject....]}
		*/
		static async regenerateLinks(pasted, options={}, userId=""){
			let updates = {};
			let afterUpdates = {};
			const pushUpdate = (key, update, updateObj) => {
				if(!updateObj.hasOwnProperty(key)) updateObj[key] = [];
				const dupIndex = updateObj[key].findIndex(item => update._id === item._id);
				if(dupIndex === -1) updateObj[key].push(update);
				else updateObj[key][dupIndex] = mergeObject(updateObj[key][dupIndex], update);
			};
			for (const key in pasted) {
				if (pasted.hasOwnProperty(key)) {
					const arr = pasted[key];
					for (let i = 0; i < arr.length; i++) {
						const base = arr[i];
						const old_base_id = getProperty(base , `flags.${moduleName}.pos.base_id`);
						if(old_base_id) {
							let current_attached = duplicate(getProperty(base , `flags.${moduleName}.attached`) ?? {});
							let new_attached = {}; 
							for (const attKey in pasted) {
								const layer = canvas.getLayerByEmbeddedName(attKey);
								if (pasted.hasOwnProperty(attKey)) {
									new_attached[attKey] = pasted[attKey].filter(item => getProperty(item , `flags.${moduleName}.parent`) === old_base_id);
									for (let j = 0; j < new_attached[attKey].length; j++) {
										const attached_element = new_attached[attKey][j];	
										let update =  {_id: attached_element._id};	
										update[`flags.${moduleName}.parent`] = base._id;
										pushUpdate(attKey, update, updates);
									}
									new_attached[attKey] = new_attached[attKey].map(item => item._id);
									if(current_attached && current_attached.hasOwnProperty(attKey)){
										current_attached[attKey] = current_attached[attKey].filter(item => getProperty(TokenAttacher.layerGetElement(layer, item) , `document.dataflags.${moduleName}.parent`) === base._id);
										new_attached[attKey] = [...new Set(new_attached[attKey].concat(current_attached[attKey]))];
									}
									if(new_attached[attKey].length <= 0) delete new_attached[attKey];
								}
							}
							let update = {
								_id: base._id, 
								hidden: getProperty(base, `flags.${moduleName}.pos.hidden`) ?? base.hidden, 
								[`flags.${moduleName}.attached`]:new_attached, 
								[`flags.${moduleName}.pos.base_id`]:base._id,
								[`flags.${moduleName}.-=prototypeAttached`]: null,
								[`flags.${moduleName}.-=grid`]: null
							};
							let afterUpdate = {
								_id: base._id, 
								[`flags.${moduleName}.-=needsPostProcessing`]: null
							};
							pushUpdate(key, update, updates);
							pushUpdate(key, afterUpdate, afterUpdates);
						}				
					}
				}
			}

			//Instant attach?			
			if(getProperty(options, `${moduleName}.InstantAttach.userId`) === userId){
				
				if(getProperty(options, `${moduleName}.base`)){				
					const attach_base = canvas.scene.getFlag(moduleName, "attach_base");
					const layer = canvas.getLayerByEmbeddedName(attach_base.type);
					const element = TokenAttacher.layerGetElement(layer, attach_base.element);

					const child = getProperty(options, `${moduleName}.base`);

					let subUpdates = await TokenAttacher._AttachToToken(element,{type:child.type, data:[child.data._id]},true , true);
					for (const key in subUpdates) {
						if (subUpdates.hasOwnProperty(key)) {
							const updateArray = subUpdates[key];
							for (let i = 0; i < updateArray.length; i++) {
								const upd = updateArray[i];
								pushUpdate(key, upd, updates);								
							}
						}
					}
				}
			}

			//Fire updates
			for (const key in updates){
				if (updates.hasOwnProperty(key)) {
					await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});
				}
			}
			//Fire After updates
			for (const key in afterUpdates){
				if (afterUpdates.hasOwnProperty(key)) {
					await canvas.scene.updateEmbeddedDocuments(key, afterUpdates[key], {[moduleName]:{update:true}});
				}
			}
		}

		static async deleteMissingLinks(){		
			const base_layer = 	canvas.getLayerByEmbeddedName("Token");
			let deletes = {};
			const pushUpdate = (key, update, updateObj) => {
				if(!updateObj.hasOwnProperty(key)) updateObj[key] = [];
				const dupIndex = updateObj[key].findIndex(item => update=== item);
				if(dupIndex === -1) updateObj[key].push(update);
			};
			for (const type of ["AmbientLight", "AmbientSound", "Drawing", "MeasuredTemplate", "Note", "Tile", "Token", "Wall"]) {
				const layer = canvas.getLayerByEmbeddedName(type);
				const deleteLinks = (layer) => {
						for (let i = 0; i < layer.placeables.length; i++) {
							const element = layer.placeables[i];
							if(getProperty(element, `data.flags.${moduleName}.needsPostProcessing`)) pushUpdate(type, element.data._id, deletes);
							else if(getProperty(element, `data.flags.${moduleName}.parent`)){
								const base = base_layer.get(getProperty(element, `data.flags.${moduleName}.parent`));
								if(!base) pushUpdate(type, element.data._id, deletes);
							}
						}
					}
				deleteLinks(layer);
				if(type === "Tile"){
					deleteLinks(canvas.foreground);
				}
			}
			//Fire deletes
			for (const key in deletes){
				if (deletes.hasOwnProperty(key)) {
					await canvas.scene.deleteEmbeddedDocuments(key, deletes[key], {[moduleName]:{update:true}});
				}
			}
		}
		
		static async batchPostProcess(parent, createdObjs, options, userId){			
			if(!TokenAttacher.isFirstActiveGM()) return;
			let myCreatedObjs = createdObjs;
			if(getProperty(options, `${moduleName}.base`)){
				const base = getProperty(options, `${moduleName}.base`);
				myCreatedObjs = duplicate(createdObjs);
				if(!getProperty(myCreatedObjs, base.type)) myCreatedObjs[base.type] = [base.data];
				else{
					if(!myCreatedObjs[base.type].find(item => item._id === base.data._id)){
						myCreatedObjs[base.type].push(base.data);
					}
				}
			}
			await TokenAttacher.regenerateLinks(myCreatedObjs, options, userId);	
			ui.notifications.info(game.i18n.format(localizedStrings.info.PostProcessingFinished));
		}

		static async regenerateAttachedFromHistory(token, attached){
			TokenAttacher.detectGM();
			const newattached= {};
			for (const key in attached) {
				if (attached.hasOwnProperty(key) && attached[key].length > 0) {
					let layer = TokenAttacher.getLayerOrCollection(key);
					
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
			
			await token.document.unsetFlag(moduleName, `attached`);
			await token.document.setFlag(moduleName, `attached`, newattached);
		}

		static mapActorForExport(actor){
			return {img:actor.data.img, name:actor.data.name, folder:actor.data.folder || null, token: actor.data.token, flags: actor.data.flags};
		}

		static async getActorsWithPrototype(){
			const folders = {};
			const allActors = [...game.actors].filter(actor =>{
				const attached = getProperty(actor, `data.token.flags.${moduleName}.prototypeAttached`) || {};
				if(Object.keys(attached).length > 0) return true;
				return false;
			});
			const allMappedActors = allActors.map(TokenAttacher.mapActorForExport);

			let addParentFolder = (folders, folder) =>{
				const parent = game.folders.get(folder.data.parent) || null;
				if(parent){
					folders[parent.data._id] = parent;
					addParentFolder(folders, parent);
				}
			};

			allMappedActors.forEach(actor => {
				const folder = game.folders.get(actor.folder) || null;
				if(folder){
					folders[folder.data._id] = folder;
					addParentFolder(folders, folder);
				}
			});
			const html = await renderTemplate(`${templatePath}/ImExportUI.html`, {label_content:"Copy the JSON below:", content:JSON.stringify({folder: folders, actors: allMappedActors, ['data-model']: game.settings.get(moduleName, "data-model-version")})});
			Dialog.prompt({title:"Export Actors to JSON", callback: html => {}, content: html});
		}

		static async getActorsWithPrototypeInCompendiums(){
			const folders = {};
			const allCompendiums = [...game.packs].filter(pack =>{
				if(pack.metadata.entity !== "Actor") return false;
				return true;
			});
			
			for (let i = 0; i < allCompendiums.length; i++) {
				const pack = allCompendiums[i];
				const packIndex = await pack.getIndex();
				for (const index of packIndex) {
					const entity = await pack.getDocument(index._id);
				}
			}
		}

		static async exportCompendiumToJSON(pack){
			const packIndex = await pack.getIndex();
			let actors = [];
			for (const index of packIndex) {
				const entity = await pack.getDocument(index._id);
				actors.push(TokenAttacher.mapActorForExport(entity));
			}
			const html = await renderTemplate(`${templatePath}/ImExportUI.html`, {label_content:"Copy the JSON below:", content:JSON.stringify({compendium: {name:pack.metadata.name, label:pack.metadata.label}, actors: actors, ['data-model']: game.settings.get(moduleName, "data-model-version")})});
			Dialog.prompt({title:"Export Actors to JSON", callback: html => {}, content: html});
		}

		static async importFromJSONDialog(){
			const html = await renderTemplate(`${templatePath}/ImExportUI.html`, {label_content:"Paste JSON below:", content:""});
			Dialog.prompt({title:"Import Actors from JSON", 
			content: html,
			callback: html => {
				const form = html.find("#ta-import-export-dialog");
				const fd = new FormDataExtended(form[0]);
				const data = fd.toObject();
				if ( !data.JSONContent ) {
				  const err = new Error(game.i18n.format(localizedStrings.error.NoValidJSONProvided));
				  return ui.notifications.warn(err.message);
				}
				TokenAttacher.importFromJSON(data.JSONContent);
			}
			});
		}
		static async importFromJSON(json, options={}){
			const imported = JSON.parse(json);
			if(imported.folder)	await TokenAttacher.importFromJSONWithFolders(imported, options);
			if(imported.compendium)	await TokenAttacher.importFromJSONWithCompendium(imported, options);
		}
		static async importFromJSONWithFolders(imported, options={}){
			const folders = imported.folder;
			const actors = imported.actors;
			 
			const parentMap = {null:{value:null}};
			let allPromises = [];
			for (const key in folders) {
				if (folders.hasOwnProperty(key)) {
					const folder = folders[key];
					allPromises.push((async (folder)=>{
						if(!parentMap.hasOwnProperty(folder.parent)) {
							let resolver;
							parentMap[folder.parent] = {value:new Promise((resolve)=>{resolver = resolve}), signal: resolver};
						}
						const parent = await parentMap[folder.parent].value;
						const newFolder = await Folder.create({name: folder.name, type: "Actor", parent: parent});
						if(!parentMap.hasOwnProperty(folder._id)) {
							parentMap[folder._id] = {value:new Promise((resolve) => (resolve(newFolder._id)))};
						}
						else {
							parentMap[folder._id].signal(newFolder._id);
						}
					})(folder));
				}
			}
			await Promise.all(allPromises);
			actors.forEach(async actor => {
				await Actor.create({type: game.system.documentTypes.Actor[0], img:actor.img, name:actor.name, folder:await parentMap[actor.folder].value, token: actor.token, flags: actor.flags});
			});
		}

		static async importFromJSONWithCompendium(imported, options={}){
			const compendium = imported.compendium;
			const actors = imported.actors;
			let name = compendium.name;
			let label = compendium.label;
			if(options.hasOwnProperty("module")) name = options.module + "." + name;
			if(options.hasOwnProperty("module-label")) label = "("+options["module-label"] + ")" + label;
			 
			const parentMap = {null:{value:null}};
			let worldCompendium = await CompendiumCollection.createCompendium({label:label, name: name.slugify({strict: true}), type:"Actor"});
			let creates = [];
			actors.forEach(async actor => {
				creates.push({type: game.system.documentTypes.Actor[0], img:actor.img, name:actor.name, token: actor.token, flags: actor.flags});
			});
			// if(!imported.hasOwnProperty('data-model') || imported['data-model'] !== game.settings.get(moduleName, "data-model-version")){
			// 		//Maybe add some compendium migration code if necessary	
			// }
			return await worldCompendium.documentClass.create(creates, {pack:worldCompendium.collection});
		}
		
		//Attached elements are only allowed to be moved by token attacher functions.
		static isAllowedToMove(document, change, options, userId){
			if(	(		change.hasOwnProperty("x")
					||	change.hasOwnProperty("y")
					||	change.hasOwnProperty("c")
					||	change.hasOwnProperty("rotation")
					||	Object.keys(change).length == 0)
				&&	getProperty(document, `data.flags.${moduleName}.needsPostProcessing`) 
				&& !getProperty(options, `${moduleName}`)) {				
				ui.notifications.error(game.i18n.format(localizedStrings.error.PostProcessingNotFinished));
				return false;
			}

			if(!(	change.hasOwnProperty("x")
				||	change.hasOwnProperty("y")
				||	change.hasOwnProperty("c")
				||	change.hasOwnProperty("rotation"))){
				return true;
			}

			let animate = getProperty(document, `data.flags.${moduleName}.animate`) ?? true;
			if(!animate) setProperty(options, `animate`, animate);

			let offset = getProperty(document, `data.flags.${moduleName}.offset`) || {};
			if(Object.keys(offset).length === 0) return true;
			if(getProperty(options, `${moduleName}.update`)) return true;
			let objParent = getProperty(document, `data.flags.${moduleName}.parent`) || "";
			if(TokenAttacher.isAttachmentUIOpen() && TokenAttacher.isCurrentAttachUITarget(objParent)) return true;
			if(game.user.isGM){
				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvas.scene.data._id === quickEdit.scene) {
					setProperty(options, `${moduleName}.QuickEdit`, true);
					return true;
				}
			}
			return false;
		}

		static handleBaseMoved(document, change, options, userId){
			if(!(	change.hasOwnProperty("x")
				||	change.hasOwnProperty("y")
				||	change.hasOwnProperty("c")
				||	change.hasOwnProperty("rotation"))){
				return true;
			}
			let attached = getProperty(document, `data.flags.${moduleName}.attached`);
			if(!attached) return true;			
			
			const mlt_block_movement = game.settings.get(moduleName, 'MLTBlockMovement') || false;
			if(mlt_block_movement){
				if(TokenAttacher.hasVehiclesDrawing(attached)){
					if(getProperty(options, "isUndo") === true)
						if(getProperty(options, "mlt_bypass") === true) return false;
				}
			}

			let animate = getProperty(document, `data.flags.${moduleName}.animate`) ?? true;
			if(!animate) setProperty(options, `animate`, animate);

			if(game.user.isGM){
				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvas.scene.data._id === quickEdit.scene) {
					setProperty(options, `${moduleName}.QuickEdit`, true);
				}
			}
			return true;
		}

		static hasVehiclesDrawing(attached){
			let result = false;
			for (const key in attached) {
				if (attached.hasOwnProperty(key)) {
					let layer = TokenAttacher.getLayerOrCollection(key);

					for (let i = 0; i < attached[key].length; i++) {
						const id = attached[key][i];		

						let element = TokenAttacher.layerGetElement(layer, id);
						if(!element) continue;		

						const child_attached=getProperty(element.document, `data.flags.${moduleName}.attached`) || {};

						if(Object.keys(child_attached).length > 0) {
							result = result || TokenAttacher.hasVehiclesDrawing(child_attached);
						}		

						if(key === 'Drawing'){
							result = result || (getProperty(element.document, `data.flags.vehicles.captureTokens`) > 0);
						}				
					}
				}
			}
			return result;
			
		}
		//Attached elements are only allowed to be selected while token attacher ui is open.
		static isAllowedToControl(object, isControlled){
			let offset = object.document.getFlag(moduleName, 'offset') || {};
			if(Object.keys(offset).length === 0) return;
			let objParent = object.document.getFlag(moduleName, 'parent') || {};
			if(TokenAttacher.isAttachmentUIOpen() && TokenAttacher.isCurrentAttachUITarget(objParent)) return;
			let unlocked = object.document.getFlag(moduleName, 'unlocked');
			if(unlocked) return;
			
			if(game.user.isGM){
				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvas.scene.data._id === quickEdit.scene) return;
			}
			return object.release();
		}

		static isCurrentAttachUITarget(id){
			return canvas.tokens.get(canvas.scene.getFlag(moduleName, "attach_base").element).data._id === id;
		}

		//Detach Elements when they get deleted
		static DetachAfterDelete(type, document, options, userId){
			if(!TokenAttacher.isFirstActiveGM()) return; 
			if(getProperty(options, `${moduleName}.update`)) return;
			
			let objParent = getProperty(document, `data.flags.${moduleName}.parent`) || "";
			if(objParent !== ""){
				if(TokenAttacher.isFirstActiveGM()) TokenAttacher._DetachFromToken(objParent, {type:type, data:[document.data._id]}, true, {skip_update:true});
				else game.socket.emit(`module.${moduleName}`, {event: `DetachFromToken`, eventdata: [objParent, {type:type, data:[document.data._id]}, true, {skip_update:true}]});
			}
		}

		//Reattach elements that are recreated via Undo
		static ReattachAfterUndo(type, document, options, userId){
			if(TokenAttacher.isFirstActiveGM()) return;
			let objParent = getProperty(document, `data.flags.${moduleName}.parent`) || "";
			if(!objParent) return;
			if(getProperty(options, "isUndo") === true){
				if(getProperty(options, "mlt_bypass") === true) return;

				if(TokenAttacher.isFirstActiveGM()) TokenAttacher._ReattachAfterUndo(type, document, options, userId);
				else game.socket.emit(`module.${moduleName}`, {event: `ReattachAfterUndo`, eventdata: [type, document, options, userId]});
			}
			return;
		}

		//Reattach elements that are recreated via Undo or remove the attachment completly if the base doesn't exist anymore
		static async _ReattachAfterUndo(type, parent, entity, options, userId){
			let objParent = getProperty(entity, `data.flags.${moduleName}.parent`) || "";
			const parent_token = canvas.tokens.get(objParent);
			if(parent_token){
				TokenAttacher._AttachToToken(parent_token, {type:type, data:[entity._id]}, true);
			}
			else{
				let layer = TokenAttacher.getLayerOrCollection(type);
				const element = TokenAttacher.layerGetElement(layer, entity._id);
				
				const deletes ={[`flags.${moduleName}.-=parent`]: null, [`flags.${moduleName}.-=offset`]: null, [`flags.${moduleName}.-=unlocked`]: null};
				await element.update(deletes);
			}
		}

		//Rectangle Selection hook to select and attach every element on every layer inside the rectangle 
		static async _RectangleSelection(event){
			const tool = game.activeTool;
			if(tool !== "select") return;
			if($(window.document.getElementById("tokenAttacher")).find(".control-tool.select.active").length <= 0 ) return;
			$(window.document.getElementById("tokenAttacher")).find(".control-tool.select")[0].classList.toggle("active");	
			
			const {coords, originalEvent} = event.data;
			const {x, y, width, height, releaseOptions={}, controlOptions={}}=coords;
			let selected = {};	
			const baseId= canvas.scene.getFlag(moduleName, "attach_base").element;		
			const token = canvas.tokens.get(baseId);
			for (const type of ["AmbientLight", "AmbientSound", "Drawing", "MeasuredTemplate", "Note", "Tile", "Token", "Wall"]) {
				const layer = canvas.getLayerByEmbeddedName(type);
				const selectAll = (layer) => {
					//if (layer.options.controllableObjects) {
						// Identify controllable objects
						const controllable = layer.placeables.filter(obj => obj.visible && (obj.control instanceof Function));
						const newSet = controllable.filter(obj => {
							let c = obj.center;
							//filter base out
							if(obj.data._id === baseId) return;
							//Filter attached elements except when they are already attached to the base
							const parent = obj.document.getFlag(moduleName, 'parent') || "";
							if(parent !== "" && parent !== baseId) return;
							//filter all inside selection
							return Number.between(c.x, x, x+width) && Number.between(c.y, y, y+height);
						});	
						if(!Array.isArray(selected[type])) selected[type] = [];	
						selected[type] = selected[type].concat(newSet.map(a => a.data._id).filter(a => !selected[type].includes(a)));
						if(selected[type].length <= 0) delete selected[type];		
					//}
					}
				selectAll(layer);
				if(type === "Tile"){
					selectAll(canvas.foreground);
				}
			}
			if(selected.length === 0) return;
			TokenAttacher._attachElementsToToken(selected, token, false);
			ui.notifications.info(game.i18n.format(localizedStrings.info.ObjectsAttached));
		}

		static areDuplicatesInAttachChain(base, attached){
			//Check if base tried to attach itself
			const type = base.layer.constructor.documentName;
			const att = getProperty(attached, type) || [];
			if(att.indexOf(base.data._id) !== -1) return base;

			let bases = {};
			let duplicate = null;
			//Add base to bases object and return true when no duplicate was found
			const add_base = (element) => {
				const type = element.layer.constructor.documentName;
				if(!bases.hasOwnProperty(type)) bases[type] = {};
				if(!bases[type].hasOwnProperty(element.data._id)){
					bases[type][element.data._id] = 1;
					return true;
				}
				return false;
			}

			add_base(base);

			for (const key in attached) {
				if (attached.hasOwnProperty(key) && key !== "unknown") {
					let layer = TokenAttacher.getLayerOrCollection(key);
					for (const elementid of attached[key]) {
						let element = TokenAttacher.layerGetElement(layer, elementid);
						if(element){
							const elementAttached = element.document.getFlag(moduleName, "attached") || {};
							if(Object.keys(elementAttached).length > 0){
								if(!add_base(element)){
									return element;
								}
							}
						}
					}
				}
			}
			return false;
		}

		static getCenter(type, data, grid = {}){
			grid = mergeObject({w: canvas.grid.w, h:canvas.grid.h}, grid);
			const [x,y] = [data.x, data.y];
			let center = {x:x, y:y};
			//Tokens, Tiles
			if ( "width" in data && "height" in data ) {
				let [width, height] = [data.width, data.height];
				if(TokenAttacher.isGridSpace(type)) [width, height] = [width * grid.w, height * grid.h]
				center={x:x + (Math.abs(width) / 2), y:y + (Math.abs(height) / 2)};
			}
			//Walls
			if("c" in data){
				center = {x:(data.c[0] + data.c[2]) / 2, y: (data.c[1] + data.c[3]) / 2}
			}
			return center;
			
		}

		static getSize(data){
			return [data.width ?? data.radius  ?? data.distance 
				?? (data.config?.dim > data.config?.bright ? data.config?.dim: data.config?.bright) 
				?? (data.dim > data.bright ? data.dim: data.bright),
			data.height ?? data.radius ?? data.distance 
			?? (data.config?.dim > data.config?.bright ? data.config?.dim: data.config?.bright) 
			?? (data.dim > data.bright ? data.dim: data.bright)];

		}
		//Update z in elements_data and return elements_data
		static zSort(up, type, elements_data) {	
			const layer = canvas.getLayerByEmbeddedName(type);
			const overhead_layer = canvas.foreground;
			const siblings = layer.placeables;	
			const overhead_siblings = overhead_layer.placeables;	
			// Determine target sort index
			let z_background = 0;
			let z_foreround = 0;
			if ( up ) {
				elements_data.sort((a, b) => a.z - b.z);
			  	z_background = siblings.length ? Math.max(...siblings.map(o => o.data.z)) + 1 : 1;
			  	z_foreround = overhead_siblings.length ? Math.max(...overhead_siblings.map(o => o.data.z)) + 1 : 1;
			}
			else {
				elements_data.sort((a, b) => b.z - a.z);
			  	z_background = siblings.length ? Math.min(...siblings.map(o => o.data.z)) - 1 : -1;
			  	z_foreround = overhead_siblings.length ? Math.max(...overhead_siblings.map(o => o.data.z)) + 1 : 1;
			}
		
			// Update all controlled objects
			for (let i = 0, j =0, k = 0; i < elements_data.length; i++) {
				let d;
				if(elements_data[i]?.overhead === "true"){
					d = up ? k++ : k++ * -1;
				}
				else{					
					d = up ? j++ : j++ * -1;
				}
				elements_data[i].z = z_background + d;				
			}
			return elements_data;
		}

		static isGridSpace(type){
			if(type === "Tile") return false;
			if(type === "Drawing") return false;
			return true;
		}
		static toggleQuickEditMode(){
			if(!game.user.isGM) return;

			let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
			TokenAttacher.setQuickEditMode(quickEdit? false: true);
		}

		static async setQuickEditMode(value){
			if(!game.user.isGM) return;
			
			if(value) {
				window.tokenAttacher.quickEdit = {
					scene: canvas.scene.data._id,
					timer: null,
					elements: {},
					bases: {}
				}
				if(window.document.getElementById("tokenAttacherQuickEdit")) return;
				// Get the handlebars output
				const myHtml = await renderTemplate(`${templatePath}/QuickEdit.html`, {});

				window.document.getElementById("pause").insertAdjacentHTML('afterend', myHtml);

			}
			else {
				if(getProperty(window, 'tokenAttacher.quickEdit')) {
					//Update Offsets
					clearTimeout(window.tokenAttacher.quickEdit.timer);
					window.tokenAttacher.quickEdit.timer = null;
					const quickEdit = duplicate(window.tokenAttacher.quickEdit);
					delete quickEdit[game.user.data._id];
					delete window.tokenAttacher.quickEdit;
					await TokenAttacher.saveAllQuickEditOffsets(quickEdit);
					
					window.document.getElementById("tokenAttacherQuickEdit").remove();
				}
			}	
		}

		static async saveAllQuickEditOffsets(quickEdit){
			if(!quickEdit) {
				quickEdit = duplicate(window.tokenAttacher.quickEdit);
				window.tokenAttacher.quickEdit.elements = {};
				window.tokenAttacher.quickEdit.bases = {};
				window.tokenAttacher.quickEdit.timer = null;
			}
			if(canvas.scene.data._id !== quickEdit.scene) return;

			let updates = {};
			for (const key in quickEdit.elements) {
				const layer = canvas.getLayerByEmbeddedName(key);
				updates[key] = quickEdit.elements[key].map(elem =>{
					let element = TokenAttacher.layerGetElement(layer, elem._id);
					//unset offset locally because I've set it locally so the user see's the effects immediatly
					setProperty(element.data, `flags.${moduleName}.offset`, {});
					return {_id:elem._id, [`flags.${moduleName}.offset`]: elem.offset};
				});
			}
			//Fire all updates by type
			for (const key in updates) { 
				await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});
			}
		}

		static updateOffset(type, document, change, options, userId){
			//Only attached need to do anything
			let offset = getProperty(document, `data.flags.${moduleName}.offset`);
			if(!offset) return;
			if(!getProperty(options, `${moduleName}.QuickEdit`)) return;

			if(game.user.data._id === userId && game.user.isGM){
				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvas.scene.data._id === quickEdit.scene){					
					if(!getProperty(options, `${moduleName}.QuickEdit`)) return;
					clearTimeout(quickEdit.timer);
					const parent_type = "Token";
					const parent_layer = canvas.getLayerByEmbeddedName(parent_type);
					const parent_id = getProperty(document, `data.flags.${moduleName}.parent`);
					let parent = TokenAttacher.layerGetElement(parent_layer, parent_id);
					TokenAttacher.updateOffsetOfElement(quickEdit, parent_type, parent.data, type, document.data._id);
					quickEdit.timer = setTimeout(TokenAttacher.saveAllQuickEditOffsets, 1000);
				}
			}
		}

		static updateOffsetOfElement(quickEdit, base_type, base_data, type, element_id){
			const layer = canvas.getLayerByEmbeddedName(type);
			let element = TokenAttacher.layerGetElement(layer, element_id);
			const new_offset = TokenAttacher.getElementOffset(type, element.data, base_type, base_data, {});
			//set offset locally only so the user see's the effects immediatly
			setProperty(element.data, `flags.${moduleName}.offset`, new_offset);
			if(!getProperty(quickEdit, `elements.${type}`)) quickEdit.elements[type] = [];
			const elemIndex = quickEdit.elements[type].findIndex(item => item._id === element_id);
			if(elemIndex === -1) quickEdit.elements[type].push({_id:element_id, offset:new_offset});
			else quickEdit.elements[type][elemIndex].offset = new_offset;
		}

		
		static _quickEditUpdateOffsetsOfBase(quickEdit, type, base_data){
			let attached = getProperty(base_data, `flags.${moduleName}.attached`);
			for (const key in attached) { 
				const layer = canvas.getLayerByEmbeddedName(key);
				for (let i = 0; i < attached[key].length; i++) {
					const element_id = attached[key][i];
					let element =TokenAttacher.layerGetElement(layer, element_id);
					TokenAttacher.updateOffsetOfElement(quickEdit, type, base_data, key, element_id);
					if(element.document.getFlag(moduleName, 'attached')){
						TokenAttacher._quickEditUpdateOffsetsOfBase(key, element.data);
					}
				}

			}
		}

		static canvasInit(canvasObj){
			if(game.user.isGM){
				if(!window.document.getElementById("tokenAttacherQuickEdit")) return;
				window.document.getElementById("tokenAttacherQuickEdit").remove();

				let quickEdit = getProperty(window, 'tokenAttacher.quickEdit');
				if(quickEdit && canvasObj.scene.data._id !== quickEdit.scene && quickEdit.timer !== null){
					ui.notifications.error(game.i18n.format(localizedStrings.error.QuickEditNotFinished));
				}				
			}
		}

		static getLayerOrCollection(key){
			return canvas.getLayerByEmbeddedName(key) ?? game.collections.get(key);
		}

		static async setAnimateStatus(tokens, animate, suppressNotification=false){			
			let updates = tokens.map(elem =>{
				return {_id:elem.document.data._id, [`flags.${moduleName}.animate`]: animate};
			});
			await canvas.scene.updateEmbeddedDocuments(tokens[0].layer.constructor.documentName, updates, {[moduleName]:{update:true}});
			if(!suppressNotification) ui.notifications.info(game.i18n.format(localizedStrings.info.AnimationToggled, {count: tokens.length}));
		}

		static async  toggleAnimateStatus(tokens, suppressNotification=false){
			let updates = tokens.map(elem =>{
				return {_id:elem.document.data._id, [`flags.${moduleName}.animate`]: !(elem.document.getFlag(moduleName,`animate`) ?? true)};
			});
			await canvas.scene.updateEmbeddedDocuments(tokens[0].layer.constructor.documentName, updates, {[moduleName]:{update:true}});
			if(!suppressNotification) ui.notifications.info(game.i18n.format(localizedStrings.info.AnimationToggled, {count: tokens.length}));
		}

		static layerGetElement(layer, id){
			const foreground = canvas.foreground;
			return layer.get(id) ?? foreground.get(id);
		}

		static async migrateElementsInCompendiums(migrateFunc, elementTypes, topLevelOnly){
			const allCompendiums = [...game.packs].filter(pack =>{
				if(pack.locked) return false;
				if(pack.metadata.entity !== "Actor") return false;
				return true;
			});
			let elementCount = 0;
			for (let i = 0; i < allCompendiums.length; i++) {
				const pack = allCompendiums[i];
				const packIndex = await pack.getIndex();
				let options = {};
				options.pack = pack;
				for (const index of packIndex) {
					const entity = await pack.getDocument(index._id);				
					const prototypeAttached = getProperty(entity, `data.token.flags.${moduleName}.prototypeAttached`);
					if(prototypeAttached){
						const updateElement = migrateFunc;
						const updateBase = (base, type, base_entity) =>{
							const children = getProperty(base, `flags.${moduleName}.prototypeAttached`) ?? getProperty(base, `flags.${moduleName}.attached`);
							if(!children) return;
							for (let i = 0; i < elementTypes.length; i++) {
								const type = elementTypes[i];
								
								if(children.hasOwnProperty(type)){
									for (let i = 0; i < children[type].length; i++) {
										const elem = children[type][i];
										updateElement(elem, type, base_entity);
									}
								}
							}
							
							for (const key in children) {
								if (children.hasOwnProperty(key)) {
									for (let i = 0; i < children[key].length; i++) {
										const element = children[key][i];
										if(typeof element === 'string' || element instanceof String){
											console.error(`Token Attacher - Migration Error, attached child is not an object. Base Token and Actor: `, base_entity.data.name, base, base_entity);
											continue;
										}
										updateBase(element, key, base_entity);
									}
								}
							}
						}
						let new_token = duplicate(getProperty(entity, `data.token`));
						if(elementTypes.includes("Token")) updateElement(new_token, "Token", entity);
						if(!topLevelOnly) updateBase(new_token, 'Token', entity);
						elementCount++;
						await entity.update({token: new_token}, options);
					}
				}
				console.log("Token Attacher - Done migrating Elements in " + pack.metadata.label);
			}				
			console.log(`Token Attacher - Done migrating ${elementCount} Elements in ${allCompendiums.length} Compendiums!`);
		}

		static async purgeTAData(){		
			const base_layer = 	canvas.getLayerByEmbeddedName("Token");
			const moduleName = 'token-attacher';
			let updates = {};
			const pushUpdate = (key, update, updateObj) => {
				if(!updateObj.hasOwnProperty(key)) updateObj[key] = [];
				const dupIndex = updateObj[key].findIndex(item => update._id=== item._id);
				if(dupIndex === -1) updateObj[key].push(update);
			};
			for (const type of ["AmbientLight", "AmbientSound", "Drawing", "MeasuredTemplate", "Note", "Tile", "Token", "Wall"]) {
				const layer = canvas.getLayerByEmbeddedName(type);
				const deleteLinks = (layer) => {
						for (let i = 0; i < layer.placeables.length; i++) {
							const element = layer.placeables[i];
							if(getProperty(element, `data.flags.${moduleName}`)) pushUpdate(type, {_id:element.data._id, [`flags.-=${moduleName}`]:null}, updates);
						}
					}
				deleteLinks(layer);
				if(type === "Tile"){
					deleteLinks(canvas.foreground);
				}
			}
			//Fire updates
			for (const key in updates){
				if (updates.hasOwnProperty(key)) {
					await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});
				}
			}
			console.log("All Token Attacher Data has been removed from scene.");
		}
		static async migrateAttachedOfBase(base, migrateFunc, elementTypes, topLevelOnly, return_data=false){
			return TokenAttacher.migrateAttached(base.layer.constructor.documentName, base.data, migrateFunc, elementTypes, topLevelOnly, return_data);
		}

		static async migrateAttached(type, baseData, migrateFunc, elementTypes, topLevelOnly, return_data=false){
			const attached=getProperty(baseData, `flags.${moduleName}.attached`) || {};
			let attachedEntities = {};
			
			//Get Entities
			for (const key in attached) {
				const layer = canvas.getLayerByEmbeddedName(key);
				attachedEntities[key] = attached[key].map(id => TokenAttacher.layerGetElement(layer, id));
			}

			let updates = {};

			//Get updates for attached elements
			for (const key in attachedEntities) {
				if (attachedEntities.hasOwnProperty(key)) {
					if(elementTypes.includes(key)){
						if(!updates.hasOwnProperty(key)) updates[key] = [];
						updates[key] = await migrateFunc(key, attachedEntities[key].map(entity => duplicate(entity.data)), baseData);
						if(!updates[key]) delete updates[key];
					}
				}
			}
			//Get updates for attached bases
			for (const key in attachedEntities) {
				if (attachedEntities.hasOwnProperty(key)) {
					for (let i = 0; i < attachedEntities[key].length; i++) {
						const element = attachedEntities[key][i];
						const elem_id = element.data._id;
						
						const elem_attached=getProperty(element, `data.flags.${moduleName}.attached`) || {};
						if(Object.keys(elem_attached).length > 0){
							const elem_update = updates[key]?.find(item => item._id === elem_id );
							const updatedElementData = mergeObject(duplicate(element.data), elem_update);
							const subUpdates = await TokenAttacher.migrateAttached(key, updatedElementData, migrateFunc, elementTypes, topLevelOnly, true);
							for (const key in subUpdates) {
								if(!updates.hasOwnProperty(key)) updates[key] = subUpdates[key];
								else{
									updates[key] = updates[key].concat(subUpdates[key]);
								}
							}
						}
					}
				}
			}
			if(return_data) return updates;
			
			//Fire all updates by type
			for (const key in updates) {
				await canvas.scene.updateEmbeddedDocuments(key, updates[key], {[moduleName]:{update:true}});
			}

			return;
		}

		static PreInstantAttach(type, document, data, options, userId){
			if(!TokenAttacher.isAttachmentUIOpen()) return true;

			setProperty(options, `${moduleName}.InstantAttach`, {userId:userId});
		}

		static InstantAttach(type, document,  options, userId){
			if(!getProperty(options, `${moduleName}.InstantAttach`)) return;
			if(!getProperty(options, `${moduleName}.InstantAttach.userId`) === userId) return;
			if(getProperty(document.data,`flags.${moduleName}.prototypeAttached`)) return;
			if(getProperty(options,`${moduleName}.base`)) return;

			const attach_base = canvas.scene.getFlag(moduleName, "attach_base");
			const layer = canvas.getLayerByEmbeddedName(attach_base.type);
			const element = TokenAttacher.layerGetElement(layer, attach_base.element);

			if(!element) {				
				TokenAttacher.closeTokenAttacherUI();
				ui.notifications.error(game.i18n.format(localizedStrings.error.BaseDoesntExist));
				return;
			}
			
			TokenAttacher._AttachToToken(element,{type:document.layer.constructor.documentName, data:[document._id]});
		}
	}
	TokenAttacher.registerHooks();
})();
