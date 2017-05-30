Qwiery is written on top of NodeJS and you can find all info you need on the [NodeJS website](http://nodejs.org). The code depends a lot on asynchronous constructs and classes, so version 7.10 or above is required to support at least ECMAScript 2016.

Qwiery can run with a file-backend but if you want to go beyond the basics you will need [MongoDB](http://mongodb.com). On a Mac you typically use [Homebrew](https://brew.sh/) with 

    brew install mongodb
    
which then becomes available on port 27017. Qwiery wil create a MongoDB database automatically as well as all collections (also custom collection of plugins). 
   
The NodeJS packages required by Qwiery are automatically installed via 
   
       npm install qwiery
   
and can, strictly speaking, be considered as requirements but all of the setup happens automatically via NPM (NodeJS package manager). NPM is installed together with NodeJS, so no worries on this level. The list of packages Qwiery depends on can be found in the _package.json_ file (like any other NodeJS module).

If you want to run the unit test you will need to install nodeunit

       npm install nodeunit
       
and all test can be executed inside the qwiery-directory via 
       
       npm run test
       
Coverage makes use of [the istanbul module](https://github.com/gotwarlost/istanbul)    
   
    npm install -g istanbul
    
and just like the unit test you can use
    
    npm run cover
    
to see that something **70%** of the code is covered by unit tests.    
   
   
   