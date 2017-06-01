
This is the REST facade on top of a Qwiery instance. It allows you to use Qwiery as a service as part of a microservice architecture, in the cloud and whatnot.

The whole service is documented using [Swagger 2.0](http://swagger.io) and you can fetch the JSON via [/api-docs.json](/api-docs.json) or a cached version via [/swagger.json](/swagger.json). Using this JSON you can generate stubs (proxys) for your favorite language via the [Swagger Codegen](http://swagger.io/swagger-codegen/) or generate documentation via [Swagger Editor](http://editor.swagger.io/).

The service has been tested with [Postman](https://www.getpostman.com) and you can find the complete Postman collection of tests in the Qwiery code under _/Apps/REST/PostmanProject.json_.