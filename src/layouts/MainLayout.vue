<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title> Chess Openings Learner </q-toolbar-title>

        <div>v.0.8</div>
        <q-btn
          flat
          color="white"
          @click="ui.showOptions = !ui.showOptions"
          icon="settings"
        ></q-btn>
      </q-toolbar>
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
