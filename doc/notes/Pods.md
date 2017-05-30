When Qwiery processes a question a [Session]{@link Session} instance is created which contains various bits of info the interpreter pipeline can use, augment or adorn. 
Ultimately one or more answers are formulated and they are wrapped into pods in the `Session.Output.Answer`. 


        session = {
        ...
            Output:{
                 Answer:[
                    // one or more pods here
                 ]
        }
        ...
        }

A pod is a package of information which can be presented in some form in the UI. All pods have one property in common: the `DataType`. Everything else in a pod depends on what created the pod and the original question. 

The most basic pod is a Text pod 

        {
            DataType: "Text"
            Content: "This is plain text"
        }

and you can find common pod types in the `Constants` module. Another common pod is the `List` pod which contains a `List` property and a `ListType`. For instance, a graph search results in a pod of this form:
       
       
       {
            DataType: "List",
            List: [
                {
                    "Id" : "asA12ss",
                    "Title" : "Something",
                    "DataType" : "Thought"                    
                 }
            ],
            ListType: "SearchItem"
       }

In general, a service or interpreter can return anything in this shape and it's up to the caller to turn it into something pleasing on the UI level.

Sometimes a pod contains additional info which can be used to present the data, like the `Head` property:

        {
            DataType: "Text"
            Content: "Rainy with beautiful light rays",
            Head: "Your weather forecast"
        }


When a question is posted you can specify a format which Qwiery can opt to use as an answer-format. If you use "All" multiple pods will be returned in the different available formats:
       
       ...
       Answer:[
            {
               DataType: "Text"
               Content: "Rainy with beautiful light rays",
               Head: "Your weather forecast"
            },
            {
               DataType: "HTML"
               Content: "<a ...> </a>...",
               Head: "Your weather forecast"
            }
       ]