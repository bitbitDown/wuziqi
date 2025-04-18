<script setup>
defineProps({
  active: String,
  blackPiece: String,
  whitePiece: String,
  countdown: String
});
</script>

<template>
  <div class="mb-4 flex flex-col md:flex-row justify-between items-center bg-pink-50 rounded-xl shadow-sm p-3 relative overflow-hidden">
    <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-pink-200 rounded-full opacity-30"></div>
    
    <div class="flex items-center mb-2 md:mb-0 relative z-10">
      <div class="flex items-center mr-6 bg-white px-3 py-1 rounded-lg shadow-sm">
        <span class="mr-2 font-medium">黑方：</span> 
        <img :src="blackPiece" class="w-8 h-8 animate-bounce-slow" /> 
        <span v-if="active === 'blackPlayer'" class="ml-1 text-xs bg-green-500 text-white px-1 rounded animate-pulse">思考中</span>
      </div>
      <div class="flex items-center bg-white px-3 py-1 rounded-lg shadow-sm">
        <span class="mr-2 font-medium">红方：</span>
        <img :src="whitePiece" class="w-8 h-8 animate-bounce-slow" />
        <span v-if="active === 'whitePlayer'" class="ml-1 text-xs bg-green-500 text-white px-1 rounded animate-pulse">思考中</span>
      </div>
    </div>
    
    <div class="bg-white px-4 py-2 rounded-full shadow-sm border-2 border-pink-300 relative z-10">
      <span class="text-gray-600">⏱️ 剩余时间</span>
      <span class="text-pink-500 ml-3 font-bold"> {{ countdown }}</span>
    </div>
  </div>
</template>

<style scoped>
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
</style>