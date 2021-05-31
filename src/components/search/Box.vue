<template>
	<div class="rp-search is-flex is-align-content-center is-justify-content-center">
		<input class="input" type="text" ref="searchbox" v-model="query">
		<a class="icon-times is-flex is-align-items-center is-justify-content-center" href="javascript:void(0)" v-if="query.length>0" @click="query=''"></a>
	</div>
</template>

<script>

const detailedResults = {};
import _ from 'lodash';

export default {
	data: function() {
		return {
			query: ""
		}
	},
	watch: {
		query: function(query) {
			if (!query || query.length==0) {
				this.$store.dispatch("search/setResults",[]);
				this.$bus.$emit("clearSearchResults");
			}
			else {
				this.updateSearchResults();
			}
		}
	},
	methods: {
		updateSearchResults: _.debounce(function() {
			if (this.query && this.query.length>0 && this.service && this.bounds) {
				this.service.textSearch({query:this.query,bounds:this.bounds},(results,status) => {
					this.$store.dispatch("search/appendResults",results);
				});
			}
		},500)
	},
	mounted: function() {
		this.$promises.when("mapReady").then((map) => {
			this.map = map;
			this.bounds = map.getBounds();
			this.service = new google.maps.places.PlacesService(map);
			this.sb = new google.maps.places.SearchBox(this.$refs.searchbox,{bounds:this.bounds});
			this.sb.addListener("places_changed",() => {
				const places = this.sb.getPlaces();
				this.$store.dispatch("search/setResults",places);
				this.$bus.$emit("setMapBounds",places);
			});

			//change map position
			this._mapBoundsChanged = (bounds) => {
				this.bounds = bounds;
				this.sb.setBounds(bounds);
				this.updateSearchResults();
			}

			//address result
			this._getDetailedResult = (placeId,callback) => {
				if (detailedResults[placeId]) return callback && callback(detailedResults[placeId]["resultType"],detailedResults[placeId]["result"]);
				this.service.getDetails({placeId:placeId},(place,status) => {
					detailedResults[placeId] = {resultType:status==google.maps.places.PlacesServiceStatus.OK ? "success":"error", result:place};
					return callback && callback(detailedResults[placeId]["resultType"],detailedResults[placeId]["result"]);
				});
			}
			this.$bus.$on("mapBoundsChanged",this._mapBoundsChanged);
			this.$bus.$on("getDetailedResult",this._getDetailedResult);
			this.$refs.searchbox.focus();
		});
	},
	beforeDestroy: function() {
		this.$store.dispatch("search/setResults",[]);
		this._mapBoundsChanged && this.$bus.$off("mapBoundsChanged",this._mapBoundsChanged);
		this._getDetailedResult && this.$bus.$off("getDetailedResult",this._getDetailedResult);
	}
}
</script>