<script setup>
const props=
 defineProps({
  mode:{
    type: String,
    required:true}
});
</script>

<template>
  <div>
    <div>{{ $t("standaloneMode") }}</div>
    <div>{{ $t("lanMode") }}</div>
  </div>
</template>

<style scoped></style>
