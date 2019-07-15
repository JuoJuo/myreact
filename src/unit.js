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

function createUnit(element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return new TextUnit(element);
  }
}

export {
  createUnit,
}
