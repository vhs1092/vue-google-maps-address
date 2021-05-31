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
          <span class="second-color"> {{ r.geometry.location | latlng }}</span>
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
        <button class="button" @click="addToMap()">Agregar al mapa</button>
      </div>
      <div class="column">
        <a class="button" v-if="!!r.url" :href="r.url" target="_blank"
          >Ver en Google Maps</a
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: function () {
    return {
      r: undefined,
      infoWindowType: "marker",
    };
  },
  computed: {
    infoWindowOptions: function () {
      return {
        pixelOffset: {
          width: 0,
          height: this.infoWindowType == "poi" ? -5 : -30,
        },
      };
    },
    thumbs: function () {
      return _.map((this.r.photos || []).slice(0, 2), (p) => {
        return p.getUrl({ maxHeight: 240, maxWidth: 360 });
      });
    },
  },
  methods: {
    addToMap: function () {
      this.$bus.$emit("tryAdd", "marker", this.r, (resultType) => {
        if (resultType == "success") {
          this.$bus.$emit("toggleDetailedResult");
        }
      });
    },
  },
  mounted: function () {
    this._toggleDetailedResult = (placeId, infoWindowType) => {
      if (!placeId || (this.r && this.r.placeId == placeId)) {
        this.r = undefined;
        return;
      }
      this.$bus.$emit("getDetailedResult", placeId, (resultType, result) => {
        if (resultType == "success") {
          this.infoWindowType = infoWindowType;
          this.r = result;
        } else {
          return this.$bus.$emit(
            "error",
            "No se pudo recibir información detallada sobre este lugar."
          );
        }
      });
    };
    this.$bus.$on("toggleDetailedResult", this._toggleDetailedResult);
  },
  beforeDestroy: function () {
    this._toggleDetailedResult &&
      this.$bus.$off("toggleDetailedResult", this._toggleDetailedResult);
  },
};
</script>