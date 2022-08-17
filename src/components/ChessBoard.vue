<template>
  <div class="blue merida full-width" ref="container">
    <div ref="board" :style="heatmap ? 'background-image: none' : ''"></div>
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
import { _ } from "lodash";

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
    heatmap: {
      type: Boolean,
      default: false,
    },
    attack: {
      type: Boolean,
      default: false,
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
    watch(
      () => props.attack,
      () => setBoard()
    );
    watch(
      () => props.heatmap,
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
      // Threat
      const threat = countThreat();
      if (props.attack || props.heatmap)
        ground.setAutoShapes(
          Object.keys(threat).map((square) => ({
            orig: square,
            customSvg: threatSVG(threat[square]),
          }))
        );
      else ground.setAutoShapes([]);
      ctx.emit("afterMove");
    };
    const setShapes = () => {
      ground.setShapes(props.shapes);
      // ground.redrawAll();
    };

    // Threat
    var threatCache = {};
    const countThreat = () => {
      if (props.fen in threatCache) return threatCache[props.fen];
      var threat = {};
      const fenOtherSide =
        props.fen.search(" w ") > 0
          ? props.fen.replace(/ w .*/, " b - - 0 1")
          : props.fen.replace(/ b .*/, " w - - 0 2");

      const moves = game.moves({ verbose: true });
      var game2 = new Chess(fenOtherSide);
      const moves2 = game2.moves({ verbose: true });
      var game3 = new Chess(props.fen);
      var game4 = new Chess(fenOtherSide);
      var moves3 = [];
      var moves4 = [];

      "abcdefgh".split("").forEach((cx) =>
        [1, 2, 3, 4, 5, 6, 7, 8].forEach((cy) => {
          var square = `${cx}${cy}`;
          var piece = game.get(square);
          // Replace piece by opposite piece to count defenders
          moves3 = [];
          moves4 = [];
          if (!piece || piece.type != "k") {
            game3.load(props.fen);
            game3.remove(square);
            game3.put(
              { type: "q", color: game3.turn() == "w" ? "b" : "w" },
              square
            );
            try {
              moves3 = game3.moves({ verbose: true });
            } catch (error) {
              console.log(error);
              console.log("SQUARE:", square);
            }
            game4.load(fenOtherSide);
            game4.remove(square);
            game4.put(
              { type: "q", color: game4.turn() == "b" ? "w" : "b" },
              square
            );
            try {
              moves4 = game4.moves({ verbose: true });
            } catch (error) {
              console.log(error);
              console.log("SQUARE:", square);
            }
          }
          if (piece) {
            var a =
              moves.filter((m) => m.to == square && m.color != piece.color)
                .length +
              moves2.filter((m) => m.to == square && m.color != piece.color)
                .length;
            var b =
              moves3.filter((m) => m.to == square && m.color == piece.color)
                .length +
              moves4.filter((m) => m.to == square && m.color == piece.color)
                .length;
            if (piece.color == "w")
              threat[square] = { attackers: a, defenders: b };
            else threat[square] = { attackers: b, defenders: a };
          } else {
            // Legal moves
            // var a = moves3.filter((m) => m.to == square).length;
            // var b = moves4.filter((m) => m.to == square).length;

            // Possible caputes
            var a = moves3.filter(
              (m) => m.to == square && m.color == game3.turn()
            ).length;
            var b = moves4.filter(
              (m) => m.to == square && m.color == game4.turn()
            ).length;
            if (game.turn() == "w") threat[square] = { white: b, black: a };
            else threat[square] = { white: a, black: b };
          }
        })
      );

      threatCache[props.fen] = threat;
      return threat;
    };
    const threatSVG = (square) => {
      var svg = `<g transform="">`;
      // const WIDTH = 12;
      // const SPACE = 5;
      // for (var i = 0; i < threat; i++)
      //   // Threat
      //   svg += `<circle style="fill:#900" cx="${
      //     50 + (-threat / 2 + 0.5 + i) * (WIDTH + SPACE)
      //   }" cy="${WIDTH / 2}" r="${WIDTH / 2}" />`;
      // for (var i = 0; i < support; i++)
      //   //  Support
      //   svg += `<circle style="fill:#090" cx="${
      //     50 + (-support / 2 + 0.5 + i) * (WIDTH + SPACE)
      //   }" cy="${100 - WIDTH / 2}" r="${WIDTH / 2}" />`;
      if (props.heatmap) {
        if (square.black !== undefined || square.white !== undefined) {
          svg += `<rect fill="#fff" x="0" y="0" width="100" height="100" />`;
          var score = square.black - square.white;
          var t = "047aefff"[Math.abs(score) || square.black];
          // var t = "a97530"[Math.abs(score)];
          var red = ["", "#ffaaaa", "#ff5555", "#ff0000", "#aa0000", "#550000"][
            Math.abs(score)
          ];
          var green = [
            "",
            "#b3ff80",
            "#99ff55",
            "#66ff00",
            "#44aa00",
            "#225500",
          ][Math.abs(score)];
          // Filled square
          if (score > 0)
            svg += `<rect fill="#090${t}" x="0" y="0" width="100" height="100" />`;
          else if (score < 0)
            svg += `<rect fill="#900${t}" x="0" y="0" width="100" height="100" />`;
          else {
            svg += `<rect fill="#009${t}" x="0" y="0" width="100" height="100" />`;
          }

          // // Border transparency
          // if (score > 0)
          //   svg += `<rect fill="#0000" style="stroke-width:20; stroke:${green};" x="0" y="0" width="100" height="100" />`;
          // else if (score < 0)
          //   svg += `<rect fill="#0000" style="stroke-width:20; stroke:${red};" x="0" y="0" width="100" height="100" />`;

          // // Border width
          // if (score > 0)
          //   svg += `<rect fill="#0000" style="stroke-width:${
          //     5 + 5 * score
          //   }; stroke:#070b;" x="0" y="0" width="100" height="100" />`;
          // else if (score < 0)
          //   svg += `<rect fill="#0000" style="stroke-width:${
          //     5 - 5 * score
          //   }; stroke:#7009;" x="0" y="0" width="100" height="100" />`;

          // Display numbers
          if (square.white) {
            // svg += `<rect style="fill:#f88" x="0" y="0" width="30" height="30" />`;
            svg += `<text style="fill:#808; font-size:20" x="10" y="20" >${square.white}</text>`;
          }
          if (square.black) {
            // svg += `<rect style="fill:#9f9" x="70" y="70" width="30" height="30" />`;
            svg += `<text style="fill:#090; font-size:20" x="80" y="90" >${square.black}</text>`;
          }
        }
      }
      // Color squares
      if (props.attack) {
        if (square.attackers)
          svg += `<circle style="fill:#880000" cx="15" cy="15" r="15" />
            <text style="fill:#fff; font-size:20" x="10" y="20" >${square.attackers}</text>`;
        if (square.defenders)
          svg += `<circle style="fill:#009900" cx="85" cy="85" r="15" />
            <text style="fill:#fff; font-size:20" x="80" y="90" >${square.defenders}</text>`;
      }
      svg += `</g>`;
      return svg;
    };

    const afterMove = (from, to, metadata) => {
      ctx.emit("afterMove", from, to, metadata);
      // Calling setBoard in case after the signal afterMove game state changes
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

<style>
@import "assets/chessground/chessground.css";
@import "assets/chessground/theme.css";

.cg-wrap {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;
  display: block;
}

.cg-shapes,
.move-dest {
  z-index: 10 !important;
}
</style>
