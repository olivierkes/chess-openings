import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import axios from "axios";

LocalStorage.set("test", 14);

const URL = `https://explorer.lichess.ovh/masters?fen=%FEN%`;

export const useLichess = defineStore("lichess", {
  state: () => ({
    loading: false,
    positions: {},
    counter: 1,
  }),

  getters: {},

  actions: {
    async fetch(fen) {
      var p;
      var url = URL.replace("%FEN%", fen);
      if (LocalStorage.has(fen)) {
        p = LocalStorage.getItem(fen);
      } else {
        this.loading = true;
        const data = await axios.get(url);
        LocalStorage.set(fen, data.data);
        p = data.data;
      }
      this.positions[fen] = p;
      this.loading = false;
      return p;
    },
  },
});
