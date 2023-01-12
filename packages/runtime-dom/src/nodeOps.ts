/**
 * @desc 这里存放常见DOM操作API，不同运行时提供的具体实现不一样，最终将操作方法传递到runtime-core中，所以runtime-core不需要关心平台相关代码
 */
export const nodeOps = {
  // 添加节点
  insert(child, parent, anchor = null) {
    // insertBefore(newNode, referenceNode) 在参考节点之前插入一个拥有指定父节点的子节点
    // 如果给定的子节点是对文档中现有节点的引用，insertBefore() 会将其从当前位置移动到新位置（在将节点附加到其他节点之前，不需要从其父节点删除该节点）
    parent.insertBefore(child, anchor)
  },
  // 删除节点
  remove(child) {
    // parentNode 属性可返回某节点的父节点，如果指定的节点没有父节点则返回 null
    const parentNode = child.parentNode
    if (parentNode) {
      parentNode.removeChild(child)
    }
  },
  // 创建节点
  createElement(tagName) {
    return document.createElement(tagName)
  },
  // 创建文本
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置文本节点内容
  setElementText(el, text) {
    el.textContent = text
  },
  // 设置文本元素中的内容
  setText(node, text) {
    // document.createTextNode()
    node.nodeValue = text
  },
  // 搜索节点
  querySelector(selector) {
    return document.querySelector(selector)
  },
  // 父亲节点
  parentNode(node) {
    return node.parentNode
  },
  // 下一个兄弟节点
  nextSibling(node) {
    return node.nextSibling
  },
}

// textContent 和 nodeValue 的区别
// setElementText - textContent
// var h = document.createElement('H1')
// var t = document.createTextNode('Hello World')
// h.appendChild(t)
// document.body.appendChild(h)
// h.textContent = 'bbb'

// setText - nodeValue
// var h = document.createElement('H1')
// var t = document.createTextNode('Hello World')
// h.appendChild(t)
// document.body.appendChild(h)
// t.nodeValue = 'bbb'
