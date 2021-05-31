<template>
  <nav id="nav" class="navbar is-transparent is-flex is-align-items-center is-justify-content-center is-flex-direction-column">
    <div class="top">
      <div class="navbar-burger" data-target="navbarExampleTransparentExample">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    <div class="columns is-mobile">
      <div class="column is-2">
        <button class="btn button-back">
          <img src="../assets/back.png" alt="back" />
        </button>
      </div>
      <div class="column is-8">
        <!--button class="into-address">Ingresa una dirección</button-->
        <SearchBox />
        <ToolBox />
      </div>
      <div class="column is-2 is-flex is-align-items-center">
        <button class="btn button-search">Ir!</button>
      </div>
    </div>
  </nav>
    
</template>

<script>
import SearchBox from "./search/Box.vue";
import ToolBox from "./tools/Box.vue";


export default {
  data: function () {
    return {

    };
  },
  components: {
    SearchBox,
    ToolBox
  },
};
</script>

<style lang="scss">
.btn {
  width: 30px;
  height: 30px;
  border-radius: 40px;
  border: 0;
  background: none;
  font-size: 10px;
  &.button-search {
    background: #f2c94c;
  }
}
.into-address {
  width: 100%;
  height: 40px;
  background: none;
  border: 1px solid black;
  color: black;
}
</style>
