
The Qwiery package server hosts packages which can be easily loaded into Qwiery.
It can be started via

        npm run repo
        
or alternatively

        node ./Apps/REPO
        
It's a basic node-express site delivering zips and info via the API defined below.

             

### API

#### /about

Returns a page describing the service and how to use it.

#### /package_name

This will fetch/download the latest version of the specified package.

#### /package_name/about

This returns the readme of the specified package.

#### /package_name/version_number

This returns the specified version of the package.


