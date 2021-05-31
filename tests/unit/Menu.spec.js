import { shallowMount } from "@vue/test-utils";
import Menu from "@/components/Menu.vue";

describe("HelloWorld.vue", () => {
  it("renders props.msg when passed", () => {
    const msg = "Ingresa una dirección";
    const wrapper = shallowMount(Menu);
    expect(wrapper.text()).toMatch(msg);
  });
});
