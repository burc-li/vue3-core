/**
 * @name 对比ClassName
 * @desc nextValue存在，则设置className；否则移除className
 */
export function patchClass(el, nextValue) {
  if (nextValue) {
    el.className = nextValue // 设置class
  } else {
    el.removeAttribute('class') // 移除class
  }
}
