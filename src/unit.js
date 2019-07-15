import {Element} from './Element';
import $ from 'jquery';

class Unit {
  constructor(element) {
    this._currentElement = element;
  }

  getMarkUp() {
    throw new Error('can\'t be call');
  }
}

class TextUnit extends Unit {
  update(nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      $(`[data-reactid="${this._reactid}"]`).html(this._currentElement);
    }
  }

  getMarkUp(reactid) {
    this._reactid = reactid;
    return `<span data-reactid="${reactid}">${this._currentElement}</span>`;
  }
}

class NativeUnit extends Unit {
  getMarkUp(reactid) {
    this._reactid = reactid;
    const {type, props} = this._currentElement;

    let startTag = `<${type} data-reactid="${this._reactid}"`;
    const endTag = `</${type}>`;
    let childString = '';

    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) {
        const eventName = propName.slice(2).toLowerCase();
        // 第二个参数是命名空间，方便取消事件代理
        $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, props[propName]);
      } else if (propName === 'style') {
        const styleObj = props[propName];

        const styles = Object.keys(styleObj).map((key) => {
          const middle = key.replace(/([A-Z])/g, (m, $1) => `-${$1.toLowerCase()}`);
          return `${middle}:${styleObj[key]}`;
        }).join(';');

        startTag = `${startTag} style=${styles}`;
      } else if (propName === 'className') {
        startTag = `${startTag} class=${props[propName]}`;
      } else if (propName === 'children') {
        const children = props[propName];
        children.forEach((child, index) => {
          const childUnit = createUnit(child);
          const childMarkUp = childUnit.getMarkUp(`${this._reactid}.${index}`);
          childString = `${childString}${childMarkUp}`;
        })
      } else {
        if (propName !== '__source' && propName !== '__self') {
          startTag = `${startTag} ${propName}=${props[propName]}`;
        }
      }
    }
    return `${startTag}>${childString}${endTag}`;
  }
}

function shouldDeepCompare(prevElement, nextElement) {
  const prevType = typeof prevElement;
  const nextType = typeof nextElement;

  //如果新老节点都是文本可以进行比较
  if ((prevType === 'string' || prevType === 'number') && (nextType === 'string' || nextType === 'number')) {
    return true;
  }
  if (prevElement instanceof Element && nextElement instanceof Element) {
    return prevElement.type === nextElement.type;
  }

  return false;
}

class CompositeUnit extends Unit {
  update(nextElement, partialState) {
    this._currentElement = nextElement || this._currentElement;
    const nextState = this._componentInstance.state = Object.assign(this._componentInstance.state, partialState);
    const nextProps = this._currentElement.props;

    if (this._componentInstance.shouldComponentUpdate &&
      this._componentInstance.shouldComponentUpdate(nextProps, nextState) === false) {
      return;
    }

    const preRenderedInstance = this._renderedUnitInstance;
    const prevRenderedElement = preRenderedInstance._currentElement;
    const nextRenderElement = this._componentInstance.render();

    // type一样，就可以shouldDeepCompare，否则就直接干掉重建
    if (shouldDeepCompare(prevRenderedElement, nextRenderElement)) {
      preRenderedInstance.update(nextRenderElement);
      this._componentInstance.componentDidUpdate && this._componentInstance.componentDidUpdate();
    } else {
      this._renderedUnitInstance = createUnit(nextRenderElement);
      let nextMarkUp = this._renderedUnitInstance.getMarkUp(this._reactid);
      //替换整个节点
      $(`[data-reactid="${this._reactid}"]`).replaceWith(nextMarkUp);
    }
  }

  getMarkUp(reactid) {
    this._reactid = reactid;
    const {type: Component, props} = this._currentElement;
    // 记下组件实例，后边有用
    const componentInstance = this._componentInstance = new Component(props);

    // 记下CompositeUnit实例，后边有用
    componentInstance.currentUnit = this;

    componentInstance.componentWillMount && componentInstance.componentWillMount();

    const renderedElement = componentInstance.render();

    // 记下createUnit返回的实例，后边有用
    const renderedUnitInstance = this._renderedUnitInstance = createUnit(renderedElement);
    const renderedMarkUp = renderedUnitInstance.getMarkUp(this._reactid);

    $(document).on('mounted', () => {
      componentInstance.componentDidMount && componentInstance.componentDidMount();
    });
    return renderedMarkUp;
  }
}

function createUnit(element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return new TextUnit(element);
  }

  // DOM节点
  if (element instanceof Element && typeof element.type === 'string') {
    return new NativeUnit(element);
  }

  // 自定义组件
  if (element instanceof Element && typeof element.type === 'function') {
    return new CompositeUnit(element);
  }
}

export {
  createUnit,
}
