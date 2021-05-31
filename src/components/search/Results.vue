<template>
	<div>
		<gmap-marker
			v-for="r in results"
			v-if="r.location"
			:key="r.id"
			:position="r.location"
			:icon="{url:mapIcon,scaledSize:iconSize,anchor:iconAnchor}"
			:clickable="true"
			@click="$bus.$emit('toggleDetailedResult',r.id,'marker')"
		>
		</gmap-marker>
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
		...mapState("search",{
			results: store => store.results
		}),
		iconSize: function() {
			return new google.maps.Size(60,60);
		},
		iconAnchor: function() {
			return new google.maps.Point(15,15);
		}
	},
}
</script>