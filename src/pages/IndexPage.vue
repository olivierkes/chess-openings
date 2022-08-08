<template>
  <q-page class="row">
    <div class="col-12">
      <q-card>
        <q-card-section>
          <chess-board
            :orientation="orientation"
            :game="game"
            @onMove="onMove"
          />
        </q-card-section>
      </q-card>
    </div>
    <div class="col-12">
      <q-btn @click="switchOrientation" :label="orientation"></q-btn>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { Chess } from "chess.js";

export default defineComponent({
  name: "IndexPage",
  setup() {
    const orientation = ref("white");
    const fen = ref("");
    const game = new Chess();
    game.load("7k/5ppp/8/8/8/8/8/R7 b - - 0 11");

    const switchOrientation = () => {
      orientation.value = orientation.value === "white" ? "black" : "white";
      console.log("Switching");
      console.log(game.fen());
    };

    const onMove = (v) => {
      console.log(game.fen());
    };

    return { orientation, switchOrientation, fen, game, onMove };
  },
});
</script>
