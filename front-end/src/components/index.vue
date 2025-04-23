<script setup>
import { ref, onMounted, inject, onUnmounted, computed } from "vue";
import PieceSelection from './game/PieceSelection.vue';
import GameControls from './game/GameControls.vue';
import { useAi } from '../composables/useAi';
import { useChessboard } from '../composables/useChessboard';

import { useSound } from '@vueuse/sound'
import pop_down1 from '@/assets/sounds/pop_down1.mp3'
import pop_down2 from '@/assets/sounds/pop_down2.mp3'

const socket = inject("socket");
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

// 使用 useChessboard 组合式函数
const active = ref("whitePlayer");
const disabled = ref(false);

function resetGame() {
  // 重置棋盘
  resetChessboard();
  
  // 重置当前玩家
  active.value = "whitePlayer";
  
  // 重置禁用状态
  disabled.value = false;
  
  // 重置计时器
  clearInterval(countdownInterval);
  countdownTime = moment().add(15, "minutes");
  countdownInterval = setInterval(updateCountdown, 1000);
  
  // 如果是联机模式，可能需要通知服务器重置游戏
  if (props.mode === "lan") {
    socket.emit("resetGame");
  }
}

// 从 useChessboard 获取棋盘相关功能（只调用一次）
const {
  rows,
  cols,
  boxMap,
  isEmpty,
  belongsToWho,
  getCellStyle,
  initLocaltion,
  emitChessboard,
  validSuccess,
  resetChessboard,
  putDownPiece: originalPutDownPiece
} = useChessboard(socket, active, disabled, resetGame);

// 使用useAi组合式函数
const { isAIMode, aiDifficulty, toggleAIMode, setAIDifficulty, aiMove } = useAi(boxMap, rows, cols);

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
let countdownTime = moment().add(15, "minutes");
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

// 处理声音
const { play:play1 } = useSound(pop_down1)
const { play: play2 } = useSound(pop_down2)
const soundEnabled = ref(true);

// 切换声音状态
function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
}

// 修改放下棋子的函数，添加声音效果和AI响应
function putDownPiece(row, col, event) {
  // 只有在声音开启时才播放音效
  if (soundEnabled.value) {
    active.value === 'blackPlayer' ? play2() : play1();
  }
  
  // 调用原始的 putDownPiece 函数
  originalPutDownPiece(row, col, event);
  
  // 添加AI响应逻辑
  // 如果是AI模式且轮到AI（黑方）
  if (isAIMode.value && active.value === 'blackPlayer') {
    aiMove(active, emitChessboard, validSuccess, resetGame);
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
