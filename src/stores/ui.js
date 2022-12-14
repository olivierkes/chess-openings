import { defineStore } from "pinia";

export const useUI = defineStore("UI", {
  state: () => ({
    showOptions: false,
    autoplay: true,
    version: "0.10",
  }),
});
