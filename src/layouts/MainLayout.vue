<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-bar>
        <!-- <q-toolbar-title> Chess Openings Tutor </q-toolbar-title> -->
        <q-avatar class="bg-grey-4" size="sm">
          <q-icon name="img:favicon.ico" size="xs"></q-icon>
        </q-avatar>
        <div class="col">Chess Openings Tutor</div>

        <q-toggle
          v-model="ui.autoplay"
          color="secondary"
          checked-icon="fas fa-play"
          unchecked-icon="fas fa-pause"
          keep-color
          icon-color="white"
        >
          <q-tooltip>Autoplay</q-tooltip>
        </q-toggle>
        <q-btn
          flat
          color="white"
          @click="ui.showOptions = !ui.showOptions"
          icon="settings"
          class="q-pa-sm"
        ></q-btn>
      </q-bar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useUI } from "stores/ui";

export default defineComponent({
  name: "MainLayout",

  setup() {
    const ui = useUI();
    return { ui };
  },
});
</script>
