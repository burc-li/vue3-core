import { isArray, isObject } from '@vue/shared'
import { createVnode, isVnode } from './vnode'

// 除了 type 外，其他参数都是可选的
// h('div')
// h('div', { id: 'foo', style: { color: 'red' } })

// children 可以是一个字符串
// h('div', { id: 'foo', style: { color: 'red' } }, 'hello')
// 多个 children
// h('div', { id: 'foo', style: { color: 'red' } }, 'hello', 'world')

// h('div', null, 'hello', 'world')
// h('div', h('span', 'hello'))
// h('div', [h('span', 'hello')])

// 第4个、第5个......参数肯定也是孩子
export function h(type, propsOrChildren, children) {
  const len = arguments.length
  // 第2个参数是属性 或者 第2个参数是children
  if (len === 2) {
    // 2个参数
    // h('div', { style: { "color"： "red"} })
    // h('div', h('span'))
    // h('div', [h('span'), h('span')] )
    // h('div', 'hello')
    // 为什么要将儿子包装成数组，因为元素可以循环创建。 文本就不需要包装成数组了
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        // 虚拟节就包装成数组
        return createVnode(type, null, [propsOrChildren]) // 单个虚拟节点
      }
      return createVnode(type, propsOrChildren) // 属性
    } else {
      return createVnode(type, null, propsOrChildren) // 多个虚拟节点数组 或 文本
    }
  } else {
    if (len > 3) {
      // 兼容多个children的情况、
      children = Array.from(arguments).slice(2)
    } else if (len === 3 && isVnode(children)) {
      // h('div', {}, h('span'))
      children = [children] // 包装成数组
    }
    // 其他
    return createVnode(type, propsOrChildren, children) // children的情况有两种 文本 / 数组
  }
}
