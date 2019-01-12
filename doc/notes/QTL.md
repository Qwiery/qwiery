## QTL in detail


### Parameters

Parameters start with `%` and can have a default value in case it cannot be resolved.
The following

        {name: "%name:(John Field)"}
        
will either be resolved via the context and if not will default to the `John Field`.
If a parameter cannot be resolved in any way it will remain in the template as-is.  
The round brackets are only necessary if the default value contains space. The following

        {name: "%name:Anna"}
        
would be fine.

### System variables

System variables are prefixed with `%%` for example:

        {message: "The is now %%time."}
        
The following list gives the predefined system variables:

- time: the current system time
- date: the current system date
- datetime: the current system date-time
- userid: the user id of the client
- version: the version of Qwiery
- versiondate: the date of the current Qwiery version
- emotions: if the emotional service is turned on this will summarize how Qwiery feels
- appname or botname: the name of the current Qwiery clone
- serviceurl: the url where Qwiery is listening
- randomwords: returns some random words
- summary: if a workflow is currently running this will summarize the state


System variables are resolved via the context and it's just a matter of altering the `getSystemVariable` function to change or augment what is being returned when using a system variable.                       

### Join

Using `%join` will concatenate an array separated by space: 

         {'%join': ['a', 'b', 'c']}
         
results in 

        'a b c'
        

### Eval

This will evaluate the content given. For example

        {%eval: '(18+7)/5)'}
        
will be replaced by '5'. Note that the whole block is being replaced.
The parser tries to resolve unknown objects and calls via the context. If you want to use `Math` for example you need to define it in the context. Similarly, custom functions work as well provided they are defined in the execution context.

### Switch

A switch-case block is interpreted as expected and replaces the whole switch-block. The following

        {
               a: {
                   '%switch': '"case" + b',
                   'case1': 'x',
                   'case2': 'z',
               }
        }     
with the context value 1 for `b` will result in

        { a: 'x'}

The switch-statement should be a string which can be evaluated, you cannot have a complex block here.                
