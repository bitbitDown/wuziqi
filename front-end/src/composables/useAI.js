import { ref } from 'vue';

export function useAi(boxMap, rows, cols) {
  const isAIMode = ref(false);
  const aiDifficulty = ref('medium'); // 'easy', 'medium', 'hard'
  
  // 切换AI模式
  function toggleAIMode() {
    isAIMode.value = !isAIMode.value;
  }
  
  // 设置AI难度
  function setAIDifficulty(difficulty) {
    aiDifficulty.value = difficulty;
  }
  
  // AI下棋逻辑
  function aiMove(active, emitChessboard, validSuccess, resetGame) {
    if (!isAIMode.value || active.value !== 'blackPlayer') return;
    
    // 延迟一下，模拟AI思考时间
    return new Promise(resolve => {
      setTimeout(() => {
        // 根据难度选择不同的AI策略
        let move;
        
        switch(aiDifficulty.value) {
          case 'easy':
            move = findRandomMove();
            break;
          case 'medium':
            move = findBetterMove();
            break;
          case 'hard':
            move = findBestMove();
            break;
          default:
            move = findBetterMove();
        }
        
        if (move) {
          // 直接使用简化版本设置棋子
          const location = 'topLeft'; // 默认位置
          
          boxMap.set(`row${move.row}col${move.col}`, {
            empty: false,
            belongsTo: active.value,
            location,
          });
          
          // 如果需要，发送联机消息
          emitChessboard({ row: move.row, col: move.col }, active.value);
          
          if (validSuccess(move.row, move.col, active.value)) {
            alert(`${active.value} 获胜!`);
            resetGame();
          } else {
            active.value = 'whitePlayer';
          }
          
          resolve();
        }
      }, 800); // 思考时间800毫秒
    });
  }
  
  // 随机找一个空位下棋（简单难度）
  function findRandomMove() {
    const emptyPositions = [];
    
    // 收集所有空位
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          emptyPositions.push({ row: r, col: c });
        }
      }
    }
    
    // 随机选择一个空位
    if (emptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      return emptyPositions[randomIndex];
    }
    
    return null;
  }
  
  // 寻找更好的位置（中等难度）
  function findBetterMove() {
    // 先检查是否有可以连成五子的位置
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 模拟AI下在这个位置
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: 'blackPlayer' });
          
          // 检查是否能赢
          if (checkWinningCondition(r, c, 'blackPlayer')) {
            // 恢复原状态
            boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
            return { row: r, col: c };
          }
          
          // 恢复原状态
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
        }
      }
    }
    
    // 检查是否需要阻止对手连成五子
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 模拟玩家下在这个位置
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: 'whitePlayer' });
          
          // 检查玩家是否能赢
          if (checkWinningCondition(r, c, 'whitePlayer')) {
            // 恢复原状态
            boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
            return { row: r, col: c };
          }
          
          // 恢复原状态
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
        }
      }
    }
    
    // 如果没有紧急情况，使用战略性随机位置
    return findStrategicRandomMove();
  }
  
  // 寻找最佳位置（困难难度）
  function findBestMove() {
    // 实现更复杂的AI算法，例如极小极大算法或评估函数
    // 这里简化为增强版的中等难度
    
    // 先检查是否有可以连成五子的位置
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 模拟AI下在这个位置
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: 'blackPlayer' });
          
          // 检查是否能赢
          if (checkWinningCondition(r, c, 'blackPlayer')) {
            // 恢复原状态
            boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
            return { row: r, col: c };
          }
          
          // 恢复原状态
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
        }
      }
    }
    
    // 检查是否需要阻止对手连成五子
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 模拟玩家下在这个位置
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: 'whitePlayer' });
          
          // 检查玩家是否能赢
          if (checkWinningCondition(r, c, 'whitePlayer')) {
            // 恢复原状态
            boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
            return { row: r, col: c };
          }
          
          // 恢复原状态
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
        }
      }
    }
    
    // 检查是否有可以连成四子的位置
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value; c++) {
        if (boxMap.get(`row${r}col${c}`)?.empty) {
          // 模拟AI下在这个位置
          boxMap.set(`row${r}col${c}`, { empty: false, belongsTo: 'blackPlayer' });
          
          // 检查是否能形成四子连线
          if (checkConsecutivePieces(r, c, 'blackPlayer', 4)) {
            // 恢复原状态
            boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
            return { row: r, col: c };
          }
          
          // 恢复原状态
          boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
        }
      }
    }
    
    // 如果没有特殊情况，使用战略性随机位置
    return findStrategicRandomMove();
  }
  
  // 检查是否有连续的棋子
  function checkConsecutivePieces(row, col, player, n) {
    // 检查八个方向
    const directions = [
      [0, 1],  // 水平
      [1, 0],  // 垂直
      [1, 1],  // 对角线
      [1, -1]  // 反对角线
    ];
    
    for (const [dr, dc] of directions) {
      let count = 1;  // 当前位置已经有一个棋子
      
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
      if (count >= n) {
        return true;
      }
    }
    
    return false;
  }
  
  // 检查是否获胜
  function checkWinningCondition(row, col, player) {
    return checkConsecutivePieces(row, col, player, 5);
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
      const randomIndex = Math.floor(Math.random() * strategicPositions.length);
      return strategicPositions[randomIndex];
    } else if (allEmptyPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * allEmptyPositions.length);
      return allEmptyPositions[randomIndex];
    }
    
    return null;
  }
  
  // 检查周围是否有棋子
  function hasAdjacentPiece(row, col) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        
        const r = row + dr;
        const c = col + dc;
        
        if (r >= 1 && r <= rows.value && c >= 1 && c <= cols.value) {
          if (!boxMap.get(`row${r}col${c}`)?.empty) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  return {
    isAIMode,
    aiDifficulty,
    toggleAIMode,
    setAIDifficulty,
    aiMove
  };
}