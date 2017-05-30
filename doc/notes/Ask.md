
When you call the `ask` method of Qwiery you can specify additional parameters. Below you can find the common parameters. Note that the passed settings can be found in the outgoing Session in the `OriginalSettings` property. This also allows plugins and custom modules to consume custom settings if needed.


- **return**: string, default: session
    
  - **session**: This is the default which contains all the info being used internally to process the question.
  - **pods**: the `Session.Output.Answer` is returned. This is be default an array of [pods]{@link Pods} but custom interpreters can return sometimes number array or just as string.
  - **simple**: instead of a Session instance an answer will be extracted. This means that if the answer is simple enough (e.g. the DataType is "Text") you will get directly the answer. If however the pod collection contains more than one item or e.g. the single pod is a search result you will get a string which can be used in a REPL or HTML context.
  - **flat**: things like a search result will be returned a "Search result" rather than the actual list. If the answer is a string or a number it will be returned however. The format is mostly useful for unit testing or if only simple answers are being generated.
     
- **format**: string, default: Text
     
  The format to be returned. There is no garantee that the given format will effectively be returned but if the interpreter/service can you will receive that format. 
  
- **userId**: string, default: null
  
  The user identifier of the requesting party. If none specified the `Anonymous` user will be used. This userId can be null (and internally mapped to Anonymous) only if in the Qwiery configuration `checkIdentity` is set to false, otherwise an error will be thrown.
  
- **trace**: boolean, default: false
  
  If `true` the returned session will contain a `Trace` property with information about how the question was processed. 
  
- **appId**: string, default: null
  
  The id of the app which should process the request. If none specified the default app specified by the `defaultApp` configuration of Qwiery will be used. If the specified appId cannot be mapped to an existing app an error will be thrown.
  
- **req**: HTTP request, default: null
  
  If the incoming question is part of an HTTP request (e.g. through NodeJS Express) this can be passed to Qwiery and additional info will be gathered, like the IP address, HTTP body and HTTP method.