import Vue from "vue";
import Vuex from "vuex";
import project from "./project";
import viewport from "./viewport";
import search from "./search";
import tool from "./tool";

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production'

const STORAGE_KEY = "vue-google-maps-address";
const initialData = _.extend([],JSON.parse(window.localStorage.getItem(STORAGE_KEY))||[]);

const state = {
	projects: initialData
}

export default new Vuex.Store({
	state,
	modules: {
		project,
		viewport,
		search,
		tool
	},
	strict: debug
});