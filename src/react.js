import $ from 'jquery';
import {createUnit} from './unit';
import {createElement} from './Element';
import {Component} from "./Component";

const React = {
  render,
  rootIndex: 0,
  createElement,
  Component,
};

//element可能是文本 dom 或者自定义的组件
function render(element, container) {
  // container.innerHTML = `<span data-reactid="${React.rootIndex}">${element}</span>`;
  const unit = createUnit(element);
  const markup = unit.getMarkUp(React.rootIndex);
  $(container).html(markup);
}


export default React;
