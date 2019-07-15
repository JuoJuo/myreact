import React from './react';

function sayHello(){
  alert('kjflkdsjflkjkl');
}

let button = (
  <button id="sayHello" style={{color: 'red', backgroundColor: 'green'}} onClick={sayHello}>
    say1
    <b>hello</b>
  </button>
);
console.log(button);
React.render(button, document.getElementById('root'));
