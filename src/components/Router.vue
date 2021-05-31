<template>
<div></div>
</template>

<script>

export default {
	data: function() {
		return {
			enabled: true
		}
	},
	mounted: function() {
		this.$promises.when("mapReady").then(() => {
			this._hashchange = () => {
				if (!this.enabled) return;
				
				this.$bus.$emit("isReady",true);
				
			}
			this.$bus.$on("setRoute",this._setRoute);
			this._hashchange();
		});
	}
}

</script>