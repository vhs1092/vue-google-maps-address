<template>
  <div>
    <div
      class="address-content"
      ref="list">
      <AddressesBox
        v-for="(l, k) in layers"
        :key="k"
        :layer="l"
        :selected="l.id == selectedLayerId"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import AddressesBox from "./AddressesBox.vue";


export default {
  data: function () {
    return {
      selectedLayerId: undefined,
    };
  },
  computed: {
    ...mapState("project", {
      name: (state) => state.name,
      description: (state) => state.description,
    }),
    ...mapGetters("project", ["layers"])
  },
  methods: {
    selectLayer: function (id) {
      this.selectedLayerId = id;
    },
  },
  mounted: function () {
    if (this.layers.length > 0) {
      this.selectLayer(this.layers[0].id);
    }
    this._tryAdd = (type, data, callback) => {
      this.$store
        .dispatch("project/addShape", {
          layerId: this.selectedLayerId,
          type: type,
          data: data,
        })
        .then((result) => {
          this.$bus.$emit("success", result.msg);
          callback && callback("success", result.shape);
        })
        .catch((result) => {
          this.$bus.$emit("error", result.msg);
          callback && callback("error");
        });
    };
    this.$bus.$on("tryAdd", this._tryAdd);
    this.$bus.$on("selectLayer", this.selectLayer);
  },
  beforeDestroy: function () {
    this._tryAdd && this.$bus.$off("tryAdd", this._tryAdd);
    this.selectLayer && this.$bus.$off("selectLayer", this.selectLayer);
  },
  components: {
    AddressesBox,
  },
};
</script>

<style lang="scss" scoped>
.address-content {
  overflow-y: auto;
}
</style>
