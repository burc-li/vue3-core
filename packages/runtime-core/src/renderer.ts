import { ShapeFlags, isString } from '@vue/shared'
import { Text, createVnode } from './vnode'

export function createRenderer(renderOptions) {
  let {
    // 增加 删除 修改 查询
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
    patchProp: hostPatchProp,
  } = renderOptions

  // children[i] 若是字符串，则转换为虚拟DOM；若是虚拟DOM，则不做处理直接返回
  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i])
      children[i] = vnode
    }
    return children[i]
  }

  // 递归初始化子节点
  // children 中的每一项都是一个虚拟DOM
  const mountChildren = (container, children) => {
    for (let i = 0; i < children.length; i++) {
      // 处理children[i]，将字符转转化为虚拟DOM
      let child = normalize(children, i)
      patch(null, child, container)
    }
  }

  // 初始化DOM
  const mountElement = (vnode, container) => {
    const { type, props, shapeFlag } = vnode
    // 创建真实元素，挂载到虚拟节点上
    let el = (vnode.el = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        // 更新元素属性
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // children是文本
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // children是数组-多个儿子
      mountChildren(el, vnode.children)
    }

    // 将el插入到container容器中
    hostInsert(el, container)
  }

  // 初始化文本
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      const el = (n2.el = hostCreateText(n2.children))
      hostInsert(el, container)
    } else {
    }
  }

  //  核心的patch方法，包括初始化DOM 和 diff算法
  const patch = (n1, n2, container) => {
    if (n1 == n2) {
      return
    }

    if (n1 == null) {
      const { type, shapeFlag } = n2
      switch (type) {
        case Text:
          processText(n1, n2, container)
          break
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            // 初始化DOM
            mountElement(n2, container)
          }
      }
    } else {
      // diff算法
    }
  }

  // 卸载节点
  const unmount = vnode => {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        // 之前渲染过，卸载DOM
        unmount(container._vnode)
      }
    } else {
      // 初始化 和 更新DOM
      patch(container._vnode || null, vnode, container)
    }
    // 缓存虚拟DOM，将其挂载到容器上
    container._vnode = vnode
  }
  return {
    render,
  }
}
