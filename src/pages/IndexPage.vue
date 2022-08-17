<template>
  <q-page class="">
    <div class="">
      <q-card class="" flat>
        <chess-board
          :orientation="orientation"
          :fen="fen"
          @afterMove="move"
          :shapes="shapes"
          :attack="attack"
          :heatmap="heatmap"
        />
        <q-linear-progress
          animation-speed="500"
          :value="turnPlayed / depth"
          size="8px"
          :color="errors ? 'orange' : 'green'"
        />
        <div class="row">
          <q-btn
            size="sm"
            dense
            flat
            @click="restart"
            icon="first_page"
          ></q-btn>
          <q-btn
            size="sm"
            dense
            flat
            icon="navigate_before"
            @click="restoreHistory(game.history().length - 2)"
            :disable="game.history().length < 2"
          ></q-btn>
          <q-btn
            size="sm"
            flat
            dense
            icon="navigate_next"
            @click="restoreHistory(game.history().length)"
            :disable="game.history().length >= history.length"
          ></q-btn>
          <q-btn
            size="sm"
            flat
            dense
            icon="last_page"
            @click="restoreHistory(history.length)"
            :disable="game.history().length >= history.length"
          ></q-btn>
          <q-space />
          <q-btn dense size="sm" flat @click="attack = !attack" icon="pattern">
            <q-tooltip>Show number of attackers and defenders</q-tooltip>
          </q-btn>
          <q-btn dense size="sm" flat @click="switchOrientation" icon="cached">
            <q-tooltip>Switch side</q-tooltip>
          </q-btn>
          <q-btn
            dense
            size="sm"
            flat
            @click="heatmap = !heatmap"
            icon="grid_view"
          >
            <q-tooltip>Show attack heatmap</q-tooltip>
          </q-btn>
          <q-space />
          <q-btn
            dense
            size="sm"
            flat
            v-if="game.history().length"
            :color="showList ? 'primary' : 'black'"
            @click="showList = !showList"
            icon="format_list_bulleted"
          >
            <q-tooltip>Show move list</q-tooltip>
          </q-btn>
          <q-btn
            dense
            size="sm"
            flat
            v-if="history.length"
            :color="showHistory ? 'primary' : 'black'"
            @click="showHistory = !showHistory"
            icon="history"
          >
            <q-tooltip>Show history</q-tooltip>
          </q-btn>
          <q-btn
            dense
            size="sm"
            flat
            :icon="
              {
                arrows: 'arrow_forward',
                circles: 'radio_button_unchecked',
                none: 'block',
              }[level]
            "
          >
            <q-menu auto-close anchor="center left" self="center right">
              <q-list>
                <q-item-label header overline>Difficulty</q-item-label>
                <q-item clickable flat @click="level = 'arrows'">
                  <q-item-section avatar>
                    <q-icon
                      name="arrow_forward"
                      :color="level == 'arrows' ? 'primary' : 'black'"
                    ></q-icon>
                  </q-item-section>
                  <q-item-section>Show full move</q-item-section>
                </q-item>
                <q-item clickable flat @click="level = 'circles'">
                  <q-item-section avatar>
                    <q-icon
                      name="radio_button_unchecked"
                      :color="level == 'circles' ? 'primary' : 'black'"
                    ></q-icon>
                  </q-item-section>
                  <q-item-section>Hint piece</q-item-section>
                </q-item>
                <q-item flat clickable @click="level = 'none'">
                  <q-item-section avatar>
                    <q-icon
                      name="block"
                      :color="level == 'none' ? 'primary' : 'black'"
                    ></q-icon>
                  </q-item-section>
                  <q-item-section>Show nothing</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <!-- History -->
        <div class="q-pa-xs" v-if="showHistory">
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
      <!-- You won ! -->
      <q-card
        v-if="turnPlayed >= depth"
        :class="'q-ma-xs ' + (errors ? 'bg-orange' : 'bg-green')"
        square
      >
        <q-card-section>
          <div>
            <q-btn
              flat
              class="float-right"
              icon="restart_alt"
              @click="restart"
              :label="errors ? 'Try again' : 'Restart'"
            />
            <div class="text-h6">
              <q-icon name="star" size="md" v-if="errors == 0"></q-icon>
              Congratulations !
            </div>
            <div v-if="errors == 0">You won !</div>
            <div v-else>
              You finished, but you made {{ errors }} mistake{{
                errors > 1 ? "s" : ""
              }}.
            </div>
          </div>
        </q-card-section>
      </q-card>
      <!-- Options  -->
      <q-dialog v-model="ui.showOptions">
        <q-card flat v-if="ui.showOptions">
          <q-card-section class="row items-center q-gutter-md">
            <!-- Player color -->
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
            <!-- Level -->
            <div class="text-caption col-3">Assistance</div>
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
                {
                  label: 'Circle',
                  value: 'circles',
                  icon: 'radio_button_unchecked',
                },
                { label: 'None', value: 'none', icon: 'block' },
              ]"
            />
            <!-- Move percentage -->
            <div class="text-caption col-3">
              Only use moves played more than x% of the time.
            </div>
            <q-slider
              v-model="minMovePercentage"
              class="col-6"
              :min="0"
              :max="50"
              label
              :label-value="minMovePercentage + '%'"
            />
            <div class="text-caption col-1">{{ minMovePercentage }}%</div>
            <!-- Depth -->
            <div class="text-caption col-3">
              Number of moves to play (depth)
            </div>
            <q-slider v-model="depth" class="col-6" :min="1" :max="15" label />
            <div class="text-caption col-1">
              {{ depth }}
            </div>
            <!-- Timer -->
            <q-checkbox v-model="ui.autoplay" class="col-1" />
            <div class="text-caption col-2">Autoplay</div>
            <q-slider
              v-model="timeout"
              class="col-6"
              :min="0"
              :max="5000"
              :step="100"
              :disable="!ui.autoplay"
            />
            <div class="text-caption col-1 disabled">
              {{ timeout + "ms" }}
            </div>
            <!-- Variants -->
            <div class="text-caption col-3">Number of variant to learn</div>
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
                { label: 'All', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
              ]"
            />
            <q-btn
              class="col-6 offset-3"
              label="Restore defaults"
              flat
              icon="settings_backup_restore"
              color="grey"
              @click="restoreSettings"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-card square :flat="!showList" class="">
        <q-inner-loading :showing="loading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
        <!-- Name -->
        <q-card-section
          class="bg-primary text-white q-pa-sm col row items-center no-wrap"
          v-if="game.history().length"
        >
          <div class="col">
            <span
              v-if="lichess.positions[fen] && lichess.positions[fen].opening"
            >
              {{ lichess.positions[fen].opening.name }}
            </span>
          </div>
          <q-btn
            flat
            class="col-auto"
            :icon="showWikiBooks ? 'close' : 'menu_book'"
            @click="showWikiBooks = !showWikiBooks"
          >
            <q-tooltip>Show info from Wikibooks</q-tooltip>
          </q-btn>
        </q-card-section>
        <!-- WIKIBOOKS -->
        <q-card-section v-if="showWikiBooks" class="q-pa-sm">
          <wiki-books :history="game.history()"></wiki-books>
        </q-card-section>
        <!-- Games -->
        <q-list v-if="historyIcons.length == 0" separator>
          <q-item
            clickable
            v-for="(m, i) in possibleMoves"
            :key="i"
            @mouseover="hover = m.san"
            @mouseleave="hover = ''"
            @click="move(m.from, m.to)"
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
                {{ k(m.total) }} parties
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
        <q-list
          separator
          v-if="showList && lichess.positions[fen] && game.history().length > 0"
        >
          <q-separator />
          <q-item
            clickable
            v-for="(m, i) in possibleMoves"
            :key="i"
            @mouseover="hover = m.san"
            @mouseleave="hover = ''"
            @click="move(m.from, m.to)"
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
              <q-item-label caption> {{ k(m.total) }} parties </q-item-label>
              <q-item-label caption class="full-width">
                <div
                  class="bg-green-10 float-left text-center text-white q-mr-sm"
                  :style="{ width: m.percentage + '%' }"
                >
                  {{ m.percentage.toFixed(1) + "%" }}
                </div>
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
            <!-- <q-item-section avatar>
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
            </q-item-section> -->
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
import { useUI } from "stores/ui";
import { useWB } from "stores/wikibooks";
import { _ } from "lodash";
import { useQuasar } from "quasar";

import { Chart, registerables } from "chart.js";
import { Doughnut } from "vue-chartjs";
Chart.register(...registerables);
// Chart.defaults.plugins.tooltip.enabled = false;
Chart.defaults.interaction.events = [];

export default defineComponent({
  name: "IndexPage",
  components: { Doughnut },
  setup() {
    // Quasar
    const $q = useQuasar();

    // GAME
    const orientation = ref("w");
    const game = reactive(new Chess());
    const fen = ref(game.fen());
    const errors = ref(0);

    // OPTIONS
    const level = ref("arrows"); // Difficulty: 'arrows' (easy, shows arrows), 'circles' (medium, show circles), 'none' (hard, shows nothing)
    const playing = ref("w"); // Player color
    const variants = ref(1); // number of player color moves to be accepted. 1 is only the most popular.
    const depth = ref(6); // number of turns to play
    const timeout = ref(1000); // ms to wait before computer playing
    const minMovePercentage = ref(10); // The minimum number of parties in which a moved is used to be considered
    const showWikiBooks = ref(false);
    const heatmap = ref(true); // Show heatmap
    const attack = ref(true); // Show attack and defends

    // UI
    const ui = useUI();
    const hover = ref(""); // move hovered on the list
    const showList = ref(false); // showing the list of moves
    const showHistory = ref(false); // showing history
    const turnPlayed = ref(0);

    // LICHESS
    const lichess = useLichess();
    const loading = lichess.loading;
    const getPosition = (fen) => lichess.fetch(fen);
    getPosition(fen.value);
    watch(fen, () => getPosition(fen.value));

    // WIKIBOOKS
    const WB = useWB();

    // TOOLS
    const switchOrientation = () => {
      orientation.value = orientation.value === "w" ? "b" : "w";
    };
    const restart = () => {
      // Hide Wikibooks
      showWikiBooks.value = false;
      var g = new Chess();
      game.load(g.fen());
      fen.value = game.fen();
      history.value = game.history({ verbose: true });
      turnPlayed.value = 0;
      errors.value = 0;
    };

    const move = (from, to, metadata) => {
      // Nothing happens because this is called a second time probably
      if (!from || !to) return;

      // Hide Wikibooks
      showWikiBooks.value = false;

      // Is it a valid move ?
      if (!possibleMoves.value.find((m) => m.from == from && m.to == to)) {
        if (playing.value != game.turn()) return;
        else {
          console.log("ERROR");
          errors.value += 1;
          return;
        }
      }

      // Making the move
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

      // Play computer
      if (game.turn() != playing.value) {
        if (ui.autoplay) {
          var m = _.sample(possibleMoves.value);
          setTimeout(() => move(m.from, m.to), timeout.value);
        }
      }

      // Won ?
      turnPlayed.value = Math.floor(
        (game.history().length - (playing.value == "w" ? 1 : 0)) / 2
      );
      if (playing.value == game.turn() && depth.value == turnPlayed.value) {
        console.log("YOU WIN");
      }
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
      // Hide Wikibooks
      showWikiBooks.value = false;
      // Resore game
      fen.value = g.fen();
      game.load_pgn(g.pgn());
    };

    // Possible Moves
    const possibleMoves = computed(() => {
      var moves = game.moves({ verbose: true });
      var filteredMoves = lichess.filteredMoves(
        fen.value,
        minMovePercentage.value
      );
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
      if (
        game.history().length &&
        game.turn() == playing.value &&
        variants.value
      )
        moves = moves.slice(0, variants.value);

      // return moves
      return moves;
    });

    const lastPossibleMoves = ref([]);
    watch(possibleMoves, (newValue, oldValue) => {
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

    // Change orientation upon changing playing color
    watch(playing, () => (orientation.value = playing.value));

    // SAVE SETTINGS
    watch(
      [
        playing,
        level,
        variants,
        depth,
        timeout,
        minMovePercentage,
        attack,
        heatmap,
        showList,
        showHistory,
      ],
      (v) => {
        $q.localStorage.set("settings", {
          playing: playing.value,
          level: level.value,
          variants: variants.value,
          depth: depth.value,
          timeout: timeout.value,
          minMovePercentage: minMovePercentage.value,
          attack: attack.value,
          heatmap: heatmap.value,
          showList: showList.value,
          showHistory: showHistory.value,
        });
      }
    );
    const restoreSettings = () => {
      playing.value = "w";
      level.value = "arrows";
      variants.value = 1;
      depth.value = 6;
      timeout.value = 1000;
      minMovePercentage.value = 10;
      attack.value = true;
      heatmap.value = true;
      showList.value = true;
      showHistory.value = false;
    };
    const loadSettings = () => {
      if ($q.localStorage.has("settings")) {
        var s = $q.localStorage.getItem("settings");
        playing.value = s.playing;
        level.value = s.level;
        variants.value = s.variants;
        depth.value = s.depth;
        timeout.value = s.timeout;
        minMovePercentage.value = s.minMovePercentage;
        attack.value = s.attack;
        heatmap.value = s.heatmap;
        showList.value = s.showList;
        showHistory.value = s.showHistory;
      }
    };
    loadSettings();

    const k = (val) => {
      if (val > 10000000) return `${(val / 10000000).toFixed(0)}M`;
      else if (val > 1000000) return `${(val / 1000000).toFixed(1)}M`;
      else if (val > 10000) return `${(val / 10000).toFixed()}k`;
      else if (val > 1000) return `${(val / 1000).toFixed(1)}k`;
      else return val;
    };

    return {
      orientation,
      switchOrientation,
      game,
      move,
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
      depth,
      possibleMoves,
      hover,
      iconName,
      timeout,
      showList,
      restart,
      turnPlayed,
      minMovePercentage,
      restoreSettings,
      showHistory,
      ui,
      errors,
      WB,
      showWikiBooks,
      attack,
      heatmap,
      k,
    };
  },
});
</script>
