import { defineStore } from "pinia";
import { LocalStorage, TouchRepeat } from "quasar";
import axios from "axios";
import { generateCodeFrame } from "vue/compiler-sfc";
import { Chess } from "chess.js";

const URL = `https://explorer.lichess.ovh/masters?fen=%FEN%`;

const game = new Chess();

export const useLichess = defineStore("lichess", {
  state: () => ({
    loading: false,
    positions: {},
    counter: 1,
    minMovePercentage: 10, // The minimum number of parties in which a moved is used to be considered
  }),

  getters: {
    totalMoves: (state) => (fen) =>
      state.positions[fen].moves.reduce(
        (a, b) => a + (b.white + b.black + b.draws),
        0
      ),
    moves(state) {
      return (fen) => {
        // Check if position is in cach
        if (!state.positions[fen]) return [];
        var moves = state.positions[fen].moves || [];
        moves = moves.map((m) => {
          var t = m["white"] + m["black"] + m["draws"];

          return {
            san: m.san,
            white: (m.white / t) * 100,
            draws: (m.draws / t) * 100,
            black: (m.black / t) * 100,
            total: t * 100,
            name: this.moveName(fen, m.san),
            percentage: (t / this.totalMoves(fen)) * 100,
          };
        });
        return moves;
      };
    },
    filteredMoves(state) {
      return (fen) =>
        this.moves(fen).filter((m) => m.percentage > state.minMovePercentage);
    },
    moveName(state) {
      return (fen, san) => {
        game.load(fen);
        game.move(san);
        const fen2 = game.fen();
        if (LocalStorage.has(fen2))
          // Not sure why I have to do that, but seems to work
          this.positions[fen2] = LocalStorage.getItem(fen2);
        var name = "";
        if (state.positions[fen2] && state.positions[fen2].opening)
          name = state.positions[fen2].opening.name;
        console.log("Getting move name", san, name);
        return name;
      };
    },
  },

  actions: {
    async fetch(fen) {
      this.loading = true;
      var p;
      var url = URL.replace("%FEN%", fen);
      if (LocalStorage.has(fen)) {
        p = LocalStorage.getItem(fen);
      } else {
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
