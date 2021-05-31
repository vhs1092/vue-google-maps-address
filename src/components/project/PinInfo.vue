<template>

	<gmap-info-window v-if="!!renderData" :options="windowOptions" :position="renderData.position" @closeclick="$bus.$emit('togglePinInfo')">
		<div class="rp-iwin ">
			<template v-if="!editing">
				<h3 v-if="!!renderData.name">{{renderData.name}}</h3>
				<p v-html="renderData.text"></p>
			</template>
			<div v-if="editing">
				<div class="form-group mt-6">
					<input type="text" class="input mb-2" v-model="name" placeholder="Nombre" />
				</div>
				<div class="form-group">
					<textarea class="textarea mb-2" v-model="text" rows="5" ref="text" placeholder="Descripción"></textarea>
				</div>
			</div>
			<p v-if="renderData.position">
				<span>Localización: </span>
				<span>{{renderData.position|latlng}}</span>
			</p>
			<p v-if="renderData.position">
				<span>Dirección: </span>
				<span>
					<span v-if="renderData.geocode.loading">Cargando...</span>
					<span v-else-if="renderData.geocode.status==2">No resultados</span>
					<span v-else-if="renderData.geocode.status==1">{{renderData.geocode.data}}</span>
				</span>
			</p>
			<p v-if="!editing">
				<a class="button mt-3 mb-3 is-primary btn-sm" href="javascript:void(0)" @click="edit()"><span class="icon-pencil"></span> Editar</a>
				<a class="button mt-3 mb-3 is-default btn-sm" href="javascript:void(0)" @click="remove()"><span class="icon-times"></span> Eliminar</a>
			</p>
			<p v-if="editing">
				<a class="button mt-3 mb-3 is-primary btn-sm" href="javascript:void(0)" @click="save()"><span class="icon-checkmark"></span> Guardar</a>
				<a class="button mt-3 mb-3 is-default btn-sm" href="javascript:void(0)" @click="cancel()"><span class="icon-times"></span> Cancelar</a>
			</p>

		</div>
	</gmap-info-window>
</template>

<script>

export default {
	data: function() {
		return {
			renderData: undefined,
			editing: false,
			name: "",
			text: ""
		}
	},
	computed: {
		windowOptions: function() {
			return {
				pixelOffset: {
					width: 0,
					height: -40
				}
			}
		}
	},
	methods: {
		edit: function() {
			this.name = this.renderData.name;
			this.text = this.renderData.text;
			this.editing = true;
			this.$nextTick(() => {
				this.$refs.text.focus();
			});
		},
		cancel: function() {
			this.name = "";
			this.text = "";
			this.editing = false;
		},
		save: function() {
			this.$store.dispatch("project/setPinData",{id:this.renderData.id,name:this.name,text:this.text}).then(result => {
				this.$bus.$emit("success",result.msg);
				this.$bus.$emit("togglePinInfo");
				this.cancel();
			}).catch(result => this.$bus.$emit("error",result.msg));
		},
		remove: function() {
			this.$store.dispatch("project/removePin",this.renderData).then(result => {
				this.$bus.$emit("success",result.msg);
				this.renderData = undefined;
			}).catch(result => this.$bus.$emit("error",result.msg));
		}
	},
	mounted: function() {
		this._toggle = (data,editing) => {
			if (!data || (this.renderData && this.renderData==data.r)) {
				this.renderData = undefined;
				this.cancel();
				return;
			}
			this.renderData = data;
			editing ? this.edit() : this.cancel();
		}
		this._show = (data,editing) => {
			if (data) {
				this.renderData = data;
				editing ? this.edit() : this.cancel();
			}
		}
		this.$bus.$on("togglePinInfo",this._toggle);
		this.$bus.$on("showPinInfo",this._show);
	},
	beforeDestroy: function() {
		this._toggle && this.$bus.$off("togglePinInfo",this._toggle);
		this._show && this.$bus.$off("showPinInfo",this._show);
	}
}

</script>