import {Element} from './Element';
import $ from 'jquery';

let diffQueue;
let updateDepth;

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

/**
 * NativeUnit实例里的_renderedChildUnits，存了NativeUnit的第一层孩子的所有unit
 */
class NativeUnit extends Unit {
  update(nextElement) {
    const oldProps = this._currentElement.props;
    const newProps = nextElement.props;

    this.updateDOMProperties(oldProps, newProps);
    this.updateDOMChildren(nextElement.props.children);
  }

  /**
   * 更新children
   * @param newChildrenElements
   */
  updateDOMChildren(newChildrenElements) {
    this.diff(diffQueue, newChildrenElements);
  }

  diff(diffQueue, newChildrenElements) {
    let oldChildUnitsMap = this.getOldChildrenMap(this._renderedChildUnits);
    let newChildren = this.getNewChildren(oldChildUnitsMap, newChildrenElements);
  }

  /**
   *
   * @param childUnits
   */
  getOldChildrenMap(childUnits=[]){
    let map = {};
    for (let i=0; i < childUnits.length; i++){
      let key = (
        childUnits[i] &&
        childUnits[i]._currentElement &&
        childUnits[i]._currentElement.props &&
        childUnits[i]._currentElement.props.key) ||
        i.toString();
      map[key] = childUnits[i];
    }
    return map;
  }

  getNewChildren(oldChildUnitsMap, newChildrenElements) {
    const newChildren = [];

    newChildrenElements.forEach((newElement, index) => {
      const newKey = (newElement.props && newElement.props.key) || index.toString();
      const oldUnit = oldChildUnitsMap[newKey];
      const oldElement = oldUnit && oldUnit._currentElement;

      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement);
        newChildren.push(oldUnit);
      } else {
        const nextUnit = createUnit(newElement);
        newChildren.push(nextUnit);
      }
    });

    return newChildren;
  }

  /**
   * 只更新DOM的属性
   * @param oldProps
   * @param newProps
   */
  updateDOMProperties(oldProps, newProps) {
    let propName;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        $(`[data-reactid="${this._reactid}"]`).removeAttr(propName);
      }
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._reactid}`);
      }
    }

    for (propName in newProps) {
      if (propName === 'children') {
        continue;
      } else if (/^on[A-Z]/.test(propName)) {
        const eventName = propName.slice(2).toLowerCase();
        // 第二个参数是命名空间，方便取消事件代理
        $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, newProps[propName]);
      } else if (propName === 'style') {
        const styleObj = newProps[propName];

        Object.entries(styleObj).forEach(([attr, value]) => {
          $(`[data-reactid="${this._reactid}"]`).css(attr, value);
        });
      } else if (propName === 'className') {
        $(`[data-reactid="${this._reactid}"]`).attr('class', newProps[propName]);
      }else {
        $(`[data-reactid="${this._reactid}"]`).props(propName, newProps[propName]);
      }
    }
  }

  getMarkUp(reactid) {
    this._reactid = reactid;
    const {type, props} = this._currentElement;

    let startTag = `<${type} data-reactid="${this._reactid}"`;
    const endTag = `</${type}>`;
    let childString = '';
    this._renderedChildUnits = [];

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
          this._renderedChildUnits.push(childUnit);
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
  /**
   * 注意：
   *    1.复合组件实例的_currentElement是对应的组件实例的类的jsx的元素
   *    2._renderedUnitInstance是render执行后的jsx元素，传给createUnit执行后的unit实例
   *    3._renderedUnitInstance._currentElement：
   *        如果_renderedUnitInstance是CompositeUnit类型的，那_currentElement同上
   *        如果_renderedUnitInstance是NativeUnit类型的，那_currentElement就是render后的DOMjsx，_renderedUnitInstance上也就没有_componentInstance，currentUnit之类的属性了
   *        如果_renderedUnitInstance是TextUnit类型的，那_currentElement就是纯文本了，_renderedUnitInstance上也就没有_componentInstance，currentUnit之类的属性了
   * @param nextElement
   * @param partialState
   */
  update(nextElement, partialState) {
    this._currentElement = nextElement || this._currentElement;
    // this._componentInstance.state得把最新的更新了，下边this._componentInstance.render()才能render出最新的jsx
    const nextState = this._componentInstance.state = Object.assign(this._componentInstance.state, partialState);
    const nextProps = this._currentElement.props;

    if (this._componentInstance.shouldComponentUpdate &&
      this._componentInstance.shouldComponentUpdate(nextProps, nextState) === false) {
      return;
    }

    //为什么不存render的返回结果，而要存unit的实例呢？
    //1.render后的返回结果有三种可能，纯文本jsx，DOM的jsx，自定义组件的jsx
    //所以我们会把render的结果，传给createUnit，这个函数返回对应的unit实例，并会在实例里保存render的返回结果
    //所以存unit比直接只存render的返回结果更好，因为包含了
    const preRenderedInstance = this._renderedUnitInstance;
    const prevRenderedElement = preRenderedInstance._currentElement;
    const nextRenderElement = this._componentInstance.render();

    // type一样，就可以shouldDeepCompare，否则就直接干掉重建
    if (shouldDeepCompare(prevRenderedElement, nextRenderElement)) {
      // 这个update是谁，完全取决于preRenderedInstance是CompositeUnit、NativeUnit、TextUnit
      preRenderedInstance.update(nextRenderElement);
      this._componentInstance.componentDidUpdate && this._componentInstance.componentDidUpdate();
    } else {
      this._renderedUnitInstance = createUnit(nextRenderElement);
      let nextMarkUp = this._renderedUnitInstance.getMarkUp(this._reactid);
      //替换整个节点
      $(`[data-reactid="${this._reactid}"]`).replaceWith(nextMarkUp);
    }
  }

  /**
   * 复合组件getmarkup做的事情：new组件实例，执行render然后，把render的结果再createUnit
   * @param reactid
   * @returns {void|string}
   */
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
