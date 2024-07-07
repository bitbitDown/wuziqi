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
</script>
<template>
  <div class="relative flex justify-center items-center">
    <div class="fixed left-0">
      <span>黑方：</span> <img src="/chicken.svg" /> <span>红方</span>
      <img src="/gululu.svg" />
    </div>
    <div class="w-full text-center">
      <span class="text-gray-500">对局剩余时间</span
      ><span class="text-red-500 ml-5"> {{ countdown }}</span>
    </div>
  </div>
  <div class="flex justify-center items-center h-[20rem]">
    <div class="bg-[#ffe4c7]">
      <div class="grid grid-rows-10">
        <div v-for="row in rows" class="flex">
          <div
            v-for="col in cols"
            class="w-8 h-8 flex justify-center items-center relative"
            :style="getCellStyle(row, col)"
            :key="`${row}-${col}`"
            :class="{
              'wuzi-white-cursor': active === 'whitePlayer',
              'wuzi-black-cursor': active === 'blackPlayer',
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
            />
          </div>
        </div>
      </div>
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
</style>
