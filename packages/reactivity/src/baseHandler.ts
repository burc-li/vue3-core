// import { isObject } from "@vue/shared";
// import { reactive } from "./reactive";
import { track, trigger } from './effect'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}
export const mutableHandlers = {
  // 这里可以监控到用户取值了
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    track(target, 'get', key)

    let res = Reflect.get(target, key, receiver)

    // if(isObject(res)){
    //     return reactive(res); // 深度代理实现, 性能好 取值就可以进行代理
    // }
    return res
  },
  // 这里可以监控到用户设置值了
  set(target, key, value, receiver) {
    // 老值
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      // 值变化了，要更新
      trigger(target, 'set', key, value, oldValue)
    }

    return result
  },
}
