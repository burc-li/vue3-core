import { isArray, isString, ShapeFlags } from '@vue/shared'
export const Text = Symbol('Text')

// 判断是否是虚拟节点
export function isVnode(value) {
  return !!(value && value.__v_isVnode)
}

// 虚拟节点有很多：组件的、元素的、文本的   h('h1')、h('h1','hello')、h('h1',[h('span')])
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag  我想知道一个元素中包含的是多个儿子还是一个儿子  标识
  // 如果type是字符串，则shapeFlag是元素-1，否则shapeFlag默认先置为0
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

  // 虚拟dom就是一个对象，后续diff算法。 真实dom的属性比较多，使用真实DOM对比性能会很差
  const vnode = {
    type,
    props,
    children,
    el: null, // 虚拟节点上对应的真实节点，后续diff算法
    key: props?.key,
    __v_isVnode: true, // 标识是否是一个虚拟DOM
    shapeFlag,
  }

  if (children) {
    let type = 0
    if (isArray(children)) {
      // 子节点是数组
      type = ShapeFlags.ARRAY_CHILDREN
    } else {
      // 子节点是文本
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag = vnode.shapeFlag | type
  }

  return vnode
}
