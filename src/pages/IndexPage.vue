<template>
  <q-page class="row">
    <div class="col-12">
      <q-card class="q-ma-sm" flat>
        <chess-board
          :orientation="orientation"
          :fen="fen"
          @afterMove="afterMove"
          :shapes="shapes"
        />
        <div class="row">
          <q-btn size="sm" flat @click="reset" icon="first_page"></q-btn>
          <q-space />
          <q-btn
            size="sm"
            flat
            @click="switchOrientation"
            icon="cached"
          ></q-btn>
          <q-space />
          <q-btn
            size="sm"
            flat
            :color="showOptions ? 'primary' : 'black'"
            @click="showOptions = !showOptions"
            icon="settings"
          ></q-btn>
        </div>
        <div class="q-pa-xs">
          <q-chip
            v-for="(v, k) in historyIcons"
            :key="k"
            size="sm"
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
        </div>
      </q-card>
      <!-- Options  -->
      <q-card flat v-if="showOptions">
        <q-card-section class="row q-gutter-md">
          <div class="text-caption col-3">Playing from</div>
          <q-btn-toggle
            v-model="playing"
            unelevated
            size="sm"
            color="grey-3"
            text-color="grey-8"
            toggle-text-color="white"
            rounded
            class="col-8 q-mt-md"
            :options="[
              {
                label: 'White',
                value: 'w',
                icon: 'fa-regular fa-chess-king',
              },
              {
                label: 'Black',
                value: 'b',
                icon: 'fa-solid fa-chess-king',
              },
            ]"
          />
          <div class="text-caption col-3">Level</div>
          <q-btn-toggle
            v-model="level"
            unelevated
            size="sm"
            color="grey-3"
            text-color="grey-8"
            toggle-text-color="white"
            rounded
            class="col-8"
            :options="[
              { label: 'Arrows', value: 'arrows', icon: 'arrow_forward' },
              { label: 'Circle', value: 'circles', icon: 'circle' },
              { label: 'None', value: 'none', icon: 'block' },
            ]"
          />
          <div class="text-caption col-3">
            Learn responses to moves used over x% of the time
          </div>
          <q-slider
            v-model="lichess.minMovePercentage"
            class="col-8"
            :min="0"
            :max="50"
            label
          />
          <div class="text-caption col-3">Number of moves to learn (depth)</div>
          <q-slider v-model="depth" class="col-8" :min="0" :max="50" label />
          <div class="text-caption col-3">Variants</div>
          <q-btn-toggle
            v-model="variants"
            unelevated
            size="sm"
            color="grey-3"
            text-color="grey-8"
            toggle-text-color="white"
            rounded
            class="col-8"
            :options="[
              { label: '1', value: 1 },
              { label: '2', value: 2 },
              { label: '3', value: 3 },
              { label: '4', value: 4 },
              { label: '5', value: 5 },
            ]"
          />
        </q-card-section>
      </q-card>
      <q-card class="q-ma-md">
        <q-inner-loading :showing="loading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <!-- Name -->
        <q-card-section
          class="bg-primary text-white"
          v-if="lichess.positions[fen] && lichess.positions[fen].opening"
        >
          <div class="text-h6">{{ lichess.positions[fen].opening.name }}</div>
        </q-card-section>
        <!-- Moves -->
        <q-list v-if="lichess.positions[fen]">
          <q-item clickable v-for="(m, i) in possibleMoves" :key="i">
            <!-- Avatar -->
            <q-item-section avatar>
              <q-avatar color="blue text-white">{{ m.san }}</q-avatar>
            </q-item-section>

            <!-- Percentage -->
            <q-item-section>
              <!-- Name -->
              <q-item-label caption v-if="m.name">
                {{ m.name }}
              </q-item-label>
              <q-item-label caption class="full-width">
                <div
                  class="bg-green-10 float-left text-center text-white q-mr-sm"
                  :style="{ width: m.percentage + '%' }"
                >
                  {{ m.percentage.toFixed(1) + "%" }}
                </div>
                {{ m.total }} parties
              </q-item-label>

              <!-- Win -->
              <q-item-label caption>
                <div
                  class="bg-grey-2 float-left text-center text-grey-10"
                  :style="{ width: m.white + '%' }"
                >
                  {{ parseFloat(m.white).toFixed(1) + "%" }}
                </div>
                <div
                  class="bg-grey float-left text-center"
                  :style="{ width: m.draws + '%' }"
                >
                  {{ parseFloat(m.draws).toFixed(1) + "%" }}
                </div>
                <div
                  class="bg-grey-10 float-left text-center text-white"
                  :style="{ width: m.black + '%' }"
                >
                  {{ parseFloat(m.black).toFixed(1) + "%" }}
                </div>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
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
    const orientation = ref("w");
    const game = reactive(new Chess());
    const fen = ref(game.fen());

    // LICHESS
    const lichess = useLichess();
    const loading = lichess.loading;
    const getPosition = (fen) => lichess.fetch(fen);
    getPosition(fen.value);
    watch(fen, () => getPosition(fen.value));

    // TOOLS
    const switchOrientation = () => {
      orientation.value = orientation.value === "w" ? "b" : "w";
    };
    const reset = () => {
      fen.value = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      game.load(fen.value);
    };

    const afterMove = (from, to, metadata) => {
      var m = game.move({ from: from, to: to });
      if (!m) {
        // // If m is null the move was not valid
        // // Let's assume it was a promotion
        // game.move({
        //   from: from,
        //   to: to,
        //   promotion: "q",
        // });
        return;
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

    // GAME LOGIC
    const possibleMoves = computed(() => {
      var moves = game.moves({ verbose: true });
      var filteredMoves = lichess.filteredMoves(fen.value);
      var san = filteredMoves.map((m) => m.san);
      moves = moves.filter((m) => san.includes(m.san));
      moves.forEach((move) => {
        Object.assign(
          move,
          filteredMoves.find((m) => m.san == move.san)
        );
      });
      // Sort by percentage
      moves = moves.sort((a, b) => b.percentage - a.percentage);
      // If playing color, keep only 'variants' moves
      if (game.turn() == playing.value) moves = moves.slice(0, variants.value);
      // Prefetch those moves
      moves.forEach((m) => {
        const g = new Chess();
        g.load(fen.value);
        g.move(m.san);
        getPosition(g.fen());
      });
      // return moves
      return moves;
    });

    // { orig: "a1", dest: "h8", brush: "red" }
    const shapes = computed(() => {
      var color = game.turn() == playing.value ? "green" : "red";
      if (level.value == "none") return [];
      else if (level.value == "circles")
        return possibleMoves.value.map((m) => ({
          orig: m.from,
          brush: color,
        }));
      else
        return possibleMoves.value.map((m) => ({
          orig: m.from,
          dest: m.to,
          brush: color,
        }));
      // brushes: {
      //   green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
      //   red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
      //   blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
      //   yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
      //   paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
      //   paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
      //   paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
    });

    // OPTIONS
    const level = ref("arrows");
    const playing = ref("w");
    const variants = ref(1);
    const depth = ref(1);
    const showOptions = ref(false);

    watch(playing, () => (orientation.value = playing.value));

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
      playing,
      variants,
      showOptions,
      depth,
      possibleMoves,
    };
  },
});
</script>
