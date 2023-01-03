/**
 * @name 对比Style样式
 * @desc 遍历新样式对象，用新的值直接覆盖即可；若存在旧样式对象，则遍历旧样式对象，若属性不存在于新样式对象中，则删除改属性
 */
export function patchStyle(el, prevValue, nextValue = {}) {
  // 遍历新样式对象，用新的值直接覆盖即可
  for (let key in nextValue) {
    el.style[key] = nextValue[key]
  }

  // 若存在旧样式对象，则遍历旧样式对象，若属性不存在于新样式对象中，则删除该属性
  if (prevValue) {
    for (let key in prevValue) {
      if (!nextValue[key]) {
        el.style[key] = null
      }
    }
  }
}
