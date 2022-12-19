import { isObject } from '@vue/shared'
import { mutableHandlers, ReactiveFlags } from './baseHandler'

// key只能是对象；弱引用，更有效的垃圾回收、释放内存 - https://www.zhangxinxu.com/wordpress/2021/08/js-weakmap-es6/
const reactiveMap = new WeakMap()

/**
 *
 * @desc 将数据转化成响应式的数据
 * @issue1 只能做对象的代理，不是对象，return
 * @issue2 代理对象被再次代理 可以直接返回
 * @issue3 同一个对象代理多次，返回同一个代理
 * @issue4 嵌套对象深度代理
 */
export function reactive(target) {
  // issue1
  if (!isObject(target)) {
    return
  }

  // issue2
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // issue3
  let existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 第一次普通对象代理，我们会通过new Proxy代理一次
  // 下一次你传递的是proxy 我们可以看一下他有没有代理过，如果访问这个proxy，有get方法的时候说明就代理过了
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}

// --------------------------------------
// let target = {
//     name:'柏成',
//     get alias(){
//         return this.name
//     }
// }
// const proxy = new Proxy(target,{
//     get(target,key,receiver){
//         console.log(key);
//         // 去代理对象上取值 就走get
//         // return target[key];
//         return Reflect.get(target,key,receiver)
//     },
//     set(target,key,value,receiver){
//         // 去代理上设置值 执行set
//         return Reflect.set(target,key,value,receiver);
//     }
// });
// proxy.alias;
// 去alais上取了值时，也去了name，当时没有监控到name
// 我在页面中使用了alias对应的值，稍后name变化了 要重新渲染么？
