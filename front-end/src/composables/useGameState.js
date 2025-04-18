import { ref } from 'vue';
import moment from 'moment';

export function useGameState(socket, props) {
  const gameState = ref('pieceSelection'); // 'pieceSelection', 'playing'
  const active = ref('whitePlayer');
  const disabled = ref(false);
  const countdown = ref('');
  
  let countdownTime = moment().add(15, "minutes");
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
  
  function resetGame() {
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
  
  function backToSelection() {
    // 清除计时器
    clearInterval(countdownInterval);
    
    // 切换回选择界面
    gameState.value = 'pieceSelection';
  }
  
  function startGame() {
    gameState.value = 'playing';
    
    // 在AI模式下，玩家总是红方(whitePlayer)，AI总是黑方(blackPlayer)
    active.value = "whitePlayer";
    
    // 初始化计时器
    countdownInterval = setInterval(updateCountdown, 1000);
  }
  
  return {
    gameState,
    active,
    disabled,
    countdown,
    resetGame,
    backToSelection,
    startGame,
    updateCountdown
  };
}