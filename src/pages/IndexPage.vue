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
            :class="
              k == 0
                ? 'bg-green'
                : v.san == game.history().slice(-1)
                ? 'bg-orange'
                : 'bg-grey'
            "
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
          <div class="text-h6">
            {{ lichess.positions[fen].opening.name }}
          </div>
        </q-card-section>
        <!-- Games -->
        <q-list v-if="game.history().length == 0">
          <q-item
            clickable
            v-for="(m, i) in possibleMoves"
            :key="i"
            @mouseover="hover = m.san"
            @mouseleave="hover = ''"
            @click="afterMove(m.from, m.to)"
            class="bg-green"
          >
            <!-- Avatar -->
            <q-item-section avatar>
              <q-avatar class="bg-white">
                <q-icon name="play_arrow" round></q-icon>
              </q-avatar>
            </q-item-section>

            <!-- Percentage -->
            <q-item-section>
              <!-- Name -->
              <q-item-label v-if="m.name" class="text-h5">
                <q-icon :name="iconName(m.piece)"></q-icon> {{ m.name }}
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
            </q-item-section>

            <!-- Win -->
            <q-item-section avatar>
              <Doughnut
                :width="80"
                :chartData="{
                  datasets: [
                    {
                      data: [m.percentage, 100 - m.percentage],
                      borderWidth: 0,
                      backgroundColor: ['green', 'transparent'],
                      cutout: '30%',
                    },
                    {
                      data: [m.white, m.draws, m.black],
                      borderWidth: 0,
                      backgroundColor: ['white', 'grey', 'black'],
                      cutout: '0',
                      radius: '130%',
                    },
                  ],
                }"
              />
            </q-item-section>
          </q-item>
        </q-list>
        <!-- Moves -->
        <q-list v-if="lichess.positions[fen] && game.history().length > 0">
          <q-item
            clickable
            v-for="(m, i) in possibleMoves"
            :key="i"
            @mouseover="hover = m.san"
            @mouseleave="hover = ''"
            @click="afterMove(m.from, m.to)"
          >
            <!-- Avatar -->
            <q-item-section avatar>
              <q-avatar color="blue text-white">{{ m.san }}</q-avatar>
            </q-item-section>

            <!-- Percentage -->
            <q-item-section>
              <!-- Name -->
              <q-item-label v-if="m.name">
                <q-icon :name="iconName(m.piece)"></q-icon> {{ m.name }}
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
            <q-item-section avatar>
              <Doughnut
                :width="60"
                :chartData="{
                  datasets: [
                    {
                      data: [m.percentage, 100 - m.percentage],
                      borderWidth: 0,
                      backgroundColor: ['green', 'transparent'],
                      cutout: '30%',
                    },
                    {
                      data: [m.white, m.draws, m.black],
                      borderWidth: 0,
                      backgroundColor: ['white', 'grey', 'black'],
                      cutout: '0',
                      radius: '130%',
                    },
                  ],
                }"
              />
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
import { _ } from "lodash";

import { Chart, registerables } from "chart.js";
import { Doughnut } from "vue-chartjs";
Chart.register(...registerables);
// Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.interaction.events = [];

export default defineComponent({
  name: "IndexPage",
  components: { Doughnut },
  setup() {
    const orientation = ref("w");
    const game = reactive(new Chess());
    const fen = ref(game.fen());

    // OPTIONS
    const level = ref("arrows"); // Difficulty: 'arrows' (easy, shows arrows), 'circles' (medium, show circles), 'none' (hard, shows nothing)
    const playing = ref("w"); // Player color
    const variants = ref(1); // number of player color moves to be accepted. 1 is only the most popular.
    const depth = ref(5); // number of turns to play

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
      // Nothing happens because this is called a second time probably
      if (!from || !to) return;
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

      // Game logic
    };

    const iconName = (name) =>
      ({
        b: "fa-solid fa-chess-bishop",
        n: "fa-solid fa-chess-knight",
        r: "fa-solid fa-chess-rook",
        q: "fa-solid fa-chess-queen",
        k: "fa-solid fa-chess-king",
        p: "fa-solid fa-chess-pawn",
      }[name]);

    const history = ref([]);
    const historyIcons = computed(() => {
      return history.value.map((k) => {
        var h = {
          san: k.san,
          icon: iconName(k.piece),
          color: k.color == "w" ? "white" : "black",
        };
        if (["k", "q"].includes(k.flags)) h.icon = "fa-solid fa-chess";
        return h;
      });
    });
    const restoreHistory = (i) => {
      var g = new Chess();
      for (var k = 0; k <= i; k++) {
        g.move(history.value[k]);
      }
      fen.value = g.fen();
      game.load_pgn(g.pgn());
    };

    // Possible Moves
    const possibleMoves = computed(() => {
      var moves = game.moves({ verbose: true });
      var filteredMoves = lichess.filteredMoves(fen.value);
      var san = filteredMoves.map((m) => m.san);
      moves = moves.filter((m) => san.includes(m.san));
      moves.forEach((move) => {
        Object.assign(
          move,
          filteredMoves.find((m) => m.san == move.san),
          { turn: game.history().length }
        );
      });
      // Sort by percentage
      moves = moves.sort((a, b) => b.percentage - a.percentage);
      // Prefetch those moves
      moves.forEach((m) => {
        const g = new Chess();
        g.load(fen.value);
        g.move(m.san);
        getPosition(g.fen());
      });
      // If playing color, keep only 'variants' moves
      if (game.turn() == playing.value) moves = moves.slice(0, variants.value);
      // return moves
      return moves;
    });

    const lastPossibleMoves = ref([]);
    watch(possibleMoves, (newValue, oldValue) => {
      console.log(oldValue, newValue);
      if (!_.isEqual(newValue, oldValue)) lastPossibleMoves.value = oldValue;
    });

    // Shapes
    // { orig: "a1", dest: "h8", brush: "red" }
    const shapes = computed(() => {
      // function that returns 'yellow' if the move is hovered on the list, or 'green' if playing, else 'red'
      const color = (san) =>
        san == hover.value
          ? "yellow"
          : game.turn() == playing.value
          ? "green"
          : "red";
      var shapes = [];

      // Level = none: no shapes
      if (level.value == "none") return shapes;
      // Possible moves
      else if (level.value == "circles")
        shapes = possibleMoves.value.map((m) => ({
          orig: m.from,
          brush: color(m.san),
        }));
      else
        shapes = possibleMoves.value.map((m) => ({
          orig: m.from,
          dest: m.to,
          brush: color(m.san),
        }));

      // Last moves
      if (game.history().length > 0) {
        var m = game.history({ verbose: true }).slice(-1)[0];
        if (level.value == "arrows") {
          shapes.push({
            orig: m.from,
            dest: m.to,
            brush: m.color == playing.value ? "paleGreen" : "paleRed",
          });
        } else {
          shapes.push({
            orig: m.to,
            brush: m.color == playing.value ? "paleGreen" : "paleRed",
          });
        }
        // Show the other pieces that might have moved
        if (game.turn() == playing.value && level.value == "arrows")
          lastPossibleMoves.value.forEach((m) =>
            shapes.push({
              orig: m.from,
              brush: "paleRed",
            })
          );
      }

      return shapes;
      // brushes: {
      //   green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
      //   red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
      //   blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
      //   yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
      //   paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
      //   paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
      //   paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
    });

    // UI
    const showOptions = ref(false);
    const hover = ref(""); // move hovered on the list

    // Change orientation upon changing playing color
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
      hover,
      iconName,
    };
  },
});
</script>
