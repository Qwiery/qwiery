
![Qwiery](http://www.orbifold.net/QwieryLogoSmall.png)

Qwiery is **a symbolic cognitive architecture for building agents, text-based user interfaces and cognitive pipelines** in general. It's a constuctive approach to cognitive computing and computational knowledge based on a modular system (plugins) with a focus on NLP-oriented interactions but allows a wide range of scenarios, including hybrid combinations of technologies (Python, R, Neo4j...) and approaches (neural networks, machine learning...).

The framework can articulate bots, utterance-intend interactions, REST services, HTML output and is an **engine** focused on processing interactions rather than a particular IO channel. It's written in JavaScript (**NodeJS**) and as such favors some constructs like Express, JSON and HTML but through the flexibility of NodeJS allows easy integration with XML, Python and whatnot. 

Out of the box you will find in Qwiery a broad range of functionalities and features:

- support for **multiple instances**; instances can be clustered (via NodeJS cluster or load-balanced) and will not interfere. All persistent data sits in the backend and can be shared by agents and instances
- **multiple agents** (aka Qwiery apps): you can have unlimited agents with different behaviors and pipelines
- **plugins**: custom services, commands and interpreters can be easily added
- **open**: other technologies can be easily integrated; Neo4j to store semantic knowledge, use R for machine learning, integrate Keras for deep learning and so on
- **multi-user**: interactions can be anonymous or personal, identity and login can be integrated and through this allow for personalization, emotional analytics and so on
- **packages** can extend the functionality of Qwiery. The Qwiery package server allows to package custom plugins and interactions so you can share, reuse and collaborate around a particular domain. Qwiery packages are versioned and the server code can easily be adapted to custom needs
- **NLP oriented** through various integrated utilities: POS, sentiment analysis, rule-based sentence filtering and so on
- **workflows** (aka state machines) help you create coherent interactions around related tasks (say, ordering train tickets)
- a **REST facade** allows you to use Qwiery as part a microservice architecture, in the cloud and whatnot. [Swagger](http://swagger.io) documentation and [Postman](https://www.getpostman.com) testing suite is included for your convenience. 

See the documentation for a complete feature list.

It should be emphasized that Qwiery **does not exclude deep learning, supervised machine learning and reinforcement learning**. The framework allows one to include deep learning models as interpreters and Qwiery can be used to train models through interactions. The plugin system and the agent pipelines are a way to organize and integrate multiple processes (possibly in parallel) with a slight emphasis on NLP, but you are free to inject things in whatever way you see fit.  

# Setup

    npm i qwiery
    
In a JS file add

    const Qwiery = require("qwiery");
    Qwiery.repl();
    
and run it with
    
    node index.js
    
to see a basic REPL interface to Qwiery. There are many other ways you can use it, see the documentation for more.    
    

# Support and feedback

- [Twitter](https://twitter.com/qwiery)
- [info@qwiery.com](mailto:info@qwiery.com)
- [Github](https://github.com/qwiery)
- [Official Qwiery site](http://www.qwiery.com)
- [Orbifold Consulting](http://www.orbifold.net)

# References

- [SOAR cognitive architecture](https://en.wikipedia.org/wiki/Soar_(cognitive_architecture))
- [Artificial Cognitive Systems](http://vernon.eu/ACS/ACS_03.pdf)
- [Deep learning](https://github.com/HFTrader/DeepLearningBook)
- [A Review of 40 Years of Cognitive Architecture Research](https://arxiv.org/pdf/1610.08602.pdf)

# Documentation

Qwiery's code is highly documented and the `doc\notes` directory also contains plenty of extra information. To compile the documentation use

    npm run docs
    
or explicitly

    jsdoc -c ./jsdoc.json
    
and it will create a comprehensive site of both the API and the notes. 

The configuration of JSDOC sits in the `jsdoc.json` file in the root of the solution.

The template to render the site is [the clean Minami](https://github.com/nijikokun/minami) but you can find lots of alternatives. The [jsdoc documentation](http://usejsdoc.org/about-configuring-default-template.html) explains in details how to configure things.         

