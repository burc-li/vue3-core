import { ShapeFlags, isString } from '@vue/shared'
import { Text, isSameVnode, createVnode } from './vnode'

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
  // Text： Symbol类型值，标识文本类型的虚拟DOM
  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i])
      // 处理后进行替换
      children[i] = vnode
    }
    return children[i]
  }

  // 递归初始化子节点
  // children 中的每一项都是一个虚拟DOM
  const mountChildren = (children, container) => {
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
      mountChildren(vnode.children, el)
    }

    // 将el插入到container容器中
    hostInsert(el, container)
  }

  // 删除所有的子节点
  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  // 卸载节点
  const unmount = vnode => {
    hostRemove(vnode.el)
  }

  // 处理文本，初始化文本和patch文本
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      // 初始化文本
      const el = (n2.el = hostCreateText(n2.children))
      hostInsert(el, container)
    } else {
      // patch文本，文本的内容变化了，我可以复用老的节点
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children) // 文本的更新
      }
    }
  }

  // 处理元素，初始化元素和patch元素
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 初始化元素
      mountElement(n2, container)
    } else {
      // patch元素
      patchElement(n1, n2)
    }
  }

  const patchKeyedChildren = (c1, c2, el) => {}

  // 对比属性打补丁
  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      // 新的里面有，直接用新的盖掉即可
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    for (let key in oldProps) {
      // 如果老的里面有新的没有，则是删除
      if (newProps[key] == null) {
        hostPatchProp(el, key, oldProps[key], undefined)
      }
    }
  }

  // 对比子节点打补丁   el: 虚拟节点对应的真实DOM元素
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children
    const prevShapeFlag = n1.shapeFlag // 之前的
    const shapeFlag = n2.shapeFlag // 之后的

    // 比较两个儿子列表的差异了
    // 新儿子 旧儿子
    // 文本  数组 （删除所有子节点，更新文本内容）
    // 文本  文本 （更新文本内容）
    // 文本  空   （更新文本内容）
    // 数组  数组 （diff算法）
    // 数组  文本 （清空文本，挂载元素）
    // 数组  空   （挂载元素）
    // 空    数组 （删除所有子节点）
    // 空    文本 （清空文本）
    // 空    空   （不做任何处理）
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 文本	数组	（删除所有子节点，更新文本内容）
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        // 文本	文本	| 文本 空 （更新文本内容）
        hostSetElementText(el, c2)
      }
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 数组 数组 （diff算法；全量比对）
        patchKeyedChildren(c1, c2, el)
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 数组 文本  清空文本，挂载元素）
          hostSetElementText(el, '')
        }
        // 数组 文本 | 数组 空 （清空文本，挂载元素）
        mountChildren(c2, el)
      }
    } else {
      // 空 数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      } else if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 空 文本
        hostSetElementText(el, '')
      }
    }
  }

  // 对比元素打补丁，先复用节点、再比较属性、再比较儿子
  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el)
    let oldProps = n1.props || {} // 对象
    let newProps = n2.props || {} // 对象

    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  //  核心的patch方法，包括初始化DOM 和 diff算法
  const patch = (n1, n2, container) => {
    if (n1 == n2) return

    // 判断两个元素是否相同，不相同卸载在添加
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1) // 删除老的
      n1 = null
    }

    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container)
        }
    }
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

// 1) 更新的逻辑思考：
// - 如果前后元素不一致，删除老节点 添加新节点
// - 如果前后元素一致， 复用节点； 再比较两个元素的属性和孩子节点
