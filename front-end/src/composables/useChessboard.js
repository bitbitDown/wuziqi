import { ref, computed } from 'vue';

export function useChessboard(socket, active, disabled, resetGame) {
  // 行数和列数
  const rows = ref(12);
  const cols = ref(12);

  // 初始化棋盘
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

  // 检查格子是否为空
  const isEmpty = (row, col) => {
    return boxMap.get(`row${row}col${col}`)?.empty;
  };

  // 检查格子属于谁
  const belongsToWho = (row, col) => {
    return boxMap.get(`row${row}col${col}`)?.belongsTo;
  };

  // 初始化位置样式
  function initLocaltion(location) {
    return {
      position: "absolute",
      top: "-50%",
      [location === "left-top" ? "left" : "right"]: "-50%",
    };
  }

  // 获取单元格样式
  function getCellStyle(row, col) {
    const prop = "1px solid #655b51";
    const style = {
      "border-left": prop,
      "border-top": prop,
    };
    row === rows.value && (style["border-bottom"] = prop);
    col === cols.value && (style["border-right"] = prop);
    return style;
  }

  // 获取点击的角落
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

  // 发送棋盘信息
  function emitChessboard(location, belongsTo) {
    socket.emit("chessboard", { location, belongsTo }, (data) => {
      console.log("chessboard:", data);
    });
  }

  // 放下棋子
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
        resetGame();
      } else {
        active.value =
          active.value === "whitePlayer" ? "blackPlayer" : "whitePlayer";
      }
    }
  }

  // 判断是否获胜
  function validSuccess(row, col, active) {
    // 检查水平方向
    let count = 1;

    // 水平方向最小列，最大列，默认已经有一个棋子了，所以只需要增减4
    const minCol = col - 4 > 0 ? col - 4 : 0;
    const maxCol = col + 4 < cols.value ? col + 4 : cols.value;

    // 水平方向最小列，最大列
    const minRow = row - 4 > 0 ? row - 4 : 0;
    const maxRow = row + 4 < rows.value ? row + 4 : rows.value;

    //向左检查
    for (
      let i = col - 1;
      i >= minCol && boxMap.get(`row${row}col${i}`)?.belongsTo === active;
      i--
    ) {
      count++;
      if (count === 5) return true;
    }
    for (
      let i = col + 1;
      i <= maxCol && boxMap.get(`row${row}col${i}`)?.belongsTo === active;
      i++
    ) {
      count++;
      if (count === 5) return true;
    }

    // 检查垂直方向
    count = 1;

    for (
      let i = row - 1;
      i >= minRow && boxMap.get(`row${i}col${col}`)?.belongsTo === active;
      i--
    ) {
      count++;
      if (count === 5) return true;
    }
    for (
      let i = row + 1;
      i <= maxRow && boxMap.get(`row${i}col${col}`)?.belongsTo === active;
      i++
    ) {
      count++;
      if (count === 5) return true;
    }
    // 检查斜线方向（左上到右下）
    count = 1;
    for (
      let i = 1;
      row - i >= minRow &&
      col - i >= minCol &&
      boxMap.get(`row${row - i}col${col - i}`)?.belongsTo === active;
      i++
    ) {
      count++;
    }
    for (
      let i = 1;
      row + i <= maxRow &&
      col + i <= maxCol &&
      boxMap.get(`row${row + i}col${col + i}`)?.belongsTo === active;
      i++
    ) {
      count++;
    }
    if (count >= 5) return true;

    // 检查斜线方向（右上到左下）
    count = 1;
    for (
      let i = 1;
      row - i >= minRow &&
      col + i <= maxCol &&
      boxMap.get(`row${row - i}col${col + i}`)?.belongsTo === active;
      i++
    ) {
      count++;
    }
    for (
      let i = 1;
      row + i <= maxRow &&
      col - i >= minCol &&
      boxMap.get(`row${row + i}col${col - i}`)?.belongsTo === active;
      i++
    ) {
      count++;
    }
    if (count >= 5) return true;

    return false;
  }

  // 重置棋盘
  function resetChessboard() {
    for (let r = 1; r <= rows.value; r++) {
      for (let c = 1; c <= cols.value + 1; c++) {
        boxMap.set(`row${r}col${c}`, { empty: true, belongsTo: null });
      }
    }
  }

  return {
    rows,
    cols,
    boxMap,
    isEmpty,
    belongsToWho,
    putDownPiece,
    validSuccess,
    getCellStyle,
    initLocaltion,
    emitChessboard,
    resetChessboard
  };
}