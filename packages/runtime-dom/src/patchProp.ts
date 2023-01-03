import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/event'
import { patchAttr } from './modules/attr'

// DOM属性的操作API
// 新增属性：null，值
// 修改属性：值，值
// 删除属性：值，null
export function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    // 类名  el.className
    patchClass(el, nextValue)
    // el  style {color:'red',fontSzie:'12'}  {color:'blue',background:"red"}
  } else if (key === 'style') {
    // 样式  el.style
    patchStyle(el, prevValue, nextValue)
  } else if (/^on[^a-z]/.test(key)) {
    // 事件-events  addEventListener 事件名规则：on+驼峰命名法 onClick onMouse 自定义事件名：on88click on@%click  onCClick
    patchEvent(el, key, nextValue)
  } else {
    // 普通属性  el.setAttribute
    patchAttr(el, key, nextValue)
  }
}

// for(let key in obj){
//     patchProp(el,key,null,obj[key])
// }
