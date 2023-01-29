// 贪心算法 + 二分查找

// start@1**************************************************
// 3 2 8 9 5 6 7 11 15 ->  求最长递增子序列的个数

// 2 8 9 11 15 (不是最长递增子序列)
// 2 5 6 7 11 15 (最长递增子序列)

// 找更有潜力的
// 3
// 2 （2替换掉3）
// 2 8
// 2 8 9
// 2 5 9 （5替换掉8，二分查找，找到第一个比5大的进行替换）（仅大于当前值的：所有大于当前值的结果中的最小值）
// 2 5 6 （6替换掉9，二分查找，找到第一个比6大的进行替换）（仅大于当前值的：所有大于当前值的结果中的最小值）
// 2 5 6 7 11 15 (最长递增子序列)
// end@1**************************************************

// start@2**************************************************
// 3 2 8 9 5 6 7 11 15 4 ->  求最长递增子序列的个数

// 现在有个问题，如果序列最后加一个数字4，此算法求得结果为 2 4 6 7 11 15
// 虽然序列不对，但是序列长度是没问题的
// 2 5 6 7 11 15
// end@1**************************************************

// 1.思路就是当前这一项比我们最后一项大则直接放到末尾
// 2.如果当前这一项比最后一项小，需要在序列中通过二分查找找到比当前大的这一项，用他来替换掉
// 3.前驱节点追溯，替换掉错误的节点

// 实现思路1,2,3
function getSequence(arr) {
  const len = arr.length
  const result = [0] // 默认以数组中第0个为基准来做序列，注意！！存放的是数组 索引
  let resultLastIndex // 结果集中最后的索引
  let start
  let end
  let middle
  const p = new Array(len).fill(0) // 最后要标记索引 放的东西不用关心，但是要和数组一样长

  for (let i = 0; i < len; i++) {
    let arrI = arr[i]
    /** 当前这一项比我们最后一项大则直接放到末尾 */
    if (arrI !== 0) {
      // 因为在vue newIndexToOldIndexMap 中，0代表需要创建新元素，无需进行位置移动操作
      resultLastIndex = result[result.length - 1]
      if (arrI > arr[resultLastIndex]) {
        // 比较当前项和最后一项的值，如果大于最后一项，则将当前索引添加到结果集中
        result.push(i) // 记录索引
        p[i] = resultLastIndex // 当前放到末尾的要记录他前面的索引，用于追溯
        continue
      }

      /**这里我们需要通过二分查找，在结果集中找到仅大于当前值的（所有大于当前值的结果中的最小值），用当前值的索引将其替换掉 */
      // 递增序列 采用二分查找 是最快的
      start = 0
      end = result.length - 1
      while (start < end) {
        // start === end的时候就停止了  .. 这个二分查找在找索引
        middle = ((start + end) / 2) | 0 // 向下取整
        // 1 2 3 4 middle 6 7 8 9   6
        if (arrI > arr[result[middle]]) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      // 找到中间值后，我们需要做替换操作  start / end
      if (arrI < arr[result[end]]) {
        // 这里用当前这一项 替换掉以有的比当前大的那一项。 更有潜力的我需要他
        result[end] = i
        p[i] = result[end - 1] // 记住他的前一个人是谁
      }
    }
  }

  // 1) 默认追加记录前驱索引 p[i] = resultLastIndex
  // 2) 替换之后记录前驱索引 p[i] = result[end - 1]
  // 3) 记录每个人的前驱节点
  // 通过最后一项进行回溯
  let i = result.length
  let last = result[i - 1] // 找到最后一项
  while (i > 0) {
    i--
    // 倒叙追溯
    result[i] = last // 最后一项是确定的
    last = p[last]
    
  }
  return result
}

const res = getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4])
console.log('-----',res)
