import {Element} from './Element';
import $ from 'jquery';

class Unit {
  constructor(element){
    this._currentElement = element;
  }

  getMarkUp() {
    throw new Error('can\'t be call');
  }
}

class TextUnit extends Unit {
  getMarkUp(reactid){
    this._reactid = reactid;
    return `<span data-reactid="${reactid}">${this._currentElement}</span>`;
  }
}

class NativeUnit extends Unit {
  getMarkUp(reactid){
    this._reactid = reactid;
    const {type, props} = this._currentElement;

    let startTag = `<${type} data-reactid="${this._reactid}"`;
    const endTag = `</${type}>`;
    let childString = '';

    for(let propName in props){
      if (/^on[A-Z]/.test(propName)) {
        const eventName = propName.slice(2).toLowerCase();
        // 第二个参数是命名空间，方便取消事件代理
        $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, props[propName]);
      }else if (propName === 'style') {
        const styleObj = props[propName];

        const styles = Object.keys(styleObj).map((key) => {
          const middle = key.replace(/([A-Z])/g, (m, $1) => `-${$1.toLowerCase()}`);
          return `${middle}:${styleObj[key]}`;
        }).join(';');

        startTag = `${startTag} style=${styles}`;
      }else if (propName === 'className') {
        startTag = `${startTag} class=${props[propName]}`;
      }else if (propName === 'children') {
        const children = props[propName];
        children.forEach((child, index) => {
          const childUnit = createUnit(child);
          const childMarkUp = childUnit.getMarkUp(`${this._reactid}.${index}`);
          childString = `${childString}${childMarkUp}`;
        })
      }else{
        if (propName !== '__source' && propName !== '__self'){
          startTag = `${startTag} ${propName}=${props[propName]}`;
        }
      }
    }
    return `${startTag}>${childString}${endTag}`;
  }
}

class CompositeUnit extends Unit {
  getMarkUp(reactid){
    this._reactid = reactid;
    const {type:Component, props} = this._currentElement;
    const instance = new Component(props);
    const renderedElement = instance.render();
    const u = createUnit(renderedElement);
    return u.getMarkUp(this._reactid);
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
