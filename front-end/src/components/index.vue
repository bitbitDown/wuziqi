<script setup>
import { ref, onMounted, inject, onUnmounted, computed } from "vue";
import PieceSelection from './game/PieceSelection.vue';
import GameControls from './game/GameControls.vue';
import { useAi } from '../composables/useAi';

import { useSound } from '@vueuse/sound'
import pop_down1 from '@/assets/sounds/pop_down1.mp3'
import pop_down2 from '@/assets/sounds/pop_down2.mp3'

const socket = inject("socket");
const disabled = ref(false);
const props = defineProps({
  mode: {
    type: String,
  },
});

// 添加游戏状态控制
const gameState = ref('pieceSelection'); // 'pieceSelection', 'playing'
// 导入所有图片资源
const prefix = '/public'
const images = import.meta.glob(`/public/*.svg`, { eager: true });

// 将图片路径转换为URL
const imageUrls = Object.keys(images).map(path => {
  return path.replace(prefix, '');
});

// 根据imageUrls动态生成pieceOptions
const dynamicPieceOptions = imageUrls.map(url => {
  // 从文件名中提取名称（移除路径和扩展名）
  const name = url.split('/').pop().replace('.svg', '');
  
  return {
    name: name,
    path: url
  };
});

// 添加棋子选择相关变量

const pieceOptions = [
  ...dynamicPieceOptions
];

const blackPiece = ref(pieceOptions[0].path);
const whitePiece = ref(pieceOptions[1].path);

// 选择棋子函数
function selectPiece(type, path) {
  if (type === 'black') {
    blackPiece.value = path;
  } else {
    whitePiece.value = path;
  }
}

// 开始游戏
function startGame() {
  gameState.value = 'playing';
  
  // 在AI模式下，玩家总是红方(whitePlayer)，AI总是黑方(blackPlayer)
  active.value = "whitePlayer";
  
  initData();
  
  // 如果是AI模式且AI先手，让AI下第一步棋
  if (isAIMode.value && active.value === 'blackPlayer') {
    aiMove(active, emitChessboard, validSuccess, resetGame);
  }
}

function emitChessboard(location, belongsTo) {
  socket.emit("chessboard", { location, belongsTo }, (data) => {
    console.log("chessboard:", data); // { msg1: '测试1', msg2: '测试2' }
  });
}
function initData() {
  if (props.mode === "lan") {
    socket.connect(); //连接socket服务器
    socket.on("currentChessboard", (data) => {
      console.log("currentChessboard:", data);
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
const rows = ref(13);
//列数
const cols = ref(13);

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

// 使用useAi组合式函数
const { isAIMode, aiDifficulty, toggleAIMode, setAIDifficulty, aiMove } = useAi(boxMap, rows, cols);

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

 //处理声音
 const { play:play1 } = useSound(pop_down1)
 const { play: play2 } = useSound(pop_down2)
//放下棋子
// 添加声音控制状态
const soundEnabled = ref(true);

// 切换声音状态
function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
}

// 修改放下棋子的函数，根据声音状态决定是否播放音效
function putDownPiece(row, col, event) {
  // 只有在声音开启时才播放音效
  if (soundEnabled.value) {
    active.value === 'blackPlayer' ? play2() : play1();
  }
  
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
      resetGame();
    } else {
      active.value =
        active.value === "whitePlayer" ? "blackPlayer" : "whitePlayer";
      
      // 添加AI响应逻辑
      // 如果是AI模式且轮到AI（黑方）
      if (isAIMode.value && active.value === 'blackPlayer') {
        aiMove(active, emitChessboard, validSuccess, resetGame);
      }
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
// 添加返回主界面的函数
function backToSelection() {
  // 先重置游戏状态
  resetGame();
  
  // 清除计时器
  clearInterval(countdownInterval);
  
  // 切换回选择界面
  gameState.value = 'pieceSelection';
}


// 判断是否为游戏早期阶段（棋盘上棋子少于10个）
function isEarlyGame() {
  let pieceCount = 0;
  for (let r = 1; r <= rows.value; r++) {
    for (let c = 1; c <= cols.value; c++) {
      if (!boxMap.get(`row${r}col${c}`)?.empty) {
        pieceCount++;
        if (pieceCount >= 10) return false;
      }
    }
  }
  return true;
}

// 寻找中心区域的位置
function findCenterAreaMove() {
  const centerRow = Math.ceil(rows.value / 2);
  const centerCol = Math.ceil(cols.value / 2);
  const centerArea = [];
  
  // 检查中心点
  if (boxMap.get(`row${centerRow}col${centerCol}`)?.empty) {
    return { row: centerRow, col: centerCol };
  }
  
  // 检查中心点周围的位置
  for (let r = centerRow - 2; r <= centerRow + 2; r++) {
    for (let c = centerCol - 2; c <= centerCol + 2; c++) {
      if (r >= 1 && r <= rows.value && c >= 1 && c <= cols.value) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          centerArea.push({ row: r, col: c });
        }
      }
    }
  }
  
  if (centerArea.length > 0) {
    return centerArea[Math.floor(Math.random() * centerArea.length)];
  }
  
  return null;
}

// 寻找可以连成N子的位置
function findNInARowMove(player, n) {
  // 检查所有空位
  for (let r = 1; r <= rows.value; r++) {
    for (let c = 1; c <= cols.value; c++) {
      if (boxMap.get(`row${r}col${c}`)?.empty) {
        // 临时放置棋子
        boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: player });
        
        // 检查是否形成了N子连线
        if (hasNInARow(r, c, player, n)) {
          // 恢复空位
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
          return { row: r, col: c };
        }
        
        // 恢复空位
        boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
      }
    }
  }
  
  return null;
}

// 检查是否有N子连线
function hasNInARow(row, col, player, n) {
  const directions = [
    [0, 1],  // 水平
    [1, 0],  // 垂直
    [1, 1],  // 对角线
    [1, -1]  // 反对角线
  ];
  
  for (const [dr, dc] of directions) {
    let count = 1;
    
    // 正向检查
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      
      if (r >= 1 && r <= rows.value && c >= 1 && c <= cols.value) {
        if (boxMap.get(`row${r}col${c}`)?.belongsTo === player) {
          count++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // 反向检查
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      
      if (r >= 1 && r <= rows.value && c >= 1 && c <= cols.value) {
        if (boxMap.get(`row${r}col${c}`)?.belongsTo === player) {
          count++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // 如果连线数量等于n，返回true
    if (count === n) {
      return true;
    }
  }
  
  return false;
}

// 寻找战略性随机位置（靠近已有棋子的空位）
function findStrategicRandomMove() {
  const allEmptyPositions = [];
  const strategicPositions = [];
  
  // 收集所有空位和战略位置
  for (let r = 1; r <= rows.value; r++) {
    for (let c = 1; c <= cols.value; c++) {
      if (boxMap.get(`row${r}col${c}`)?.empty) {
        allEmptyPositions.push({ row: r, col: c });
        
        // 检查周围是否有棋子
        if (hasAdjacentPiece(r, c)) {
          strategicPositions.push({ row: r, col: c });
        }
      }
    }
  }
  
  // 优先选择战略位置，如果没有则随机选择
  if (strategicPositions.length > 0) {
    return strategicPositions[Math.floor(Math.random() * strategicPositions.length)];
  } else if (allEmptyPositions.length > 0) {
    return allEmptyPositions[Math.floor(Math.random() * allEmptyPositions.length)];
  }
  
  return null;
}

// 检查周围是否有棋子
function hasAdjacentPiece(row, col) {
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 1 && r <= rows.value && c >= 1 && c <= cols.value) {
        if (r !== row || c !== col) {  // 排除自身
          if (!boxMap.get(`row${r}col${c}`)?.empty) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
</script>
<template>
  <div class="game-container bg-white rounded-2xl shadow-lg p-4 md:p-6 max-w-2xl mx-auto border-4 border-pink-200 relative overflow-hidden">
    <!-- 添加装饰性气泡背景 -->
    <div class="absolute -top-10 -left-10 w-40 h-40 bg-pink-100 rounded-full opacity-50"></div>
    <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-100 rounded-full opacity-50"></div>
    <div class="absolute top-1/3 -right-10 w-24 h-24 bg-blue-100 rounded-full opacity-40"></div>
    
    <h1 class="text-2xl md:text-3xl font-bold text-center text-pink-500 mb-4 relative">
      🎮 五子棋游戏 🎲
      <span class="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">热门</span>
    </h1>
    
    <!-- 使用PieceSelection组件替换原有的棋子选择界面 -->
    <PieceSelection 
      v-if="gameState === 'pieceSelection'"
      :pieceOptions="pieceOptions"
      :blackPiece="blackPiece"
      :whitePiece="whitePiece"
      :isAIMode="isAIMode"
      :aiDifficulty="aiDifficulty"
      @selectPiece="selectPiece"
      @toggleAIMode="toggleAIMode"
      @setAIDifficulty="setAIDifficulty"
      @startGame="startGame"
    />
    <!-- 游戏界面 -->
    <div v-if="gameState === 'playing'" class="animate-fadeIn">
      <!-- 使用 GameControls 组件 -->
      <GameControls 
        :active="active" 
        :blackPiece="blackPiece" 
        :whitePiece="whitePiece" 
        :countdown="countdown"
        :soundEnabled="soundEnabled"
        @toggleSound="toggleSound"
      />
      
     
      
      <div class="flex justify-center items-center">
        <div class="bg-[#ffe4c7] rounded-lg shadow-md p-2 border-2 border-amber-300 relative transform transition-all hover:shadow-lg">
          <!-- 添加棋盘装饰 -->
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
                @click="disabled ? () => {} : putDownPiece(row, col, $event)"
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
      
      <div class="mt-4 text-center">
        <div class="inline-block bg-pink-100 px-4 py-2 rounded-full shadow-sm transform transition-all hover:scale-105">
          <span class="text-gray-700">当前轮到：</span>
          <span class="font-bold" :class="active === 'whitePlayer' ? 'text-red-500' : 'text-black'">
            {{ active === 'whitePlayer' ? '红方 🔴' : '黑方 ⚫' }}
          </span>
        </div>
      </div>
      
      <div class="operation-area">
        <div class="mt-4 flex justify-center space-x-4">
          <button 
            class="transition-all duration-300 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1"
            @click="resetGame"
          >
            🔄 重新开始
          </button>
          
          <button 
            class="transition-all duration-300 bg-gradient-to-r from-blue-400 to-teal-400 hover:from-blue-500 hover:to-teal-500 text-white font-bold py-2 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1"
            @click="backToSelection"
          >
            🏠 返回选择
          </button>
        </div>
        
        <div class="mt-4 flex justify-center space-x-2">
          <span class="w-3 h-3 bg-pink-300 rounded-full animate-pulse"></span>
          <span class="w-3 h-3 bg-purple-300 rounded-full animate-pulse delay-100"></span>
          <span class="w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-200"></span>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-500 mb-2">喜欢这个游戏？请分享给朋友！</p>
          <div class="flex justify-center space-x-3">
            <button class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
              <span>👍</span>
            </button>
            <button class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
              <span>⭐</span>
            </button>
            <button class="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
              <span>❤️</span>
            </button>
            <button class="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 transition-colors">
              <span>🔄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-slow {
  animation: bounce 2s infinite;
}

.animate-dropIn {
  animation: dropIn 0.3s ease-out;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
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

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
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
