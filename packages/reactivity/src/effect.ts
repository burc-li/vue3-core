export let activeEffect = undefined

/**
 * @issue1 effect默认会先执行一次
 * @issue2 activeEffect 只在effect运行时执行track保存
 * @issue3 parent 解决effect嵌套问题
 * @issue4 双向记录  一个属性对应多个effect，一个effect对应多个属性
 * @issue5 避免由run触发trigger，递归循环
 * @issue6 分支切换 cleanupEffect
 * @issue7 分支切换 死循环，set循环中，先delete再add，会出现死循环
 * @issue8 自定义调度器 类似Vue3中的effectScope stop 和 scheduler
 */

// @issue6
// 每次执行effect的时候清理一遍依赖，再重新收集，双向清理
function cleanupEffect(effect) {
  // deps 里面装的是name对应的effect, age对应的effect
  const { deps } = effect
  for (let i = 0; i < deps.length; i++) {
    // 解除effect，重新依赖收集
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}

export class ReactiveEffect {
  // @issue3
  // 这里表示在实例上新增了parent属性，记录父级effect
  public parent = null
  // 记录effect依赖的属性
  public deps = []
  // 这个effect默认是激活状态
  public active = true

  // 用户传递的参数也会传递到this上 this.fn = fn
  constructor(public fn, public scheduler) {} // @issue8 - scheduler

  // run就是执行effect
  run() {
    // 这里表示如果是非激活的情况，只需要执行函数，不需要进行依赖收集
    if (!this.active) {
      return this.fn()
    }
    // 这里就要依赖收集了 核心就是将当前的effect 和 稍后渲染的属性关联在一起
    try {
      // 记录父级effect
      this.parent = activeEffect
      activeEffect = this
      // 这里我们需要在执行用户函数之前将之前收集的内容清空
      cleanupEffect(this) // @issue6
      // 当稍后调用取值操作的时候 就可以获取到这个全局的activeEffect了
      return this.fn() // @issue1
    } finally {
      // 还原父级effect
      activeEffect = this.parent
    }
  }
  // @issue8 - stop
  stop() {
    if (this.active) {
      this.active = false
      cleanupEffect(this) // 停止effect的收集
    }
  }
}

export function effect(fn, options: any = {}) {
  // 这里fn可以根据状态变化 重新执行， effect可以嵌套着写
  const _effect = new ReactiveEffect(fn, options.scheduler) // 创建响应式的effect @issue8 - scheduler
  _effect.run() // 默认先执行一次

  // @issue8 - stop
  // 绑定this，run方法内的this指向_effect，若不绑定，这样调用run方法时，runner()，则指向undefined
  const runner = _effect.run.bind(_effect)
  // 将effect挂载到runner函数上，调用stop方式时可以这样调用 runner.effect.stop()
  runner.effect = _effect
  return runner
}

// 对象 某个属性 -》 多个effect
// WeakMap = {对象:Map{name:Set-》effect}}
// {对象:{name:[]}}
// 多对多  一个effect对应多个属性， 一个属性对应多个effect
const targetMap = new WeakMap()
export function track(target, type, key) {
  // 我们只想在我们有activeEffect时运行这段代码
  if (!activeEffect) return // @issue2
  let depsMap = targetMap.get(target) // 第一次没有
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key) // key -> name / age
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  // 单向指的是 属性记录了effect， 反向记录，应该让effect也记录他被哪些属性收集过，这样做的好处是为了可以清理
  trackEffects(dep)
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect) // 去重了
    if (shouldTrack) {
      dep.add(activeEffect)
      // @issue4
      // 存放的是属性对应的set
      activeEffect.deps.push(dep) // 让effect记录住对应的dep， 稍后清理的时候会用到
    }
  }
}

export function trigger(target, type, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return // 触发的值不在模板中使用

  let effects = depsMap.get(key) // 找到了属性对应的effect

  // 永远在执行之前 先拷贝一份来执行， 不要关联引用
  if (effects) {
    triggerEffects(effects)
  }
}
export function triggerEffects(effects) {
  // 先拷贝，防止死循环，new Set 后产生一个新的Set
  effects = new Set(effects) // @issue7
  effects.forEach(effect => {
    // 我们在执行effect的时候 又要执行自己，那我们需要屏蔽掉，不要无限调用，【避免由activeEffect触发trigger，再次触发当前effect。 activeEffect -> fn -> set -> trigger -> 当前effect】
    // @issue5
    if (effect !== activeEffect) {
      // @issue8 - scheduler
      if (effect.scheduler) {
        effect.scheduler() // 如果用户传入了调度函数，则执行调度函数
      } else {
        effect.run() // 否则默认刷新视图
      }
    }
  })
}

// @issue3
// 解决effect嵌套问题----栈方式------------------------vue2 vue3.0初始版本
// 运行effect，此effect入栈，运行完毕，最后一个effect出栈，属性关联栈中的最后一个effect
// [e1] -> [e1,e2] -> [e1]
// effect(() => {   // activeEffect = e1
//   state.name     // name -> e1
//   effect(() => { // activeEffect = e2
//     state.age    // age -> e2
//   })
//                  // activeEffect = e1
//   state.address  // address = e1
// })

// 解决effect嵌套问题----树形结构方式----------------vue3后续版本
// 这个执行流程 就类似于一个树形结构
// effect(()=>{       // parent = null  activeEffect = e1
//   state.name       // name -> e1
//   effect(()=>{     // parent = e1  activeEffect = e2
//      state.age     // age -> e2
//      effect(()=> { // parent = e2  activeEffect = e3
//         state.sex  // sex -> e3
//      })            // activeEffect = e2
//   })               // activeEffect = e1

//   state.address    // address -> e1

//   effect(()=>{     // parent = e1   activeEffect = e4
//     state.age      // age -> e4
//   })
// })

// @issue7
// let s = new Set([1])
// s.forEach((item,idx) => {
//     console.log(item,idx)
//     s.delete(1)
//     s.add(1)
// })

// 流程
// 1) 我们先搞了一个响应式对象 new Proxy
// 2) effect 默认数据变化要能更新，我们先将正在执行的effect作为全局变量，渲染（取值）， 我们在get方法中进行依赖收集
// 3) weakmap (对象 ： map(属性：set（effect）))
// 4) 稍后用户发生数据变化，会通过对象属性来查找对应的effect集合，找到effect全部执行
