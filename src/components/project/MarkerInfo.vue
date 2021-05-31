<template>
  <div
    v-if="!!r"
    class="card-map is-flex is-flex-direction-column is-align-items-center is-justify-content-center p-5"
  >
    <div class="columns is-mobile">
      <div class="column is-8">
        <p class="is-size-6 has-text-white has-text-left">
          {{ r.name }}
        </p>
        <p class="has-text-white has-text-left is-small-text">
          {{ r.formatted_address }}
          <span class="second-color"> {{r.position|latlng}}</span>
        </p>
      </div>
      <div class="column is-flex is-justify-content-flex-end" v-if="thumbs">
        <div
          class="image"
          :style="{ backgroundImage: 'url(' + thumbs[0] + ')' }"
        >
          <div class="favorite"></div>
        </div>
      </div>
    </div>
    <div class="columns is-mobile">
      <div class="column">
                <button class="button" @click="remove()">Eliminar</button>

      </div>
    </div>
  </div>

</template>

<script>

export default {
	data: function() {
		return {
			r: undefined,
			editing: false,
			note: ""
		}
	},
	computed: {
		infoWindowOptions: function() {
			return {
				pixelOffset: {
					width: 0,
					height: -10
				}
			}
		},
		thumbs: function() {
			if (!this.r) return [];
			return (this.r.photos||[]).slice(0,2);
		},
	},
	methods: {
		edit: function() {
			this.note = this.r.note;
			this.editing = true;
			this.$nextTick(() => {
				this.$refs.note.focus();
			});
		},
		cancel: function() {
			this.note = "";
			this.editing = false;
		},
		save: function() {
			this.$store.dispatch("project/setPinData",{id:this.r.id,note:this.note}).then(result => {
				this.$bus.$emit("success",result.msg);
				this.cancel();
			}).catch(result => this.$bus.$emit("error",result.msg));
		},
		remove: function() {
			this.$store.dispatch("project/removePin",this.r).then(result => {
				this.$bus.$emit("success",result.msg);
				this.r = undefined;
			}).catch(result => this.$bus.$emit("error",result.msg));
		}
	},
	mounted: function() {
		this._toggle = (data) => {
			if (!data || (this.r && this.r.id==data.id)) {
				this.r = undefined;
				this.editing = false;
				return;
			}
			this.r = data;
		}
		this._show = (data) => {
			if (data) {
				this.r = data;
			}
		}
		this.$bus.$on("toggleMarkerInfo",this._toggle);
		this.$bus.$on("showMarkerInfo",this._show);
	},
	beforeDestroy: function() {
		this.$bus.$off("toggleMarkerInfo",this._toggle);
		this.$bus.$off("showMarkerInfo",this._show);
	}
}
</script>