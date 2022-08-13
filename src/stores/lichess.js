import { defineStore } from "pinia";
import { LocalStorage, TouchRepeat } from "quasar";
import axios from "axios";
import { generateCodeFrame } from "vue/compiler-sfc";
import { Chess } from "chess.js";
import { startCase } from "lodash";

const URL = `https://explorer.lichess.ovh/masters?fen=%FEN%`;

const game = new Chess();

export const useLichess = defineStore("lichess", {
  state: () => ({
    loading: false,
    positions: {},
    counter: 1,
    // caches
    movesCache: {},
  }),

  getters: {
    totalMoves: (state) => (fen) =>
      state.positions[fen].moves.reduce(
        (a, b) => a + (b.white + b.black + b.draws),
        0
      ),
    moves(state) {
      return (fen) => {
        // Check if position is stored
        if (!state.positions[fen]) return [];

        // Check if position is cached
        if (fen in state.movesCache) {
          return state.movesCache[fen];
        }

        var moves = state.positions[fen].moves || [];

        moves = moves.map((m) => {
          var t = m["white"] + m["black"] + m["draws"];

          return {
            san: m.san,
            white: (m.white / t) * 100,
            draws: (m.draws / t) * 100,
            black: (m.black / t) * 100,
            total: t,
            name: this.moveName(fen, m.san),
            percentage: (t / this.totalMoves(fen)) * 100,
          };
        });

        // Filtered rarely played moves
        moves = moves.filter((m) => m.total >= 50);

        // Store in cache if all the names are resolved
        if (moves.every((m) => m.name != false)) state.movesCache[fen] = moves;

        return moves;
      };
    },
    filteredMoves(state) {
      return (fen, minMovePercentage) =>
        this.moves(fen).filter((m) => m.percentage > minMovePercentage);
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
        if (state.positions[fen2])
          return state.positions[fen2].opening
            ? state.positions[fen2].opening.name
            : "";
        else return false;
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
