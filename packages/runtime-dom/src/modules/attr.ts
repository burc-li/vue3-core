/**
 * @name 对比属性Attr
 * @desc nextValue存在，则设置属性；否则移除该属性
 */
export function patchAttr(el, key, nextValue) {
  if (nextValue) {
    el.setAttribute(key, nextValue)
  } else {
    el.removeAttribute(key)
  }
}
