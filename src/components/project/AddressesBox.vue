<template>
	<div class="rp-layer SearchDetail">
		<div @click="expandBox" :class="{'-inactive':!layer.visible,'-active':selected}">
			<div>
				<span class="icon" :class="{'icon-calcplus':!layer.expanded,'icon-calcminus':layer.expanded}">{{layer.name}}</span>
			</div>
		</div>

			<div v-if="layer.expanded">
				<div>
					<div v-show="showEmpty" ref="empty">-- Vacío--</div>
					<div :options="{group:'shapes'}" :value="shapes" :data-layer-id="layer.id">
						<template v-for="s in shapes">
							<template v-if="s.type=='marker'">
								<div class="is-flex is-flex-direction-column mt-2" :key="s.id">

								<a href="javascript:void(0)" class="box mb-4" :key="s.id" @click="showMarkerInfo(s)">
									<i :style="{backgroundImage:'url('+s.icon+')'}"></i>
									<span class="is-size-6">{{s.name}}</span>
								</a>
								</div>
							</template>
							<template v-if="s.type=='dot'">
								<div class="is-flex is-flex-direction-column mt-2" :key="s.id">
									<a class="box mb-4" href="javascript:void(0)" @click="showPinInfo(s)">
										<i :style="{backgroundImage:'url('+s.icon+')'}"></i>
										<span class="is-size-6">{{s.name}}</span>
									</a>
								</div>
							</template>
							<template v-if="s.type=='route'">
								<div :key="s.id" :ref="'shape'+s.id" class="box mb-4">
									<div class="clearfix">
										<div class="title-distance">
											<span class="icon icon-directions" v-if="s.editing"></span>
											<span class="icon fa-icon" v-if="!s.editing" :class="'icon-'+s.mode"></span>
											<span v-text="routeName(s)"></span>
										</div>
										<a href="javascript:void(0)" class="close-btn" v-if="s.editing" @click="remove(s)"><span class="icon-times"></span></a>
										<a href="javascript:void(0)" v-else @click="editRoute(s)"><span class="icon-cog"></span></a>
									</div>
									<div :value="s.waypoints" v-if="s.editing">
										<div class="input-group input-group-sm" :key="i" v-for="w,i in s.waypoints">
											<span class="input-group-addon">{{i+1}}</span>
											<input type="text" class="input" placeholder="-- Destino vacío --" :value="w" @focus="createDirectionPointAutocomplete(s,i,$event)" @blur="destroyWaypointAutocomplete(s,i,$event)" />
											<a class="btn btn-default input-group-addon close-btn" v-if="s.waypoints.length>2" @click="removeWaypoint(s,i)">
												<span class="icon icon-times"></span>
											</a>
										</div>
									</div>
									<div class="rp-layer-route-routes-view" v-else>
										<div class="rp-layer-routes-item" :key="i" v-for="w,i in s.waypoints">
											<span class="badge">{{i+1}}</span>
											<span>{{w}}</span>
										</div>
										<div class="rp-layer-route-routes-stat">
											{{s.distance|distance}}
											{{s.duration|duration}}
										</div>
									</div>
									<div class="columns is-mobile mt-4" v-if="s.editing">
										<div class="column has-text-centered">
											<button class="button btn-default btn-sm btn-pin-mobile" @click="addDirectionPoint(s)">
												<span class="icon-plus"></span>
												Agregar Dirección
											</button>
										</div>
										<div class="column has-text-centered">
											<button class="button btn-default btn-sm" disabled="disabled" v-if="s.loading">
												<span class="icon-loading icon-spin"></span>
												Cargando...
											</button>
											<button class="button btn-default btn-pin-mobile btn-sm" v-else @click="buildRoute(s)">
												<span class="icon-checkmark"></span>
												Calcular distancia
											</button>
										</div>
									</div>
								</div>
							</template>
						</template>
					</div>
				</div>
			</div>
	</div>
</template>

<script>

export default {
	props: ["layer","selected"],
	data: function() {
		return {
		
		};
	},
	computed: {
		showEmpty: function() {
			return this.$store.getters["project/layerShapes"](this.layer.id).length==0;
		},
		shapes: function() {
			return this.$store.getters["project/layerShapes"](this.layer.id);
		}
	},
	methods: {
		expandBox: function() {
			this.$store.dispatch("project/expandBox",{id:this.layer.id}).catch(result => this.$bus.$emit("error",result));
		},
		showMarkerInfo: function(data) {
			this.$bus.$emit("setMapCenter",data.position);
			this.$bus.$emit("showMarkerInfo",data);
		},
		showPinInfo: function(data) {
			this.$bus.$emit("setMapCenter",data.position);
			this.$bus.$emit("showPinInfo",data);
		},
		routeName: function(s) {
			const filledWaypoints = _.filter(s.waypoints,w => !!w);
			if (filledWaypoints.length>1) {
				return filledWaypoints[0]+" - "+filledWaypoints[filledWaypoints.length-1];
			}
			else {
				return "Distancia entre direcciones";
			}
		},
		remove: function(s) {
			this.$store.dispatch("project/removePin",s).then(result => {
				this.$bus.$emit("success",result);
				if (s.type=="route") {
					this.$bus.$emit("destroyRoute",s);
				}
			}).catch(result => this.$bus.$emit("error",result));
		},
		addDirectionPoint: function(s) {
			const w = [
				...s.waypoints,
				""
			];
			this.$store.dispatch("project/setPinData",{id:s.id,waypoints:w}).then(result => {
				this.$bus.$emit("success","Dirección agregada");
			}).catch(result => this.$bus.$emit("error",result));
		},
		createDirectionPointAutocomplete: function(s,i,e) {
			this.$promises.when("mapReady").then((map) => {
				this.waypointAutocomplete = new google.maps.places.SearchBox(e.target,{bounds:map.getBounds()});
				this.waypointAutocomplete.addListener("places_changed",() => {
					const places = this.waypointAutocomplete.getPlaces();
					if (places && places.length>0) {
						const w = [
							...s.waypoints.slice(0,i),
							places[0].formatted_address,
							...s.waypoints.slice(i+1)
						];
						this.$store.dispatch("project/setPinData",{id:s.id,waypoints:w}).then(result => {
						}).catch(result => this.$bus.$emit("error",result));
					}
				});
			});
		},
		destroyWaypointAutocomplete: function(s,i,e) {
			console.log("destroyWaypointAutocomplete",arguments);
		},
		editRoute: function(s) {
			this.$store.dispatch("project/setPinData",{id:s.id,editing:true});
		},
		buildRoute: function(s) {
			this.$store.dispatch("project/setPinData",{id:s.id,loading:true});
			this.$bus.$emit("buildRoute",s,false,(resultType,result) => {
				if (resultType=="success") {
					this.$store.dispatch("project/setPinData",{id:s.id,editing:false,loading:false});
				}
				else {
					this.$store.dispatch("project/setPinData",{id:s.id,loading:false});
					this.$bus.$emit("error",result);
				}
			});
		},
		removeWaypoint: function(s,i) {
			const w = [
				...s.waypoints.slice(0,i),
				...s.waypoints.slice(i+1)
			];
			this.$store.dispatch("project/setPinData",{id:s.id,waypoints:w}).then(result => {
				this.$bus.$emit("success","Dirección eliminada");
			}).catch(result => { console.log(result); this.$bus.$emit("error",result)});
		},
	},
	mounted: function() {
		
		//set map location
		this._mapBoundsChanged = (b) => {
			if (this.waypointAutocomplete) {
				this.waypointAutocomplete.setBounds(b);
			}
		}

		//focus input to enter address
		this._shapeFocus = (s) => {
			this.$nextTick(() => {
				if (this.$refs["shape"+s.id]) {
					$(this.$refs["shape"+s.id]).find("input[type=text]").get(0).focus();
				}
			});
		}
		this.$bus.$on("mapBoundsChanged",this._mapBoundsChanged);
		this.$bus.$on("shapeFocus",this._shapeFocus);
	},
	beforeDestroy: function() {
		this._mapBoundsChanged && this.$bus.$off("mapBoundsChanged",this._mapBoundsChanged);
		this._shapeFocus && this.$bus.$off("shapeFocus",this._shapeFocus);
	}
}

</script>