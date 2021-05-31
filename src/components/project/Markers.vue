<template>
	<div>
		<template v-for="s in shapes" v-if="layers[s.layerId].visible">
			<gmap-marker
				v-if="s.type=='marker'"
				:key="s.id"
				:position="s.position"
				:icon="{url:mapIcon,scaledSize:markerIconSize,anchor:markerIconAnchor}"
				:clickable="true"
				@click="$bus.$emit('toggleMarkerInfo',s)"
			/>
			<gmap-marker
				v-if="s.type=='dot'"
				:key="s.id"
				:position="s.position"
				:icon="{url:mapIcon,scaledSize:dotIconSize,anchor:dotIconAnchor}"
				:clickable="true"
				:draggable="true"
				@click="$bus.$emit('togglePinInfo',s)"
				@dragend="updatePinPosition(s,$event)"
			/>
		</template>
	</div>
</template>

<script>
import {mapState} from "vuex";

export default {
	data: function () {
		return {
			mapIcon: 'https://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png',
		};
  	},
	computed: {
		...mapState("project",{
			shapes: state => state.shapes,
			layers: state => state.layers
		}),
		markerIconSize: function() {
			return new google.maps.Size(30,30);
		},
		markerIconAnchor: function() {
			return new google.maps.Point(15,15);
		},
		dotIconSize: function() {
			return new google.maps.Size(22,40);
		},
		dotIconAnchor: function() {
			return new google.maps.Point(11,40);
		}
	},
	methods: {
		updatePinPosition: function(shape,data) {
			this.$store.dispatch("project/setPinData",{id:shape.id,position:{lat:data.latLng.lat(),lng:data.latLng.lng()}}).then(result => {
				this.$bus.$emit("success",result.msg);
				this.$bus.$emit("updatePinGeocode",shape,"coordsUpdated");
			}).catch(result => this.$bus.$emit("error",result.msg));
		}
	}
}
</script>