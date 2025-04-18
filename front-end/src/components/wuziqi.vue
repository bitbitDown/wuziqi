<script setup>
import { ref, onMounted, inject, onUnmounted, computed } from "vue";

const socket = inject("socket");
const disabled = ref(false);
const props = defineProps({
  mode: {
    type: String,
  },
});
function emitChessboard(location, belongsTo) {
  socket.emit("chessboard", { location, belongsTo }, (data) => {
    console.log("chessboard:", data); // { msg1: '测试1', msg2: '测试2' }
  });
}
function initData() {
  if (props.mode === "lan") {
    socket.connect(); //连接socket服务器
    socket.on("currentChessboard", (data) => {
      console.log("currentChessboard:", data); // { msg1: '测试1', msg2: '测试2' }
      const {
        location: { row, col },
        belongsTo,
        socketId,
      } = data;
      disabled.value = socket.id === data.socketId;
      boxMap.set(`row${row}col${col}`, { empty: false, belongsTo });
      active.value =
        active.value === "whitePlayer" ? "blackPlayer" : "whitePlayer";
    });
  }
  countdownInterval = setInterval(updateCountdown, 1000);
}
onMounted(() => {
  initData();
});
onUnmounted(() => {
  clearInterval(countdownInterval);
});
//对局时间
let countdownTime = moment().add(15, "minutes"); // 将const改为let，使其可以重新赋值
const countdown = ref("");
let countdownInterval;

function updateCountdown() {
  const now = moment();
  const duration = moment.duration(countdownTime.diff(now));
  const minutes = Math.floor(duration.asMinutes());
  const seconds = Math.floor(duration.asSeconds()) % 60;
  countdown.value = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (minutes <= 0 && seconds <= 0) {
    clearInterval(countdownInterval);
    alert("Time is up!");
  }
}
//棋盘

// 行数
const rows = ref(10);
//列数
const cols = ref(10);

//轮到哪方下棋了
const active = ref("whitePlayer");

const boxMap = new Map();
let row = 1;
let col = 1;
while (row <= rows.value) {
  while (col <= cols.value + 1) {
    boxMap.set(`row${row}col${col}`, { empty: true, belongsTo: null });
    col++;
  }
  row++;
  col = 1;
}

const isEmpty = (row, col) => {
  return boxMap.get(`row${row}col${col}`)?.empty;
};
const belongsToWho = computed(() => {
  return (row, col) => {
    return boxMap.get(`row${row}col${col}`)?.belongsTo;
  };
});

function initLocaltion(location) {
  return {
    position: "absolute",
    top: "-50%",
    [location === "left-top" ? "left" : "right"]: "-50%",
  };
}
//放下棋子
function putDownPiece(row, col, event) {
  const location = getCornerClicked(event.target, event.clientX, event.clientY);
  //处理行列，由单元格行变为边框，每个单元格跨2行2列
  if (["bottomLeft", "bottomRight"].includes(location)) {
    row += 1;
  }
  if (["topRight", "bottomRight"].includes(location)) {
    col += 1;
  }
  if (boxMap.get(`row${row}col${col}`)?.empty) {
    boxMap.set(`row${row}col${col}`, {
      empty: false,
      belongsTo: active.value,
      location,
    });
    emitChessboard({ row, col }, active.value);
    if (validSuccess(row, col, active.value)) {
      alert(`${active.value} 获胜!`);
      // 修改这里，使用resetGame而不是刷新页面
      resetGame();
    } else {
      active.value =
        active.value === "whitePlayer" ? "blackPlayer" : "whitePlayer";
    }
  }
}
//判断是否为
function validSuccess(row, col, active) {
  // 检查水平方向
  let count = 1;
  for (
    let i = col - 1;
    i >= 0 && boxMap.get(`row${row}col${i}`)?.belongsTo === active;
    i--
  ) {
    count++;
  }
  for (
    let i = col + 1;
    i <= cols.value && boxMap.get(`row${row}col${i}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  if (count >= 5) return true;

  // 检查垂直方向
  count = 1;
  for (
    let i = row - 1;
    i >= 0 && boxMap.get(`row${i}col${col}`)?.belongsTo === active;
    i--
  ) {
    count++;
  }
  for (
    let i = row + 1;
    i <= rows.value && boxMap.get(`row${i}col${col}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  if (count >= 5) return true;

  // 检查斜线方向
  count = 1;
  for (
    let i = 1;
    row - i >= 0 &&
    col - i >= 0 &&
    boxMap.get(`row${row - i}col${col - i}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  for (
    let i = 1;
    row + i <= rows.value &&
    col + i <= cols.value &&
    boxMap.get(`row${row + i}col${col + i}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  if (count >= 5) return true;

  count = 1;
  for (
    let i = 1;
    row - i >= 0 &&
    col + i <= cols.value &&
    boxMap.get(`row${row - i}col${col + i}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  for (
    let i = 1;
    row + i <= rows.value &&
    col - i >= 0 &&
    boxMap.get(`row${row + i}col${col - i}`)?.belongsTo === active;
    i++
  ) {
    count++;
  }
  if (count >= 5) return true;

  return false;
}
function getCornerClicked(element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  // 计算点击位置相对于元素四角的距离
  const topLeftDistance = Math.sqrt(
    Math.pow(clientX - rect.left, 2) + Math.pow(clientY - rect.top, 2)
  );
  const topRightDistance = Math.sqrt(
    Math.pow(clientX - rect.right, 2) + Math.pow(clientY - rect.top, 2)
  );
  const bottomLeftDistance = Math.sqrt(
    Math.pow(clientX - rect.left, 2) + Math.pow(clientY - rect.bottom, 2)
  );
  const bottomRightDistance = Math.sqrt(
    Math.pow(clientX - rect.right, 2) + Math.pow(clientY - rect.bottom, 2)
  );

  // 找出最短距离对应的角落
  const minDistance = Math.min(
    topLeftDistance,
    topRightDistance,
    bottomLeftDistance,
    bottomRightDistance
  );
  if (minDistance === topLeftDistance) {
    return "topLeft";
  } else if (minDistance === topRightDistance) {
    return "topRight";
  } else if (minDistance === bottomLeftDistance) {
    return "bottomLeft";
  } else if (minDistance === bottomRightDistance) {
    return "bottomRight";
  } else {
    return "none";
  }
}
function getCellStyle(row, col) {
  // return { border:col===cols?'none':'1px solid #655b51'}
  const prop = "1px solid #655b51";
  const style = {
    "border-left": prop,
    "border-top": prop,
  };
  row === rows.value && (style["border-bottom"] = prop);
  col === cols.value && (style["border-right"] = prop);
  return style;
}
// 添加重置游戏的函数
function resetGame() {
  // 重置棋盘
  boxMap.forEach((value, key) => {
    boxMap.set(key, { empty: true, belongsTo: null });
  });
  
  // 重置当前玩家
  active.value = "whitePlayer";
  
  // 重置禁用状态
  disabled.value = false;
  
  // 重置计时器
  clearInterval(countdownInterval);
  countdownTime = moment().add(15, "minutes"); // 现在可以正确重新赋值
  countdownInterval = setInterval(updateCountdown, 1000);
  
  // 如果是联机模式，可能需要通知服务器重置游戏
  if (props.mode === "lan") {
    socket.emit("resetGame");
  }
}
</script>
<template>
  <div class="game-container bg-white rounded-2xl shadow-lg p-4 md:p-6 max-w-2xl mx-auto border-4 border-pink-200">
    <h1 class="text-2xl md:text-3xl font-bold text-center text-pink-500 mb-4">🎮 五子棋游戏 🎲</h1>
    
    <!-- 修改玩家信息和倒计时的布局 -->
    <div class="mb-4 flex flex-col md:flex-row justify-between items-center bg-pink-50 rounded-xl shadow-sm p-3">
      <div class="flex items-center mb-2 md:mb-0">
        <div class="flex items-center mr-6">
          <span class="mr-2 font-medium">黑方：</span> 
          <img src="/chicken.svg" class="w-8 h-8 animate-bounce-slow" /> 
        </div>
        <div class="flex items-center">
          <span class="mr-2 font-medium">红方：</span>
          <img src="/gululu.svg" class="w-8 h-8 animate-bounce-slow" />
        </div>
      </div>
      
      <div class="bg-white px-4 py-2 rounded-full shadow-sm border-2 border-pink-300">
        <span class="text-gray-600">⏱️ 剩余时间</span>
        <span class="text-pink-500 ml-3 font-bold"> {{ countdown }}</span>
      </div>
    </div>
    
    <!-- 棋盘部分 -->
    <div class="flex justify-center items-center">
      <div class="bg-[#ffe4c7] rounded-lg shadow-md p-2 border-2 border-amber-300">
        <div class="grid grid-rows-10">
          <div v-for="row in rows" class="flex">
            <div
              v-for="col in cols"
              class="w-7 h-7 md:w-8 md:h-8 flex justify-center items-center relative"
              :style="getCellStyle(row, col)"
              :key="`${row}-${col}`"
              :class="{
                'wuzi-white-cursor': active === 'whitePlayer',
                'wuzi-black-cursor': active === 'blackPlayer',
                'hover:bg-yellow-100': isEmpty(row, col)
              }"
              @click="disabled ? () => {} : putDownPiece(row, col, $event)"
            >
              <span v-if="isEmpty(row, col)"></span>
              <template v-else>
                <img
                  :style="initLocaltion('left-top')"
                  :src="
                    belongsToWho(row, col) === 'whitePlayer'
                      ? '/gululu.svg'
                      : '/chicken.svg'
                  "
                  class="piece-img"
                />
              </template>
              <img
                v-if="col === cols && !isEmpty(row, col + 1)"
                :style="initLocaltion('right-top')"
                :src="
                  belongsToWho(row, col + 1) === 'whitePlayer'
                    ? '/gululu.svg'
                    : '/chicken.svg'
                "
                class="piece-img"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 当前玩家提示 -->
    <div class="mt-4 text-center">
      <div class="inline-block bg-pink-100 px-4 py-2 rounded-full shadow-sm">
        <span class="text-gray-700">当前轮到：</span>
        <span class="font-bold" :class="active === 'whitePlayer' ? 'text-red-500' : 'text-black'">
          {{ active === 'whitePlayer' ? '红方 🔴' : '黑方 ⚫' }}
        </span>
      </div>
    </div>
    
    <!-- 修改重新开始按钮 -->
    <div class="mt-4 flex justify-center">
      <button 
        class="transition-all duration-300 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1"
        @click="resetGame"
      >
        🔄 重新开始
      </button>
    </div>
    
    <!-- 装饰元素 -->
    <div class="mt-4 flex justify-center space-x-2">
      <span class="w-3 h-3 bg-pink-300 rounded-full animate-pulse"></span>
      <span class="w-3 h-3 bg-purple-300 rounded-full animate-pulse delay-100"></span>
      <span class="w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-200"></span>
    </div>
  </div>
</template>

<style scoped>
.wuzi-white-cursor {
  cursor: url("/gululu.svg"), auto;
  outline: none;
}

.wuzi-black-cursor {
  cursor: url("/chicken.svg"), auto;
  outline: none;
}

.game-board div div:hover {
  background-color: rgba(255, 224, 130, 0.3);
}

.piece-img {
  width: 24px;
  height: 24px;
  transition: transform 0.2s;
}

.piece-img:hover {
  transform: scale(1.1);
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 640px) {
  .piece-img {
    width: 20px;
    height: 20px;
  }
}
</style>
