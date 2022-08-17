<template>
  <div>
    <div
      class="WB"
      v-if="WB.pages[page] && WB.pages[page].parse"
      v-html="WB.pages[page].parse.text['*']"
    />
    <div v-else-if="WB.pages[page] && WB.pages[page].error">
      <span class="text-caption">La page n'existe pas sur WikiBooks.</span>
    </div>
    <q-spinner v-else class="full-width" size="3em" color="primary" />
  </div>
</template>

<script>
import { ref, computed, watchEffect, reactive } from "vue";
import { useWB } from "stores/wikibooks";

export default {
  name: "WikiBooks",
  props: {
    history: {
      type: Array,
    },
  },
  setup(props, ctx) {
    const WB = useWB();

    const page = computed(() => {
      var p = "Chess Opening Theory";
      var k = 1;
      props.history.forEach((h, i) => {
        p += `/${k}${i % 2 ? "..." : ". "}${h}`;
        if (i % 2) k++;
      });
      return p;
    });

    watchEffect(async () => {
      WB.getPage(page.value);
    });

    return { WB, page };
  },
};
</script>

<style lang="scss">
.WB {
  font-size: 90%;
  .infobox,
  .navbox {
    display: none;
  }
  h1 {
    font-size: 2em;
    line-height: 1;
    margin: 0;
  }
  h2 {
    font-size: 1.5em;
    line-height: 1;
    margin: 0;
  }

  h3,
  h4,
  h5,
  h6 {
    font-size: 1em;
    line-height: 1em;
    font-weight: bold;
  }
}
</style>
