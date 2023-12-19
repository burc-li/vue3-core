export const isObject = function (value) {
  return typeof value === 'object' && value !== null
}
export const isString = value => {
  return typeof value === 'string'
}
export const isNumber = value => {
  return typeof value === 'number'
}
export const isFunction = value => {
  return typeof value === 'function'
}

export const isArray = Array.isArray
export const assign = Object.assign


export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_REF = '__v_isRef',
}

// vue3提供的形状标识
// << 左移运算符：各二进制位全部左移若干位，左边丢弃，右边补0
// |  按位或运算符-或：两位中有一个为1，结果就为1
// &  按位与运算符-与：两位同时为1，结果才为1，否则为0
export const enum ShapeFlags {
  ELEMENT = 1, // 表示一个普通的HTML元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 有状态组件
  TEXT_CHILDREN = 1 << 3, // 子节点是文本
  ARRAY_CHILDREN = 1 << 4, // 子节点是数组
  SLOTS_CHILDREN = 1 << 5, // 子节点是插槽
  TELEPORT = 1 << 6, // 表示vnode描述的是个teleport组件
  SUSPENSE = 1 << 7, // 表示vnode描述的是个suspense组件
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 表示需要被keep-live的有状态组件
  COMPONENT_KEPT_ALIVE = 1 << 9, // 已经被keep-live的有状态组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 组件，有状态组件和函数式组件的统称
}
// 因为我们每个枚举项都是2的N次方值，所以位运算 & | 就适合权限的组合，let permissions = ADD | DELETE
// &运算结果为0，没有此权限，permissions&UPDATE = 0
// &运算结果大于0，有此权限，permissions&ADD > 0
