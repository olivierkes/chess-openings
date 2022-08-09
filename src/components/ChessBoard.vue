<template>
  <div class="blue merida full-width" ref="container">
    <div ref="board"></div>
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
    fen: {
      type: String,
      default: "",
    },
  },
  emits: ["afterMove"],
  setup(props, ctx) {
    const board = ref();
    const container = ref();
    const game = new Chess();
    var ground = null;

    // PROPS
    watch(
      () => props.orientation,
      () => setBoard()
    );
    watch(
      () => props.fen,
      () => {
        game.load(props.fen);
        setBoard();
      }
    );

    const possibleMoves = () => {
      const dests = new Map();
      game
        .board()
        .flat()
        .forEach((s) => {
          if (s) {
            const ms = game.moves({
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
      return game.turn() === "w" ? "white" : "black";
    };

    const setBoard = () => {
      game.load(props.fen);
      const config = {
        turnColor: toColor(),
        fen: props.fen,
        orientation: props.orientation,
        movable: {
          color: toColor(),
          dests: possibleMoves(),
        },
      };
      ground.set(config);
      ground.setShapes(props.shapes);
      ground.redrawAll();
      ctx.emit("afterMove");
    };

    const afterMove = (from, to, metadata) => {
      ctx.emit("afterMove", from, to, metadata);
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

    return { board, container, width };
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
