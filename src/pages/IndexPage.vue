<template>
  <q-page class="row">
    <div class="col-12">
      <q-card>
        <q-card-section>
          <chess-board
            :orientation="orientation"
            :fen="fen"
            @afterMove="afterMove"
            :shapes="shapes"
          />
        </q-card-section>
        <q-card-section>
          <q-btn flat @click="switchOrientation" icon="cached"></q-btn>
          <q-btn flat @click="reset" icon="first_page"></q-btn>
          <q-btn-toggle
            v-model="level"
            :options="[
              { label: 'Arrows', value: 'arrows', icon: 'arrow_forward' },
              { label: 'Circle', value: 'circles', icon: 'circle' },
              { label: 'None', value: 'none', icon: 'block' },
            ]"
          />
        </q-card-section>
        <q-card-section>
          <q-chip
            v-for="(v, k) in historyIcons"
            :key="k"
            clickable
            class="bg-grey"
            square
            @click="restoreHistory(k)"
          >
            <q-avatar>
              <q-icon :name="v.icon" size="1.5em" right :color="v.color" />
            </q-avatar>
            {{ v.san }}
          </q-chip>
          {{ loading }}
          <hr />
          {{ lichess.positions[fen] }}
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive, computed, watch } from "vue";
import { Chess } from "chess.js";
import { useLichess } from "stores/lichess";

import kingspawn from "assets/openings/kings-pawn.json";

export default defineComponent({
  name: "IndexPage",
  setup() {
    const orientation = ref("white");
    const game = reactive(new Chess());
    const fen = ref(game.fen());

    // LICHESS
    const lichess = useLichess();
    const loading = lichess.loading;
    const getPosition = (fen) => lichess.fetch(fen);
    getPosition(fen.value);
    watch(fen, () => getPosition(fen.value));

    const switchOrientation = () => {
      orientation.value = orientation.value === "white" ? "black" : "white";
    };
    const reset = () => {
      fen.value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      game.load(fen.value);
    };

    const afterMove = (from, to, metadata) => {
      var m = game.move({ from: from, to: to });
      if (!m) {
        // If m is null the move was not valid
        // Let's assume it was a promotion
        game.move({
          from: from,
          to: to,
          promotion: "q",
        });
      }
      fen.value = game.fen();
      history.value = game.history({ verbose: true });
    };

    const history = ref([]);
    const historyIcons = computed(() => {
      return history.value.map((k) => {
        var h = {
          san: k.san,
          icon: {
            b: "fa-solid fa-chess-bishop",
            n: "fa-solid fa-chess-knight",
            r: "fa-solid fa-chess-rook",
            q: "fa-solid fa-chess-queen",
            k: "fa-solid fa-chess-king",
            p: "fa-solid fa-chess-pawn",
          }[k.piece],
          color: k.color == "w" ? "white" : "black",
        };
        if (["k", "q"].includes(k.flags)) h.icon = "fa-solid fa-chess";
        return h;
      });
    });
    const restoreHistory = (i) => {
      var g = new Chess();
      for (var k = 0; k < i; k++) {
        g.move(history.value[k]);
      }
      fen.value = g.fen();
      game.load_pgn(g.pgn());
    };

    const shapes = reactive([]); // { orig: "a1", dest: "h8", brush: "red" }

    const level = ref("arrows");

    return {
      orientation,
      switchOrientation,
      reset,
      game,
      afterMove,
      shapes,
      level,
      fen,
      history,
      historyIcons,
      restoreHistory,
      loading,
      lichess,
    };
  },
});
</script>
