The trace or processing trail can be witched on by setting the trace flag in a request:

    qwiery.ask("...", {trace: true}).then(
        function(session) {
            let trace = session.Trace;
            
            });

This trace is an array of info bits about how the processing happened. The exact content depends on the question and which intepreter handled the question.

One thing which will always be present is the `HandledBy` item containing which interpreter handled the question.
    
    qwiery.ask("...", {trace: true}).then(
            function(session) {
                let trace = session.Trace;
                let handler = utils.getHandler(trace);
                console.log(`This was handled by '${handler}'.`);
                });

Usually an interpreter will add to the trace info about internals. For example if the Oracle/Edictor handled the question "hello" you can find the template in the trace:
    
     [
         {
              "Edictor": [
                   {
                        "Id": "hello",
                        "Questions": [
                             "Hello %1",
                             "Hi",
                             "Hej",
                             "Hi %1",
                             "Hey %1",
                             "%1 what is up"
                        ],
                        "Wildcards": [],
                        "Template": {
                             "Answer": {
                                  "%rand": [
                                       "Hello, how's life?",
                                       "What's up?",
                                       "Hello there :)",
                                       "Hey",
                                       "There you are, how are things on your end?"
                                  ]
                             }
                        },
                        "Head": "Template 1",
                        "Topics": [],
                        "Approved": false,
                        "Category": "SmallTalk",
                        "DataType": "OracleStackItem"
                   }
              ]
         },
         {
              "HandledBy": "Edictor"
         }
    ]


Note that if you use the Qwiery REPL you also access this information directly by means of

    trace hello
    
or whatever the question you wish to trace.    