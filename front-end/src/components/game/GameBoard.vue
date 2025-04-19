<script setup>
import { onMounted } from 'vue';

const props = defineProps({
  rows: Number,
  cols: Number,
  active: String,
  disabled: Boolean,
  blackPiece: String,
  whitePiece: String,
  getCellStyle: Function,
  isEmpty: Function,
  belongsToWho: Function,
  initLocaltion: Function
});

const emit = defineEmits(['putDownPiece']);

function handlePutDownPiece(row, col, event) {
  if (!props.disabled) {
    emit('putDownPiece', row, col, event);
  }
}

// 添加组件挂载时的滚动逻辑
onMounted(() => {
  // 滚动到页面顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // 平滑滚动效果
  });
});
</script>

<template>
  <!-- 保持原有模板不变 -->
  <div class="flex justify-center items-center">
    <div class="bg-[#ffe4c7] rounded-lg shadow-md p-2 border-2 border-amber-300 relative transform transition-all hover:shadow-lg">
      <!-- 棋盘装饰 -->
      <div class="absolute -top-2 -left-2 w-4 h-4 bg-amber-500 rounded-full"></div>
      <div class="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full"></div>
      <div class="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-500 rounded-full"></div>
      <div class="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-500 rounded-full"></div>
      
      <div class="grid grid-rows-10">
        <div v-for="row in rows" class="flex">
          <div
            v-for="col in cols"
            class="w-7 h-7 md:w-8 md:h-8 flex justify-center items-center relative transition-all duration-200"
            :style="getCellStyle(row, col)"
            :key="`${row}-${col}`"
            :class="{
              'wuzi-white-cursor': active === 'whitePlayer',
              'wuzi-black-cursor': active === 'blackPlayer',
              'hover:bg-yellow-100': isEmpty(row, col)
            }"
            @click="handlePutDownPiece(row, col, $event)"
          >
            <span v-if="isEmpty(row, col)"></span>
            <template v-else>
              <img
                :style="initLocaltion('left-top')"
                :src="belongsToWho(row, col) === 'whitePlayer' ? whitePiece : blackPiece"
                class="piece-img animate-dropIn"
              />
            </template>
            <img
              v-if="col === cols && !isEmpty(row, col + 1)"
              :style="initLocaltion('right-top')"
              :src="belongsToWho(row, col + 1) === 'whitePlayer' ? whitePiece : blackPiece"
              class="piece-img animate-dropIn"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-dropIn {
  animation: dropIn 0.3s ease-out;
}

@keyframes dropIn {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.piece-img {
  width: 24px;
  height: 24px;
  position: absolute;
  z-index: 10;
}

@media (min-width: 768px) {
  .piece-img {
    width: 28px;
    height: 28px;
  }
}

/* 鼠标悬停效果 */
.wuzi-white-cursor:hover {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="red" stroke="white" stroke-width="2"/></svg>') 12 12, auto;
}

.wuzi-black-cursor:hover {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="black" stroke="white" stroke-width="2"/></svg>') 12 12, auto;
}
</style>