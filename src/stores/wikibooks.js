import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import axios from "axios";

const URL = `https://en.wikibooks.org/w/api.php?action=parse&disabletoc=1&disableeditsection=1&sectionpreview=1&format=json&origin=*&page=%PAGE%`;

export const useWB = defineStore("wikibooks", {
  state: () => ({
    pages: {},
    loading: false,
  }),

  getters: {
    doubleCount(state) {
      return state.counter * 2;
    },
  },

  actions: {
    async getPage(move, force = false) {
      this.loading = true;
      var p;
      var url = URL.replace("%PAGE%", move);
      if (!force && move in this.pages) {
        return this.pages[move];
      } else {
        const data = await axios.get(url);
        p = data.data;
        this.pages[move] = p;
      }
      this.loading = false;
      return p;
    },
  },
});
