import { ShapeFlags, isString } from '@vue/shared'
import { Text, Fragment, isSameVnode, createVnode } from './vnode'
import { getSequence } from './sequence'

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
      // 处理后进行替换，卸载元素时会用到
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
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor)
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

  // 处理 Fragment，初始化文本和patch文本
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container)
    } else {
      patchChildren(n1, n2, container) // 走的是diff算法
    }
  }

  // 处理元素，初始化元素和patch元素
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 初始化元素
      mountElement(n2, container, anchor)
    } else {
      // patch元素
      patchElement(n1, n2)
    }
  }

  // diff算法；全量比对，比较两个儿子数组的差异
  const patchKeyedChildren = (c1, c2, container) => {
    let i = 0
    // 结尾位置
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // 特殊处理，尽可能减少比对元素************************************
    // sync from start 从头部开始处理 O(n)
    // (a b) c
    // (a b) d e f
    while (i <= e1 && i <= e2) {
      // 有任何一方停止循环则直接跳出
      const n1 = c1[i]
      const n2 = c2[i]
      // vnode type相同 && key相同
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container) // 这样做就是比较两个节点的属性和子节点
      } else {
        break
      }
      i++
    }

    // sync from end 从尾部开始处理 O(n)
    //     a (b c)
    // d e f (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      e1--
      e2--
    }

    // common sequence + mount 同序列加挂载
    // i要比e1大说明有新增的；i和e2之间的是新增的部分
    // (a b)
    // (a b) c d e
    //       (b c)
    // e d f (b c)
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1
          // 根据下一个人的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i], container, anchor) // 创建新节点 扔到容器中
          i++
        }
      }
    }

    // common sequence + unmount 同序列加卸载
    // i比e2大说明有要卸载的；i到e1之间的就是要卸载的
    // (a b c) d e
    // (a b c)
    // e d (a b c)
    //     (a b c)
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i])
          i++
        }
      }
    }

    // 优化完毕，尽可能减少乱序比对的节点个数************************************
    // unknown sequence 乱序比对
    // (a b) 【c d e w】 (f g)
    // (a b) 【e c d v】 (f g)
    let s1 = i
    let s2 = i
    const keyToNewIndexMap = new Map() // 新节点中 key -> newIndex 的 Map 映射表，子元素中如果存在相同的key 或者 有多个子元素没有key，值会被后面的索引覆盖
    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i)
    }
    const toBePatched = e2 - s2 + 1 // 新的节点中乱序比对总个数
    // 一个记录是否比对过的数组映射表，作用：已对比过的节点需移动位置；未对比过的节点需新创建
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
    // 循环老的乱序节点 看一下新的乱序节点里面有没有，如果有则比较差异，如果没有则要删除老节点
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i] // 老的节点
      let newIndex = keyToNewIndexMap.get(oldChild.key) // 用老的节点去新的里面找
      if (newIndex == undefined) {
        unmount(oldChild) // 多余老节点删掉
      } else {
        // 新的位置对应的老的位置，如果数组里放的值 >0 说明已经pactch过了。+1的目的：防止i为0
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 用来标记当前乱序节点索引 对应的 全部老节点的加1后的索引，最长递增子序列会用到
        patch(oldChild, c2[newIndex], container)
      }
    } // 到这只是新老属性和儿子的比对 和 多余老节点卸载操作，没有移动位置

    // 获取最长递增子序列
    let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
    let j = increasingNewIndexSequence.length - 1
    // 需要移动位置
    // 乱序节点需要移动位置，倒序遍历乱序节点
    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2 // i是乱序节点中的index，需要加上s2代表总节点中的index
      let current = c2[index] // 找到当前节点
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (newIndexToOldIndexMap[i] === 0) {
        // 创建新元素
        patch(null, current, container, anchor)
      } else {
        if (!increasingNewIndexSequence.includes(i)) {
          // 不是0，说明已经执行过patch操作了
          hostInsert(current.el, container, anchor)
        } else {
          // 跳过不需要移动的元素， 为了减少移动操作 需要这个最长递增子序列算法
          console.log('>>>>')
        }

        // if (i != increasingNewIndexSequence[j]) {
        //   // 不是0，说明已经执行过patch操作了
        //   hostInsert(current.el, container, anchor)
        // } else {
        //   // 跳过不需要移动的元素， 为了减少移动操作 需要这个最长递增子序列算法
        //   console.log('>>>>')
        //   j--
        // }
      }
      // 目前无论如何都做了一遍倒叙插入，性能浪费，可以根据刚才的数组newIndexToOldIndexMap来减少插入次数
      // 用最长递增子序列来实现，vue3新增算法，vue2在移动元素的时候则会有性能浪费
    }
  }

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
  const patch = (n1, n2, container, anchor = null) => {
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
      case Fragment: // 无用的标签
        processFragment(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
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
