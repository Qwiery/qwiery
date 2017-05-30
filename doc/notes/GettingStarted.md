Qwiery makes the simple easy and the complex possible. To install just type

    npm install qwiery
    
and define in a file (let's say 'index.js')
    
    const Qwiery = require("qwiery");
    const q = new Qwiery();
    q.ask("Hello world!", { return: "simple" })
        .then(function (answer) { console.log(answer) });
    
then run this with
    
    node index.js
    
    
Of course, you need NodeJS (version 7.10 or above) but no other dependencies are present.

You can also start a basic REPL session like so
    
    const Qwiery = require("qwiery");
    Qwiery.repl()

(run this code with 'node index.js' of course).
    
Qwiery allows many scenarios and you can find in the documentation many examples of how to tweak Qwiery to your needs.
     
   