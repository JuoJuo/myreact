class Component {
  constructor(props){
    this.props = props;
  }
  setState(partialState){
    this.currentUnit.update(null, partialState);
  }
}

export {
  Component,
}
