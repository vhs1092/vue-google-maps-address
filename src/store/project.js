import { ObjectID } from "bson";
import Vue from "vue";
import config from "../config";

const state = {
	id: undefined,
	privateId: undefined,
	name: "",
	description: "",
	layersIds: [],
	layers: {},
	shapes: {}
}

const getRandomId = function() {
	return (new ObjectID((new Date).getTime()+Math.floor(Math.random()*1234567890))).toString();
}

const getters = {
	layers: (state,getters) => {
		return state.layersIds.map(layerId => state.layers[layerId]);
	},
	layerShapes: (state,getters) => (layerId) => {
		const layer = state.layers[layerId];
		if (!layer || !layer.shapesIds || layer.shapesIds.length==0) return [];
		return layer.shapesIds.map(shapeId => state.shapes[shapeId]);
	},
	visibleRoutesIs: (state,getters) => {
		const ids = {};
		_.each(state.layers,l => {
			if (l.visible) {
				l.shapesIds.forEach(s => {
					if (state.shapes[s] && state.shapes[s].type=="route") {
						ids[s] = true;
					}
				});
			}
		});
		return ids;
	},
	export: (state,getters) => {
		const out = {
			id: state.id,
			privateId: state.privateId,
			name: state.name,
			description: state.description,
			layers: []
		};
		state.layersIds.forEach(id => {
			const layer = $.extend(true,{},state.layers[id]);
			layer.shapes = [];
			layer.shapesIds.forEach(id => {
				const shape = $.extend(true,{},state.shapes[id]);
				delete shape.editing;
				delete shape.loading;
				delete shape.layerId;
				delete shape.distance;
				delete shape.duration;
				delete shape.area;
				if (shape.geocode) {
					delete shape.geocode.loading;
				}
				layer.shapes.push(shape);
			});
			delete layer.shapesIds;
			out.layers.push(layer);

		});
		return out;
	}
}

const actions = {
	newMap: function({commit}) {
		return new Promise((resolve,reject) => {
			const data = {
				id: getRandomId(),
				privateId: 1,
				name: "Mapa",
				description: "",
				layersIds: [],
				layers: {},
				shapes: {}
			};
			const layer1 = {
				id: getRandomId(),
				name: "Direcciones",
				visible: true,
				expanded: true,
				shapesIds: []
			};
			data.layersIds.push(layer1.id);
			data.layers[layer1.id] = layer1;
			commit("setupProject",data);
			resolve({msg:"New project "+data.name+" initialized."});
		});
	},
	expandBox: function({commit},data) {
		return new Promise((resolve,reject) => {
			const l = state.layers[data.id];
			if (!l) return reject();
			if (!data.hasOwnProperty("expanded")) data.expanded = !l.expanded;
			commit("setLayerData",{layer:l,expanded:data.expanded});
			resolve();
		});
	},
	addShape: function({commit},data) {
		return new Promise((resolve,reject) => {
			const l = state.layers[data.layerId];
			if (!l) return reject();
			const s = prepareShapeData(data.type,data.data);
			s.layerId = data.layerId;
			commit("addShapeToLayer",{layer:l,shape:s});
			resolve({msg:"Nuevo Pin Creado",id:s.id,shape:s,layer:l});
		});
	},
	removePin: function({commit},data) {
		return new Promise((resolve,reject) => {
			const l = state.layers[data.layerId];
			if (!l) return reject();
			commit("removePinFromDataBox",{layer:l,shape:data});
			resolve({msg:"Pin eliminado."});
		});
	},
	setPinData: function({commit},data) {
		return new Promise((resolve,reject) => {
			const s = state.shapes[data.id];
			if (!s) return reject({msg:"Pin #"+data.id+" no exite."});
			data.shape = s;
			commit("setPinData",data);
			resolve({msg:"Pin actualizado."});
		});
	},
	moveShapeWaypoint: function({commit},data) {
		return new Promise((resolve,reject) => {
			const s = state.shapes[data.id];
			if (!s) return reject({msg:"Figura #"+data.id+" no existe."});
			data.shape = s;
			commit("moveShapeWaypoint",data);
			resolve({msg:"puntos restaurados"});
		});
	},
	setShapeGeocodeData: function({commit},data) {
		return new Promise((resolve,reject) => {
			const s = state.shapes[data.id];
			if (!s) return reject({msg:"Figura #"+data.id+" no existe"});
			commit("setShapeGeocodeData",{shape:s,geocode:data});
			resolve({msg:"Figura actualizada"});
		});
	},
	moveShape: function({commit},e) {
		return new Promise((resolve,reject) => {
			const layerFrom = state.layers[e.from.dataset.layerId];
			const layerTo = state.layers[e.to.dataset.layerId];
			if (!layerFrom) return reject("No se pudo determinar la forma de la capa");
			if (!layerTo) return reject("No se pudo determinar la forma de la capa");
			commit("moveShape",{layerFrom,layerTo,oldIndex:e.oldIndex,newIndex:e.newIndex});
			resolve({msg:"Movido."});
		});
	}
}

const mutations = {
	setupProject: function(state,data) {
		_.each(state,(v,k) => {
			if (data.hasOwnProperty(k)) {
				Vue.set(state,k,data[k]);
			}
		});
	},
	setLayerData: function(state,data) {
		_.each(data.layer,(v,k) => {
			if (k!="id" && data.hasOwnProperty(k)) {
				Vue.set(data.layer,k,data[k]);
			}
		});
	},
	addShapeToLayer: function(state,data) {
		Vue.set(state.shapes,data.shape.id,data.shape);
		data.layer.shapesIds.unshift(data.shape.id);
	},
	removePinFromDataBox: function(state,data) {
		const index = data.layer.shapesIds.indexOf(data.shape.id);
		if (index===0||index>0) {
			data.layer.shapesIds.splice(index,1);
		}
		Vue.delete(state.shapes,data.shape.id);
	},
	setPinData: function(state,data) {
		_.each(data.shape,(v,k) => {
			if (k!="id" && data.hasOwnProperty(k)) {
				Vue.set(data.shape,k,data[k]);
			}
		});
	},
	moveShapeWaypoint: function(state,e) {
		if (e.oldIndex==e.newIndex) return;
		e.shape.waypoints.splice(e.newIndex,0,e.shape.waypoints.splice(e.oldIndex,1)[0]);
	},
	setShapeGeocodeData: function(state,data) {
		_.each(data.shape.geocode,(v,k) => {
			if (data.geocode.hasOwnProperty(k)) {
				Vue.set(data.shape.geocode,k,data.geocode[k]);
			}
		});
	},
	moveShape: function(state,e) {
		e.layerTo.shapesIds.splice(e.newIndex,0,e.layerFrom.shapesIds.splice(e.oldIndex,1)[0]);
		const shapeId = e.layerTo.shapesIds[e.newIndex];
		if (shapeId && state.shapes[shapeId]) {
			Vue.set(state.shapes[shapeId],"layerId",e.layerTo.id);
		}
	}
}

const prepareShapeData = function(type,data) {
	if (data && data.type) type = data.type;
	if (type=="marker") {
		return prepareMarkerData(data);
	}
	else if (type=="dot") {
		return prepareDotData(data);
	}
	else if (type=="route") {
		return prepareRouteData(data);
	}
}

const prepareMarkerData = function(data) {
	const out = _.extend({
		id: getRandomId(),
		type: "marker",
		name: "",
		formatted_address: "",
		international_phone_number: "",
		icon: "",
		types: [],
		url: "",
		note: ""
	},data);
	if (data.geometry && data.geometry.location) {
		out.position = {lat:data.geometry.location.lat(),lng:data.geometry.location.lng()};
	}
	out.placeId = data.place_id;
	out.photos = [];
	(data.photos||[]).forEach((p) => {
		if (p.hasOwnProperty("getUrl")) {
			out.photos.push({
				thumb: p.getUrl({maxHeight:240,maxWidth:360}),
				big: p.getUrl({maxHeight:1200,maxWidth:1600})
			});
		}
		else if (p.thumb && p.big) {
			out.photos.push(_.pick(p,"thumb","big"));
		}
	});
	return _.pick(out,"id","type","name","formatted_address","international_phone_number","icon","types","url","note","position","placeId","photos");
}

const prepareDotData = function(data) {
	const out = $.extend(true,{
		id: getRandomId(),
		type: "dot",
		name: "",
		text: "",
		geocode: {
			loading: false,
			status: 0,
			data: ""
		}
	},config.dot,data);
	if (data.latLng) {
		out.position = {lat:data.latLng.lat(),lng:data.latLng.lng()};
	}
	return _.pick(out,"id","type","name","text","position","icon","geocode");
}

const prepareRouteData = function(data) {
	const out = _.extend(true,{
		id: getRandomId(),
		type: "route",
		name: "",
		distance: 0,
		duration: 0,
		mode: "driving",
		nohighways: false,
		notolls: false,
		waypoints: ["",""],
		editing: false,
		loading: false
	},config.route,data);
	return _.pick(out,"id","type","name","distance","duration","mode","nohighways","notolls","waypoints","editing","loading");
}

export default {
	state,
	getters,
	mutations,
	actions,
	namespaced: true
}
