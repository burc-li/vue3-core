import { isArray, isString, ShapeFlags } from '@vue/shared'

export const Text = Symbol('Text')

export const Fragment = Symbol('Fragment')

// 判断是否是虚拟节点
export function isVnode(value) {
  return !!(value && value.__v_isVnode)
}

// 判断两个虚拟节点是否是相同节点，标签名相同 && key是一样的
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

// 虚拟节点有很多：组件的、元素的、文本的   h('h1')、h('h1','hello')、h('h1',[h('span')])
export function createVnode(type, props, children = null) {
  // 组合方案，我想知道一个元素中包含的是多个儿子还是一个儿子，利用标识shapeFlag
  // 如果type是字符串，则shapeFlag置为1，代表是元素；否则shapeFlag默认先置为0
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
