<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  pieceOptions: Array,
  blackPiece: String,
  whitePiece: String,
  isAIMode: Boolean,
  aiDifficulty: String
});

const emit = defineEmits(['selectPiece', 'toggleAIMode', 'setAIDifficulty', 'startGame']);

// 添加预览状态
const hoverBlackPiece = ref(null);
const hoverWhitePiece = ref(null);

// 计算是否可以开始游戏
const canStartGame = computed(() => {
  return props.blackPiece && props.whitePiece;
});

function selectPiece(type, path) {
  emit('selectPiece', type, path);
}

function toggleAIMode() {
  emit('toggleAIMode');
}

function setAIDifficulty(difficulty) {
  emit('setAIDifficulty', difficulty);
}

function startGame() {
  if (canStartGame.value) {
    emit('startGame');
  }
}

// 预览功能
function previewPiece(type, path) {
  if (type === 'black') {
    hoverBlackPiece.value = path;
  } else {
    hoverWhitePiece.value = path;
  }
}

function clearPreview(type) {
  if (type === 'black') {
    hoverBlackPiece.value = null;
  } else {
    hoverWhitePiece.value = null;
  }
}
</script>

<template>
  <div class="p-4 bg-white rounded-xl shadow-md border-2 border-pink-100 relative">
    <!-- 小标签 -->
    <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs px-3 py-1 rounded-full">
      个性化设置
    </div>
    
    <h3 class="text-lg font-bold text-pink-500 text-center mb-4 mt-2">请选择您喜欢的棋子</h3>
    
    <!-- 棋子预览区 -->
    <div class="mb-6 flex justify-center items-center gap-8 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
          <img :src="hoverBlackPiece || blackPiece || (pieceOptions && pieceOptions[0]?.path)" class="w-12 h-12 animate-float" />
        </div>
        <p class="mt-2 text-sm font-medium text-gray-700">黑方</p>
      </div>
      <div class="text-2xl font-bold text-pink-400">VS</div>
      <div class="text-center">
        <div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
          <img :src="hoverWhitePiece || whitePiece || (pieceOptions && pieceOptions[0]?.path)" class="w-12 h-12 animate-float" />
        </div>
        <p class="mt-2 text-sm font-medium text-gray-700">红方</p>
      </div>
    </div>
    
    <!-- AI模式选择 -->
    <div class="mb-6 bg-blue-50 p-3 rounded-lg transform transition-all hover:scale-102 hover:shadow-md">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-blue-600 flex items-center">
          <span class="mr-2">🤖</span> AI对战模式
        </h4>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" :checked="isAIMode" @change="toggleAIMode" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span class="ml-3 text-sm font-medium text-gray-700">{{ isAIMode ? '已开启' : '已关闭' }}</span>
        </label>
      </div>
      
      <div v-if="isAIMode" class="mt-2">
        <h5 class="text-sm font-medium mb-2 text-gray-700">选择AI难度:</h5>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="setAIDifficulty('easy')" 
            class="px-3 py-1 rounded-full text-sm transition-all duration-300"
            :class="aiDifficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            <span class="mr-1">😊</span> 简单
          </button>
          <button 
            @click="setAIDifficulty('medium')" 
            class="px-3 py-1 rounded-full text-sm transition-all duration-300"
            :class="aiDifficulty === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            <span class="mr-1">🤔</span> 中等
          </button>
          <button 
            @click="setAIDifficulty('hard')" 
            class="px-3 py-1 rounded-full text-sm transition-all duration-300"
            :class="aiDifficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          >
            <span class="mr-1">😈</span> 困难
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 italic">
          AI将扮演黑方，您将扮演红方。难度越高，AI越聪明！挑战一下？
        </p>
      </div>
    </div>
    
    <!-- 棋子选择部分 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 黑方棋子选择 -->
      <div class="transform transition-all hover:scale-102">
        <h4 class="font-medium mb-3 text-center bg-pink-50 py-2 rounded-lg flex items-center justify-center">
          <span class="mr-2">⚫</span> 黑方棋子
        </h4>
        <div class="flex flex-wrap justify-center gap-3">
          <div 
            v-for="option in pieceOptions" 
            :key="'black-'+option.path"
            class="p-3 border-2 rounded-lg cursor-pointer transition-all duration-300"
            :class="blackPiece === option.path ? 'border-pink-500 bg-pink-50 transform scale-110 shadow-md' : 'border-gray-200 hover:border-pink-300 hover:shadow-sm'"
            @click="selectPiece('black', option.path)"
            @mouseenter="previewPiece('black', option.path)"
            @mouseleave="clearPreview('black')"
          >
            <img :src="option.path" class="w-12 h-12 mx-auto transition-transform hover:rotate-12" />
            <div class="text-sm text-center mt-2">{{ option.name }}</div>
          </div>
        </div>
      </div>
      
      <!-- 红方棋子选择 -->
      <div class="transform transition-all hover:scale-102">
        <h4 class="font-medium mb-3 text-center bg-pink-50 py-2 rounded-lg flex items-center justify-center">
          <span class="mr-2">🔴</span> 红方棋子
        </h4>
        <div class="flex flex-wrap justify-center gap-3">
          <div 
            v-for="option in pieceOptions" 
            :key="'white-'+option.path"
            class="p-3 border-2 rounded-lg cursor-pointer transition-all duration-300"
            :class="whitePiece === option.path ? 'border-pink-500 bg-pink-50 transform scale-110 shadow-md' : 'border-gray-200 hover:border-pink-300 hover:shadow-sm'"
            @click="selectPiece('white', option.path)"
            @mouseenter="previewPiece('white', option.path)"
            @mouseleave="clearPreview('white')"
          >
            <img :src="option.path" class="w-12 h-12 mx-auto transition-transform hover:rotate-12" />
            <div class="text-sm text-center mt-2">{{ option.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 开始游戏按钮 -->
    <div class="mt-8 flex justify-center">
      <button 
        class="transition-all duration-300 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 relative overflow-hidden group"
        :class="{'opacity-70 cursor-not-allowed': !canStartGame, 'animate-pulse': canStartGame && !isAIMode}"
        @click="startGame"
        :disabled="!canStartGame"
      >
        <span class="relative z-10">{{ canStartGame ? '开始游戏 🎮' : '请先选择棋子' }}</span>
        <span class="absolute top-0 left-0 w-full h-full bg-white opacity-20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
      </button>
    </div>
    
    <!-- 提示信息 -->
    <div v-if="!canStartGame" class="mt-3 text-center text-xs text-red-500 animate-bounce">
      请为黑方和红方各选择一种棋子
    </div>
  </div>
</template>

<style scoped>
.hover\:scale-102:hover {
  transform: scale(1.02);
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .flex-wrap {
    justify-content: space-around;
  }
  
  .w-12, .h-12 {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>