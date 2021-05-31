<template>
  <div class="rp-container">
    <Menu v-if="projectInitialized && isReady" />
    <div class="map">
      <gmap-map
        :center="center"
        :zoom="zoom"
        :mapTypeId="mapTypeId"
        @zoom_changed="
          $store.dispatch('viewport/update', { what: 'zoom', e: $event })
        "
        @maptypeid_changed="
          $store.dispatch('viewport/update', { what: 'mapTypeId', e: $event })
        "
        ref="map"
      >
        <SearchResults />
        <SearchDetailedResult />
        <ProjectMarkers />
        <ProjectMarkerInfo />
        <MapPinInfo />
      </gmap-map>
    </div>
    <transition name="rp-modal">
      <div v-if="projectInitialized && isReady">
        <Project />
      </div>
    </transition>
    
    <Router />
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from "vuex";
import Project from "./project/Main.vue";
import ProjectMarkers from "./project/Markers.vue";
import ProjectMarkerInfo from "./project/MarkerInfo.vue";
import MapPinInfo from "./project/PinInfo.vue";
import SearchBox from "./search/Box.vue";
import SearchResults from "./search/Results.vue";
import SearchDetailedResult from "./search/DetailedResult.vue";
import ToolBox from "./tools/Box.vue";
import Router from "./Router.vue";
import Menu from "./Menu.vue";

const routes = {};

export default {
  data: function() {
    return {
      modalWindowProps: undefined,
      isReady: false,
    };
  },
  computed: {
    ...mapState("viewport", {
      center: (state) => state.center,
      zoom: (state) => state.zoom,
      mapTypeId: (state) => state.mapTypeId,
    }),
    ...mapState("project", {
      projectInitialized: (state) => !!state.id,
      shapes: (state) => state.shapes,
    }),
    ...mapGetters("project", ["visibleRoutesIs"]),
    ...mapState("tool", {
      tool: (state) => state.name,
    }),
  },
  watch: {
    projectInitialized: function(b) {
      if (!b) {
        this.$store.dispatch("tool/setTool");
      }
    },
    shapes: function(shapes) {
      _.each(shapes, (s) => {
        if (s.type == "route") {
          this.$bus.$emit("buildRoute", s, true);
        }
      });
    },
    tool: function(tool) {
      this.map &&
        this.map.setOptions({
          draggableCursor: tool == "marker" ? "crosshair" : null,
        });
    },
    visibleRoutesIs: function(ids) {
      this.updateVisibleRoutes(ids);
    },
  },
  methods: {
    ...mapActions("project", {
      newMap: "newMap",
    }),
    updateVisibleRoutes: function(ids) {
      _.each(routes, (r, id) => {
        r.setMap(ids[id] ? this.map : undefined);
      });
    },
    drawRoute: function(id, route, preserveViewport) {
      if (routes[id]) {
        routes[id].setMap(undefined);
        delete routes[id];
      }
      routes[id] = new google.maps.DirectionsRenderer({
        draggable: true,
        map: this.visibleRoutesIs[id] ? this.map : undefined,
      });
      if (preserveViewport)
        routes[id].setOptions({ preserveViewport: preserveViewport });
      routes[id].setDirections(route);
      routes[id].addListener("directions_changed", () => {
        const directions = routes[id].getDirections();
        this.updateRouteStat(id, directions);
        if (directions && directions.geocoded_waypoints) {
          const p = [];
          directions.geocoded_waypoints.forEach((wp) => {
            p.push(
              new Promise((resolve) => {
                this.$bus.$emit(
                  "getDetailedResult",
                  wp.place_id,
                  (resultType, result) => {
                    resolve(resultType == "success" ? result : null);
                  }
                );
              })
            );
          });
          Promise.all(p).then((values) => {
            this.$store.dispatch("project/setPinData", {
              id: id,
              waypoints: _.map(values, (v) => (v ? v.formatted_address : "")),
            });
          });
        }
      });
    },
    clearRoute: function(id) {
      if (routes[id]) {
        routes[id].setMap(undefined);
      }
      delete routes[id];
    },
    updateRouteStat: function(id, stat) {
      let totalDistance = 0;
      let totalDuration = 0;
      if (stat.routes.length > 0) {
        stat.routes[0].legs.forEach((leg) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });
      }
      this.$store.dispatch("project/setPinData", {
        id: id,
        distance: totalDistance,
        duration: totalDuration,
      });
    },
  },
  mounted: function() {
    this.newMap();

    this.$refs.map.$mapCreated.then(() => {
      this.map = this.$refs.map.$mapObject;
      this.map.setOptions({
        mapTypeControl: true,
        mapTypeControlOptions: {
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.TERRAIN,
          ],
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        panControl: true,
        panControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
        scaleControl: true,
        overviewMapControl: true,
        rotateControl: true,
      });
      this.map.addListener("bounds_changed", () => {
        this.$bus.$emit("mapBoundsChanged", this.map.getBounds());
      });
      this.map.addListener("click", (e) => {
        if (e.placeId) {
          e.stop();
          this.$bus.$emit("toggleDetailedResult", e.placeId, "poi");
        } else if (this.tool == "marker") {
          this.$bus.$emit("tryAdd", "dot", e, (resultType, shape) => {
            if (resultType == "success") {
              this.$store.dispatch("tool/setTool");
              this.$bus.$emit("showPinInfo", shape, true);
              this.$bus.$emit("updatePinGeocode", shape);
            }
          });
        }
      });
      this._setMapBounds = (results) => {
        const bounds = new google.maps.LatLngBounds();
        results.forEach((r) => {
          if (r.geometry && r.geometry.viewport) {
            bounds.union(r.geometry.viewport);
          } else if (r.geometry && r.geometry.location) {
            bounds.extend(r.geometry.location);
          } else if (r.lat && r.lng) {
            bounds.extend(r);
          }
        });
        this.map.fitBounds(bounds);
      };
      this._setMapCenter = (center) => {
        this.map.panTo(center);
      };
      this._updatePinGeocode = (shape, mode) => {
        if (
          shape.geocode &&
          (shape.geocode.status == 0 || mode == "coordsUpdated") &&
          !shape.geocode.loading &&
          shape.position
        ) {
          this.$store.dispatch("project/setShapeGeocodeData", {
            id: shape.id,
            loading: true,
          });
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: shape.position }, (results, status) => {
            if (status == "OK" && results.length > 0) {
              this.$store.dispatch("project/setShapeGeocodeData", {
                id: shape.id,
                status: 1,
                data: results[0].formatted_address,
              });
            } else {
              this.$store.dispatch("project/setShapeGeocodeData", {
                id: shape.id,
                status: 2,
                data: "",
              });
            }
            this.$store.dispatch("project/setShapeGeocodeData", {
              id: shape.id,
              loading: false,
            });
          });
        }
      };
      this._buildRoute = (shape, preserveViewport, callback) => {
        const filledWaypoints = _.filter(shape.waypoints, (w) => !!w);
        if (!filledWaypoints || filledWaypoints.length < 2)
          return (
            callback &&
            callback("error", {
              msg:
                "No se puede construir la ruta: las direcciones no se completaron correctamente.",
            })
          );
        const ds = new google.maps.DirectionsService();
        ds.route(
          {
            origin: filledWaypoints[0],
            destination: filledWaypoints[filledWaypoints.length - 1],
            waypoints: _.map(filledWaypoints.slice(1, -1), (v) => {
              return { location: v };
            }),
            travelMode: google.maps.TravelMode[shape.mode.toUpperCase()],
            provideRouteAlternatives: false,
            avoidHighways: shape.nohighways,
            avoidTolls: shape.notolls,
          },
          (response, status) => {
            if (status == google.maps.DirectionsStatus.OK) {
              this.updateRouteStat(shape.id, response);
              this.drawRoute(shape.id, response, preserveViewport);
              return callback && callback("success");
            } else
              return (
                callback &&
                callback("error", { msg: "No se pudo construir la ruta." })
              );
          }
        );
      };
      this._destroyRoute = (shape, callback) => {
        delete routes[shape.id];
        this.clearRoute(shape.id);
      };
      this._isReady = (isReady) => {
        this.isReady = isReady;
      };
      this.$bus.$on("setMapBounds", this._setMapBounds);
      this.$bus.$on("setMapCenter", this._setMapCenter);
      this.$bus.$on("updatePinGeocode", this._updatePinGeocode);
      this.$bus.$on("buildRoute", this._buildRoute);
      this.$bus.$on("destroyRoute", this._destroyRoute);
      this.$bus.$on("isReady", this._isReady);
      this.$promises.resolve("mapReady", this.map);
    });
  },
  beforeDestroy: function() {
    [
      "setMapBounds",
      "setMapCenter",
      "buildRoute",
      "destroyRoute",
      "updatePinGeocode",
      "makeRequest",
      "isReady",
    ].forEach((f) => {
      this.hasOwnProperty("_" + f) && this.$bus.$off(f, this["_" + f]);
    });
  },
  destroyed: function() {
    this.$promises.unregister("mapReady");
  },
  components: {
    Menu,
    Project,
    ProjectMarkers,
    ProjectMarkerInfo,
    MapPinInfo,
    SearchBox,
    SearchResults,
    SearchDetailedResult,
    ToolBox,
    Router,
  },
};
</script>
