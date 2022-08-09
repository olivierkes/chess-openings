<template>
  <div class="blue merida full-width" ref="container">
    <div ref="board"></div>
    {{ history }}
  </div>
</template>

<script>
/*
Reference: vue-chessboard
https://github.com/vitogit/vue-chessboard/blob/master/src/components/chessboard/index.vue
*/

import { Chessground } from "chessground";
import { Chess } from "chess.js";
import { ref, onMounted, watch, reactive } from "vue";

export default {
  name: "ChessBoard",
  props: {
    shapes: {
      type: Array,
    },
    onPromotion: {
      type: Function,
      default: () => "q",
    },
    orientation: {
      type: String,
      default: "white",
    },
    game: {
      default: new Chess(),
    },
  },
  emits: ["onMove"],
  setup(props, ctx) {
    const board = ref();
    const container = ref();
    var ground = null;

    // PROPS
    watch(
      () => props.orientation,
      () => setBoard()
    );

    const history = ref([]);
    watch(history, () => {
      console.log("HISTORY:", props.game.history());
      setBoard();
    });

    const possibleMoves = () => {
      const dests = new Map();
      props.game
        .board()
        .flat()
        .forEach((s) => {
          if (s) {
            const ms = props.game.moves({
              square: s.square,
              verbose: true,
            });
            if (ms.length)
              dests.set(
                s.square,
                ms.map((m) => m.to)
              );
          }
        });
      return dests;
    };

    const toColor = () => {
      return props.game.turn() === "w" ? "white" : "black";
    };

    const setBoard = () => {
      const config = {
        turnColor: toColor(),
        orientation: props.orientation,
        fen: props.game.fen(),
        movable: {
          color: toColor(),
          dests: possibleMoves(),
        },
      };
      ground.set(config);
      ground.setShapes(props.shapes);
      ground.redrawAll();
    };

    const afterMove = (from, to, metadata) => {
      var m = props.game.move({ from: from, to: to });
      if (!m) {
        // If m is null the move was not valid
        // Let's assume it was a promotion
        props.game.move({
          from: from,
          to: to,
          promotion: props.onPromotion(),
        });
      }
      setBoard();
      history.value = props.game.history();
      ctx.emit("onMove", props.game);
    };

    onMounted(() => {
      const config = {
        fen: props.fen,
        coordinates: true,
        movable: {
          free: false,
          events: { after: afterMove },
        },
      };
      ground = Chessground(board.value, config);
      setBoard();
      window.addEventListener("resize", onResize);
      onResize();
    });

    const width = ref(0);
    const onResize = () => {
      var w = container.value ? container.value.clientWidth : 0;
      width.value = w - 5 + "px";
    };

    return { board, container, width, history };
  },
};
</script>

<style lang="scss">
@import "assets/chessground/chessground.css";
@import "assets/chessground/theme.css";

.cg-wrap {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;
  display: block;
}
</style>
