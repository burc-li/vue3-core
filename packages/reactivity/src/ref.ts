import { isArray, isObject } from '@vue/shared'
import { trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

// 如果是对象和数组，则转化为响应式对象
function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

/**
 * @desc RefImpl
 * @issue1 如果是对象和数组，则转化为响应式对象
 */
class RefImpl {
  // ref标识
  public __v_isRef = true
  // 存储effect
  public dep = new Set()
  public _value
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    // 取值的时候收集依赖
    trackEffects(this.dep)
    return this._value
  }
  set value(newValue) {
    // 新旧值不相等
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      // 设置值的时候触发依赖
      triggerEffects(this.dep)
    }
  }
}

// 接受一个内部值，返回一个响应式的、可更改的 ref 对象，此对象只有一个指向其内部值的属性 .value。
export function ref(value) {
  return new RefImpl(value)
}

class ObjectRefImpl {
  // 只是将.value属性代理到原始类型上
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key]
  }
  set value(newValue) {
    this.object[this.key] = newValue
  }
}

// 基于响应式对象上的一个属性，创建一个对应的 ref。这样创建的 ref 与其源属性保持同步：改变源属性的值将更新 ref 的值，反之亦然。
export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

// 将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。每个单独的 ref 都是使用 toRef() 创建的。
export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {}

  for (let key in object) {
    result[key] = toRef(object, key)
  }

  return result
}

export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, recevier) {
      let r = Reflect.get(target, key, recevier)
      return r.__v_isRef ? r.value : r
    },
    set(target, key, value, recevier) {
      let oldValue = target[key]
      if (oldValue.__v_isRef) {
        oldValue.value = value
        return true
      } else {
        return Reflect.set(target, key, value, recevier)
      }
    },
  })
}
