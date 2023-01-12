var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Text: () => Text,
    createRenderer: () => createRenderer,
    createVnode: () => createVnode,
    h: () => h,
    isSameVnode: () => isSameVnode,
    isVnode: () => isVnode,
    render: () => render
  });

  // packages/shared/src/index.ts
  var isObject = function(value) {
    return typeof value === "object" && value !== null;
  };
  var isString = (value) => {
    return typeof value === "string";
  };
  var isArray = Array.isArray;

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  function isVnode(value) {
    return !!(value && value.__v_isVnode);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function createVnode(type, props, children = null) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
    const vnode = {
      type,
      props,
      children,
      el: null,
      key: props == null ? void 0 : props.key,
      __v_isVnode: true,
      shapeFlag
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else {
        children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag = vnode.shapeFlag | type2;
    }
    return vnode;
  }

  // packages/runtime-core/src/renderer.ts
  function createRenderer(renderOptions2) {
    let {
      insert: hostInsert,
      remove: hostRemove,
      setElementText: hostSetElementText,
      setText: hostSetText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling,
      createElement: hostCreateElement,
      createText: hostCreateText,
      patchProp: hostPatchProp
    } = renderOptions2;
    const normalize = (children, i) => {
      if (isString(children[i])) {
        let vnode = createVnode(Text, null, children[i]);
        children[i] = vnode;
      }
      return children[i];
    };
    const mountChildren = (children, container) => {
      for (let i = 0; i < children.length; i++) {
        let child = normalize(children, i);
        patch(null, child, container);
      }
    };
    const mountElement = (vnode, container, anchor) => {
      const { type, props, shapeFlag } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, vnode.children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(vnode.children, el);
      }
      hostInsert(el, container, anchor);
    };
    const unmountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unmount(children[i]);
      }
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const processText = (n1, n2, container) => {
      if (n1 === null) {
        const el = n2.el = hostCreateText(n2.children);
        hostInsert(el, container);
      } else {
        const el = n2.el = n1.el;
        if (n1.children !== n2.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const processElement = (n1, n2, container, anchor) => {
      if (n1 === null) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2);
      }
    };
    const patchKeyedChildren = (c1, c2, container) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], container, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unmount(c1[i]);
            i++;
          }
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 <= e2; i2++) {
        keyToNewIndexMap.set(c2[i2].key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex == void 0) {
          unmount(oldChild);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], container);
        }
      }
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        let index = i2 + s2;
        let current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (newIndexToOldIndexMap[i2] === 0) {
          patch(null, current, container, anchor);
        } else {
          hostInsert(current.el, container, anchor);
        }
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (newProps[key] == null) {
          hostPatchProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const patchChildren = (n1, n2, el) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(el, c2);
        }
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyedChildren(c1, c2, el);
        } else {
          if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          mountChildren(c2, el);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        } else if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
      }
    };
    const patchElement = (n1, n2) => {
      let el = n2.el = n1.el;
      let oldProps = n1.props || {};
      let newProps = n2.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(n1, n2, el);
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 == n2)
        return;
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          }
      }
    };
    const render2 = (vnode, container) => {
      if (vnode == null) {
        if (container._vnode) {
          unmount(container._vnode);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    return {
      render: render2
    };
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsOrChildren, children) {
    const len = arguments.length;
    if (len === 2) {
      if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVnode(propsOrChildren)) {
          return createVnode(type, null, [propsOrChildren]);
        }
        return createVnode(type, propsOrChildren);
      } else {
        return createVnode(type, null, propsOrChildren);
      }
    } else {
      if (len > 3) {
        children = Array.from(arguments).slice(2);
      } else if (len === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    }
  };

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue) {
      el.className = nextValue;
    } else {
      el.removeAttribute("class");
    }
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue = {}) {
    for (let key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (prevValue) {
      for (let key in prevValue) {
        if (!nextValue[key]) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else if (exits && !nextValue) {
      el.removeEventListener(event, exits);
      invokers[eventName] = void 0;
    } else if (!exits && nextValue) {
      let event2 = eventName.slice(2).toLowerCase();
      const invoker = invokers[eventName] = createInvoker(nextValue);
      el.addEventListener(event2, invoker);
    }
  }

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(renderOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
