<template>
	<div class="map-tools">
		<!--button class="btn btn-default" :class="{'-active':tool=='hand'}" @click="$store.dispatch('tool/setTool','hand')">
			<span class="icon-handdrag"></span>
		</button-->
		<button class="btn btn-default" :class="{'-active':tool=='marker'}" @click="$store.dispatch('tool/setTool','marker')">
			<span class="icon-mapmarker"></span>
		</button>
		<button class="btn btn-default" @click="addPin">
			<span class="icon-directions"></span>
		</button>
	</div>
</template>

<script>
export default {
	computed: {
		tool: function() {
			return this.$store.state.tool.name;
		}
	},
	methods: {
		addPin: function() {
			this.$bus.$emit("tryAdd","route",{editing:true},(resultType,shape) => {
				this.$store.dispatch("project/expandBox",{id:shape.layerId,expanded:true}).then(result => {
					this.$bus.$emit("shapeFocus",shape);
				}).catch(result => this.$bus.$emit("error",result));
			});
		}
	}
}
</script>