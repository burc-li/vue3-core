import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

// 循环引用示例
// let b: any = {}
// let a = {
//   b: b,
// }
// b.a = a

/**
 * @desc 递归循环读取数据
 * @issue1 考虑对象中有循环引用的问题
 */
function traversal(value, set = new Set()) {
  // 第一步递归要有终结条件，不是对象就不在递归了
  if (!isObject(value)) return value

  // @issue1 处理循环引用
  if (set.has(value)) {
    return value
  }
  set.add(value)

  for (let key in value) {
    traversal(value[key], set)
  }
  return value
}

/**
 * @desc watch
 * @issue1 考虑对象中有循环引用的问题
 * @issue2 兼容数据源为响应式对象和getter函数的情况
 * @issue3 immediate 立即执行
 * @issue4 onCleanup：用于注册副作用清理的回调函数。该回调函数会在副作用下一次重新执行前调用，可以用来清除无效的副作用，例如等待中的异步请求
 */
// source 是用户传入的对象, cb 就是对应的回调
export function watch(source, cb, { immediate } = {} as any) {
  let getter

  // @issue2
  // 是响应式数据
  if (isReactive(source)) {
    // 递归循环，只要循环就会访问对象上的每一个属性，访问属性的时候会收集effect
    getter = () => traversal(source)
  } else if (isFunction(source)) {
    getter = source
  } else {
    return
  }

  // 保存用户的函数
  let cleanup
  const onCleanup = fn => {
    cleanup = fn
  }

  let oldValue
  const scheduler = () => {
    // @issue4 下一次watch开始触发上一次watch的清理
    if (cleanup) cleanup()
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  // 在effect中访问属性就会依赖收集
  const effect = new ReactiveEffect(getter, scheduler) // 监控自己构造的函数，变化后重新执行scheduler

  // @issue3
  if (immediate) {
    // 需要立即执行，则立刻执行任务
    scheduler()
  }
  oldValue = effect.run()
}
// watch = effect 内部会保存老值和新值调用方法
