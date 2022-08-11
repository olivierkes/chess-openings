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
      default: "w",
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
    watch(
      () => props.shapes,
      () => setBoard()
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

    const color = (color) => {
      return color === "w" ? "white" : "black";
    };

    const setBoard = () => {
      game.load(props.fen);
      const config = {
        turnColor: color(game.turn()),
        fen: props.fen,
        orientation: color(props.orientation),
        movable: {
          color: color(game.turn()),
          dests: possibleMoves(),
        },
      };
      ground.set(config);
      setShapes();
      ctx.emit("afterMove");
    };
    const setShapes = () => {
      ground.setShapes(props.shapes);
      // ground.redrawAll();
    };

    const afterMove = (from, to, metadata) => {
      ctx.emit("afterMove", from, to, metadata);
      setBoard();
    };

    onMounted(() => {
      const config = {
        fen: props.fen,
        coordinates: true,
        blockTouchScroll: true,
        movable: {
          free: false,
          events: {
            after: afterMove,
          },
        },
        events: {
          select: () => {
            setShapes();
          },
        },
        drawable: {
          eraseOnClick: false,
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
