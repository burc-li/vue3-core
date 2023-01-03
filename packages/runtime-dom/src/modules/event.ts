function createInvoker(callback) {
  const invoker = e => invoker.value(e)
  invoker.value = callback
  return invoker
}
// remove -> add 可以先移除掉事件，再重新绑定事件，这种方法不友好，会频繁绑定事件，移除事件，性能浪费
// add + 自定义事件 （里面调用绑定的方法），对同一个事件的不同方法进行了优化，例如：
// 第一次绑定了onClick事件 "a"    el._vei = {click:onClick}  el.addEventListener(click,(e) => a(e); )
// 第二次绑定了onClick事件 "b"    el._vei = {click:onClick}  el.addEventListener(click,(e) => b(e); )
// 第三次绑定了onClick事件 null   el.removeEventListener(click,(e) => b(e); )  el._vei ={}
export function patchEvent(el, eventName, nextValue) {
  // _vei缓存事件绑定，缓存到了当前dom上 _vei = vue event invokers
  let invokers = el._vei || (el._vei = {})
  let exits = invokers[eventName] // 先看有没有缓存过
  if (exits && nextValue) {
    // 已经绑定过事件了
    exits.value = nextValue // 没有卸载函数 只是改了invoker.value 属性
  } else if (exits && !nextValue) {
    // 如果绑定的是一个空
    // 如果有老值，需要将老的绑定事件移除掉
    el.removeEventListener(event, exits)
    invokers[eventName] = undefined
  } else if (!exits && nextValue) {
    // onClick = click
    let event = eventName.slice(2).toLowerCase()
    const invoker = (invokers[eventName] = createInvoker(nextValue))
    el.addEventListener(event, invoker)
  }
}
