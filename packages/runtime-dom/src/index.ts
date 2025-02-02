import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

const renderOptions = Object.assign(nodeOps, { patchProp }) // domAPI 属性api

/**
 *
 * @param vnode 虚拟DOM
 * @param container 挂载容器
 */
export function render(vnode, container) {
  // 在创建渲染器的时候 传入选项
  createRenderer(renderOptions).render(vnode, container)
}

export * from '@vue/runtime-core'
