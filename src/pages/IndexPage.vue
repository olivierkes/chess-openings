<template>
  <q-page class="row">
    <div class="col-12">
      <q-card>
        <q-card-section>
          <chess-board
            :orientation="orientation"
            :game="game"
            @onMove="onMove"
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
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, reactive } from "vue";
import { Chess } from "chess.js";

export default defineComponent({
  name: "IndexPage",
  setup() {
    const orientation = ref("white");
    const game = new Chess();

    const switchOrientation = () => {
      orientation.value = orientation.value === "white" ? "black" : "white";
    };
    const reset = () => {
      game.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    };

    const onMove = (v) => {
      console.log(game.fen());
      console.log(game.history());
    };

    const shapes = reactive([]); // { orig: "a1", dest: "h8", brush: "red" }

    const level = ref("arrows");

    const openings = {
      name: "Pion du roi",
      play: "e4",
      moves: [
        {
          c5: {
            play: "Kf3",
            moves: [
              {
                d6: {
                  play: "d4",
                  moves: [
                    {
                      cxd4: { play: "Kxd4", moves: [{ Kf6: { play: "Kc3" } }] },
                      Kf6: { play: "Kc3", moves: [{ cxd4: { play: "Kxd4" } }] },
                    },
                  ],
                },
              },
              {
                Kc6: {
                  play: "d4",
                  moves: [
                    {
                      cxd4: {
                        play: "Kxd4",
                        moves: [
                          { Kf6: { play: "Kc3" } },
                          { g6: { play: "Kc3" } },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                e6: {
                  play: "d4",
                  moves: [
                    {
                      cxd4: {
                        play: "Kxd4",
                        moves: [
                          {
                            a6: { play: "Bd3" },
                            Kc6: { play: "Kc3" },
                            Kf6: { play: "Kc3" },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          e5: {
            play: "Kf3",
            moves: [
              {
                Kc6: {
                  play: "Bb5",
                  moves: [{ a6: { play: "Ba4" }, Kf6: { play: "O-O" } }],
                },
                Kf6: {
                  play: "Kxe5",
                  moves: [
                    { d6: { play: "Kf3", moves: [{ Kxe4: { play: "d4" } }] } },
                  ],
                },
                d6: { play: "d4" },
              },
            ],
          },
        },
        {
          e6: {
            play: "d4",
            moves: [
              {
                d5: {
                  play: "Kc3",
                  moves: [{ Bb4: { play: "e5" } }, { Kf6: { play: "e5" } }],
                },
              },
            ],
          },
        },
      ],
    };

    return {
      orientation,
      switchOrientation,
      reset,
      game,
      onMove,
      shapes,
      level,
    };
  },
});
</script>
