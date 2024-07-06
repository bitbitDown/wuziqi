<script setup>
import { ref, onMounted, inject, onUnmounted, computed } from "vue";

const socket = inject('socket');

function emitChessboard(location, belongsTo) {
  socket.emit('chessboard', { location, belongsTo }, (data) => {
    console.log('chessboard:', data) // { msg1: '测试1', msg2: '测试2' }
  });
}

socket.on('currentChessboard', (data) => {
  console.log('currentChessboard:', data) // { msg1: '测试1', msg2: '测试2' }
  const { location: { row, col }, belongsTo } = data
  boxMap.set(`row${row}col${col}`, { empty: false, belongsTo });
  active.value =
        active.value === "whitePlayer" ? "blackPlayer" : "whitePlayer";
});

onMounted(() => {
  socket.connect(); //连接socket服务器
});
//对局时间
const countdownTime = moment().add(15, "minutes");
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
  while (col <= cols.value) {
    boxMap.set(`row${row}col${col}`, { empty: true, belongsTo: null });
    col++;
  }
  row++;
  col = 1;
}

const isEmpty = computed(() => {
  return (row, col) => {
    return boxMap.get(`row${row}col${col}`)?.empty;
  };
});
const belongsTo = computed(() => {
  return (row, col) => {
    return boxMap.get(`row${row}col${col}`)?.belongsTo;
  };
});

//放下棋子
function putDownPiece(row, col) {
  if (boxMap.get(`row${row}col${col}`)?.empty) {
    boxMap.set(`row${row}col${col}`, { empty: false, belongsTo: active.value });
    emitChessboard({ row, col }, active.value)
    if (validSuccess(row, col, active.value)) {
      alert(`${active.value} 获胜!`);
      window.location.reload();
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
onMounted(() => {
  countdownInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  clearInterval(countdownInterval);
});
</script>
<template>
  <div class="m-10 relative flex justify-center items-center">
    <div class="absolute left-0">
      <span>黑方：</span> <img src="/wuzi-black.png" /> <span>红方</span>
      <img src="/wuzi-white.png" />
    </div>
    <div class="">
      <span class="text-gray-500">对局剩余时间</span><span class="text-red-500 ml-5"> {{ countdown }}</span>
    </div>
  </div>
  <div class="flex justify-center items-center h-[50rem]">
    <div class="bg-yellow-400">
      <div class="grid grid-rows-10">
        <div v-for="row in rows" class="flex">
          <div v-for="col in cols" class="w-8 h-8 flex justify-center items-center border-2" :class="{
            'wuzi-white-cursor': active === 'whitePlayer',
            'wuzi-black-cursor': active === 'blackPlayer',
          }" @click="putDownPiece(row, col)">
            <!-- <img src="/wuzi-black.png"> -->
            <!-- <span v-if="isEmpty(row, col)">{{ `${row},${col}` }}</span> -->
            <span v-if="isEmpty(row, col)"></span>
            <img v-else :src="belongsTo(row, col) === 'whitePlayer'
              ? '/wuzi-white.png'
              : '/wuzi-black.png'
              " />
            <!-- <img src="/wuzi-white.png"> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.wuzi-white-cursor {
  cursor: url("/wuzi-white.png"), auto;
  outline: none;
}

.wuzi-black-cursor {
  cursor: url("/wuzi-black.png"), auto;
  outline: none;
}
</style>
