<script setup>
import { ref, computed, watch } from "vue";

import Wuziqi from "../components/Wuziqi.vue";
import PlayMode from "../components/PlayMode.vue";
const modeRef = ref(null);
const mode =computed(()=>modeRef.value?.mode)
const isLocal = computed(() => mode.value === "local");
const isStarted = ref(false);
watch(
  () => isLocal.value,
  (_) => {
    isStarted.value = false;
  }
);
</script>

<template>
  <div class="bg-gray-200 h-svh flex flex-col items-center justify-evenly">
    <PlayMode class="flex justify-center pt-10" ref="modeRef"></PlayMode>
    <!-- <div v-if="!isStarted" class="flex flex-col items-center justify-between h-1/2"> -->
      <template v-if="!isStarted">
      <div>wuziqi game</div>
      <div
        class="text-blue-300 shadow-md p-2 rounded-xl w-48 text-center bg-amber-500"
        @click="isStarted = true"
      >
        开始游戏
      </div>
    </template>
    <!-- </div> -->
    <Wuziqi :mode=mode v-else></Wuziqi>
  </div>
</template>

<style></style>
