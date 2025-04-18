<script setup>
import { ref } from 'vue';
import Wuziqi from './components/Wuziqi.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const mode = ref('');

function selectMode(selectedMode) {
  mode.value = selectedMode;
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-pink-50 to-purple-100">
    <div v-if="!mode" class="text-center w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6 md:p-8 border-4 border-pink-200">
      <h1 class="text-3xl font-bold text-pink-500 mb-6">🎮 五子棋游戏 🎲</h1>
      
      <div class="flex flex-col gap-5">
        <button 
          class="transition-all duration-300 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 w-full md:w-64 mx-auto" 
          @click="selectMode('standalone')"
        >
          🎮 {{ t('standaloneMode') }} 🎮
        </button>
        
        <button 
          class="transition-all duration-300 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 w-full md:w-64 mx-auto" 
          @click="selectMode('lan')"
        >
          🌐 {{ t('lanMode') }} 🌐
        </button>
      </div>
      
      <div class="mt-8 text-gray-500 text-sm flex justify-center items-center">
        <span class="animate-bounce mr-2">👇</span>
        选择游戏模式开始游戏
        <span class="animate-bounce ml-2">👇</span>
      </div>
      
      <div class="mt-6 flex justify-center space-x-2">
        <span class="w-3 h-3 bg-pink-300 rounded-full animate-pulse"></span>
        <span class="w-3 h-3 bg-purple-300 rounded-full animate-pulse delay-100"></span>
        <span class="w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-200"></span>
      </div>
    </div>
    
    <Wuziqi v-else :mode="mode" class="w-full" />
  </div>
</template>

<style scoped>
@media (max-width: 640px) {
  .min-h-screen {
    padding: 1rem;
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
</style>
