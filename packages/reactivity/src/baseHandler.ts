import { isObject, ReactiveFlags } from '@vue/shared'
import { reactive } from './reactive'
import { track, trigger } from './effect'

export const mutableHandlers = {
  // 这里可以监控到用户取值了
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    track(target, 'get', key)
    let res = Reflect.get(target, key, receiver)

    // @issue4
    // 深度代理实现, 性能好 取值就可以进行代理
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  },

  // 这里可以监控到用户设置值了
  set(target, key, value, receiver) {
    // 缓存老值
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      // 值变化了，触发依赖
      trigger(target, 'set', key)
    }

    return result
  },
}
