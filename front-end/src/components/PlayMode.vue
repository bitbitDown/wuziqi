<script setup>
import { ref } from "vue";
//'local','lan'
const mode = ref("local");
defineExpose({
  mode,
});
</script>

<template>
  <div>
    <div
      class="text-blue-300 p-2 rounded-xl min-w-24 text-center"
      :class="{ 'bg-white shadow-md ': mode === 'local' }"
      @click="mode = 'local'"
    >
      {{ $t("standaloneMode") }}
    </div>
    <div
      class="text-blue-300 p-2 rounded-xl min-w-24 text-center ml-2"
      :class="{ 'bg-white shadow-md ': mode === 'lan' }"
      @click="mode = 'lan'"
    >
      {{ $t("lanMode") }}
    </div>
  </div>
</template>

<style scoped></style>
