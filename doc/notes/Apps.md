A single Qwiery instance can host multiple agents, called apps. An app or agent is defined through a configuration when Qwiery is instantiated, for instance

        const settings = {
            defaultApp: "John",
            apps:[
                {
                    name: "Ella",
                    id: "Ella"
                },
                {
                    name: "John",
                    id: "JJ"
                }
            ]
        }
        const q = new Qwiery(settings);
        
App "Ella" can be addressed in a question using the Twitter-like name @Ella:
          
          Hello @Ella, what's up?
          
If you don't specify an agent the default app will be used. With the above configuration the app "John" will answer all unaddressed questions.
          
Apps are more generic than chat agents (aka bots). An app does not necessarily have to be a chat buddy, an app is defined through a pipeline and as such can return anything, not just an answer to a question. A request to an app could be some JSON and the response could be some binary data. You can use Qwiery as a processor for an intelligent REST service (say, something focused on language understanding and NLP).

The configuration above is the minimal configuration for an app. When define like this all the non-specified settings will be copied from the default app configuration. The defaults can be found (and changed) in the _config.default.json_ file. 

Let's define "John" so it returns only weather information based on a weather-interpreter:

           const settings = {
               defaultApp: "John",
               apps:[
                   {
                       name: "Ella",
                       id: "Ella"
                   },
                   {
                       name: "John",
                       id: "JJ",
                       noAnswer: "Sorry, I can only give you forecasts.",
                       pipeline:[
                            "Weather"
                       ]
                   }
               ]
           }

Note that the pipeline can use custom plugins and you can load packages from the Qwiery repository. The app pipelines are not limited to the default Qwiery services, interpreters and commands.

"Ella" on the other hand could have a combination of an inline service, spam detection and random answers:

           const settings = {
               defaultApp: "John",
               apps:[
                   {
                       name: "Ella",
                       id: "Ella",
                       pipeline:[
                        "Spam",
                        function(session context){
                            if(session.Handled) return session;
                            let question = session.Input.Raw;
                            if(question.indexOf("jazz")>=0){
                                session.Output.Answer= "Did you say jazz? Love it!";
                                session.Handled = true;
                            }
                            return session;
                        }
                        "Random"
                       ]
                   },
                   {
                       name: "John",
                       id: "JJ",
                       noAnswer: "Sorry, I can only give you forecasts.",
                       pipeline:[
                            "Weather"
                       ]
                   }
               ]
           }

Of course, if you wish to have many apps this becomes a bit inconvenient. Qwiery allows to store all app definitions in the backend. There is also a whole lot of functionality to allow users to upload their own apps. If you wish to use backend apps you simply define
           
            const settings = {
               defaultApp: "Peter_33",
               apps: "*"
           }
           const q = new Qwiery(settings);
           
and Qwiery will resolve apps based on the backend definitions.
           
If you use the default configuration Qwiery uses the default app called "Qwiery" with a definition which embraces pretty much all of the services and interpreters.
           
           