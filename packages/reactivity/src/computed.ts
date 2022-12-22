import { isFunction } from '@vue/shared'
import { ReactiveEffect, trackEffects, triggerEffects } from './effect'

/**
 * @issue1 computed参数兼容只传getter方法和handler对象
 * @issue2 缓存，只要依赖的变量值没有发生变化，就取缓存中的值
 * @issue3 嵌套effect，firname -> fullName -> effect
 */
class ComputedRefImpl {
  public effect
  public _dirty = true // 默认应该取值的时候进行计算
  public _value
  public dep = new Set()
  public __v_isReadonly = true
  public __v_isRef = true
  constructor(public getter, public setter) {
    // 我们将用户的getter放到effect中，这里面firstname和lastname就会被这个effect收集起来
    this.effect = new ReactiveEffect(getter, () => {
      // 稍后依赖的属性变化会执行此调度函数
      if (!this._dirty) {
        this._dirty = true
        // 实现一个触发更新 @issue3
        triggerEffects(this.dep)
      }
    })
  }
  // 类中的访问器属性 底层就是Object.defineProperty
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get
  get value() {
    // 做依赖收集 @issue3
    trackEffects(this.dep)
    // @issue2
    if (this._dirty) {
      // 说明这个值是脏的
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}

export const computed = getterOrOptions => {
  let onlyGetter = isFunction(getterOrOptions)

  let getter
  let setter
  // @issue1
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('no set')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }
  return new ComputedRefImpl(getter, setter)
}
