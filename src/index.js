import React from './react';

function sayHello() {
  alert('kjflkdsjflkjkl');
}

let button = (
  <button id="sayHello" style={{color: 'red', backgroundColor: 'green'}} onClick={sayHello}>
    say1
    <b>hello</b>
  </button>
);


class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {number: 0};
  }

  componentWillMount() {
    console.log('Counter componentWillMount')
  }

  componentDidMount() {
    console.log('Counter componentDidMount')
  }

  componentDidUpdate() {
    console.log('Counter componentDidUpdate')
  }

  shouldComponentUpdate(nextProps,nextState) {
    return true;
  }

  handleClick = () => {
    this.setState({number: this.state.number + 1});
  };

  render() {
    console.log('render');
    let p = React.createElement('p', {}, this.state.number);
    let button = React.createElement('button', {onClick: this.handleClick}, '+');
    return React.createElement('div', {style: {color: this.state.number%2===0?'red': 'white', backgroundColor: this.state.number%2===0?'green': 'red'}}, p, button);
  }
}

{/*<Counter name="xixi"/>*/}
const ele = React.createElement(Counter, {name: '计数器：'});
React.render(ele, document.getElementById('root'));
