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

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  handleClick = () => {
    this.setState({number: this.state.number + 1});
  };

  render() {
    console.log('render');
    let p = React.createElement('p', {}, this.state.number);
    let button = React.createElement('button', {onClick: this.handleClick}, '+');
    return React.createElement('div', {
      style: {
        color: this.state.number % 2 === 0 ? 'red' : 'white',
        backgroundColor: this.state.number % 2 === 0 ? 'green' : 'red'
      }
    }, p, button);
  }
}


class Counter2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {odd: true};
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({odd: !this.state.odd});
    }, 3000);
  }

  render() {
    if (this.state.odd) {
      return React.createElement('div', {key: 'wrapper'},
        React.createElement('p', {key: 'A'}, 'A'),
        React.createElement('p', {key: 'B'}, 'B'),
        React.createElement('p', {key: 'C'}, 'C'),
        React.createElement('p', {key: 'D'}, 'D'),
      );
    }
    return React.createElement('div', {key: 'wrapper'},
      React.createElement('span', {key: 'A'}, 'A1'),
      React.createElement('p', {key: 'C'}, 'C1'),
      React.createElement('p', {key: 'B'}, 'B1'),
      React.createElement('p', {key: 'E'}, 'E1'),
      React.createElement('p', {key: 'F'}, 'F1')
    );
  }
}


class Todos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {list: [], text: ''};
  }

  add() {
    if (this.state.text && this.state.text.length > 0) {
      this.setState({list: [...this.state.list, this.state.text], text: ''});
    }
  }

  onChange(event) {
    this.setState({text: event.target.value});
  }

  onDel(index) {
    this.state.list.splice(index, 1);
    this.setState({list: this.state.list});
  }

  render() {
    const createItem = (itemText, index) => {
      return React.createElement("div", {}, itemText, React.createElement('button', {onClick: this.onDel.bind(this, index)}, 'X'));
    };

    const lists = this.state.list.map(createItem);
    const input = React.createElement("input", {onKeyup: this.onChange.bind(this), value: this.state.text});
    const button = React.createElement("button", {onClick: this.add.bind(this)}, 'Add');
    return React.createElement('div', {}, input, button, ...lists);
  }
}

{/*<Counter name="xixi"/>*/
}
const ele = React.createElement(Todos, {name: 'todos：'});
// const ele = React.createElement(Counter, {name: '计数器：'});
// const ele = React.createElement(Counter2);
React.render(ele, document.getElementById('root'));
