import { ref, watch } from 'vue';

export function useAI(boxMap, active, rows, cols, validSuccess, emitChessboard, resetGame) {
  const isAIMode = ref(false);
  const aiDifficulty = ref('medium'); // 'easy', 'medium', 'hard'
  
  // 随机找一个空位下棋（简单难度）
  function findRandomMove() {
    // 收集所有空位
    const emptyPositions = [];
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          emptyPositions.push({ row: r, col: c });
        }
      }
    }
    
    // 随机选一个
    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      return emptyPositions[randomIndex];
    }
    
    return null;
  }
  
  // 寻找获胜位置
  function findWinningMove(player) {
    // 检查所有空位
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 临时放置棋子
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: player });
          
          // 检查是否获胜
          const isWinning = validSuccess(r, c, player);
          
          // 恢复空位
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
          
          if (isWinning) {
            return { row: r, col: c };
          }
        }
      }
    }
    
    return null;
  }
  
  // 寻找更好的位置（中等难度）
  function findBetterMove() {
    // 先检查是否有可以连成五子的位置
    const winningMove = findWinningMove('blackPlayer');
    if (winningMove) return winningMove;
    
    // 再检查是否需要阻止对手连成五子
    const blockingMove = findWinningMove('whitePlayer');
    if (blockingMove) return blockingMove;
    
    // 否则随机选择一个位置
    return findRandomMove();
  }
  
  // 寻找最佳位置（困难难度）
  function findBestMove() {
    // 先检查是否有可以连成五子的位置
    const winningMove = findWinningMove('blackPlayer');
    if (winningMove) return winningMove;
    
    // 再检查是否需要阻止对手连成五子
    const blockingMove = findWinningMove('whitePlayer');
    if (blockingMove) return blockingMove;
    
    // 检查是否有可以连成四子的位置
    // ... 更复杂的策略 ...
    
    // 如果是游戏开始阶段，优先选择中心位置或其周围
    const centerRow = Math.ceil(rows.value / 2);
    const centerCol = Math.ceil(cols.value / 2);
    
    if (boxMap.get(`row${centerRow}col${centerCol}`)?.empty) {
      return { row: centerRow, col: centerCol };
    }
    
    // 否则随机选择一个位置，但优先选择靠近已有棋子的位置
    return findRandomMove();
  }
  
  // AI下棋逻辑
  function aiMove() {
    if (!isAIMode.value || active.value !== 'blackPlayer') return;
    
    // 延迟一下，模拟AI思考时间
    setTimeout(() => {
      let move;
      
      // 根据难度选择不同的策略
      if (aiDifficulty.value === 'easy') {
        move = findRandomMove();
      } else if (aiDifficulty.value === 'medium') {
        move = findBetterMove();
      } else {
        move = findBestMove();
      }
      
      if (move) {
        // AI放置棋子
        boxMap.set(`row${move.row}col${move.col}`, {
          empty: false,
          belongsTo: 'blackPlayer'
        });
        
        emitChessboard({ row: move.row, col: move.col }, 'blackPlayer');
        
        // 检查是否获胜
        if (validSuccess(move.row, move.col, 'blackPlayer')) {
          setTimeout(() => {
            alert('AI获胜了！');
            resetGame();
          }, 100);
        } else {
          // 切换到玩家回合
          active.value = 'whitePlayer';
        }
      }
    }, 800); // 思考时间800毫秒
  }
  
  // 监听玩家回合变化，触发AI下棋
  watch(active, (newValue) => {
    if (isAIMode.value && newValue === 'blackPlayer') {
      aiMove();
    }
  });
  
  function toggleAIMode() {
    isAIMode.value = !isAIMode.value;
  }
  
  function setAIDifficulty(difficulty) {
    aiDifficulty.value = difficulty;
  }
  
  return {
    isAIMode,
    aiDifficulty,
    toggleAIMode,
    setAIDifficulty,
    aiMove
  };
}