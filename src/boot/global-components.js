import { boot } from "quasar/wrappers";
import ChessBoard from "components/ChessBoard.vue";
import WikiBooks from "components/WikiBooks.vue";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  // Component globaux
  app.component("chess-board", ChessBoard);
  app.component("wiki-books", WikiBooks);

  // global props
  // app.config.globalProperties.$utils = useUtils();
});
