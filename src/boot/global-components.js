import { boot } from "quasar/wrappers";
import ChessBoard from "components/ChessBoard.vue";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  // Component globaux
  app.component("chess-board", ChessBoard);

  // global props
  // app.config.globalProperties.$geo = useGeolocation();
  // app.config.globalProperties.$utils = useUtils();
});
