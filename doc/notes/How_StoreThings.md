In this tutorial we will create a service which checks given strings (questions or input) for unknown words and store these unknowns in the backend. This demonstrates how to:

- create and register custom services
- create collections and store stuff in it
- make use of the various base classes
- to use sibling services (the language service in particular)

The custom service is called **Unknowns** and can be loaded inside Qwiery via

    load tutorial
    
A Qwiery service is a plugin which inherits from the ServiceBase class. Qwiery recognizes and positions plugins based on their base class. You can create arbitrary bits and classes in Qwiery as you like but if you wish to make something globally available it needs to derive from the ServiceBase.    
Referencing base classes can be done in the usual way (with import or require) and the Qwiery class also defines static references:

    class Unknowns exteds Qwiery.ServiceBase { ... }
    
You need a constructor and a super to make things work
    
    class Unknowns extends ServiceBase {
        constructor() {
            super("unknowns");
        }
    }

and the given string/name in the super is the name or reference of the service which will be come globally available. So, once this service is included in the settings it will become available anywhere in Qwiery as
    
    this.services.unknowns
    
Obviously, if you have multiple services with the same name they will overwrite each other. This is by design, if you wish to override one of the default services (say, the graph service) you would reuse the same name and thus redefine the default (out of the box) service.
    
With the above in place you can start to define what you actually want in the service. We'll proceed as follows:
    
   - use the static `Language.getPOS` method to find the nouns in the input. The method tags the words with the Penn-Treebank tags and we'll fetch the NN and NNS tags. The proper nouns are not picked up (though the method gives you an optional parameter to do so).
   - use the static `Language.lookup` method to look up the definition of the noun. The definition is based on [WordNet](https://wordnet.princeton.edu).
   - if the definition is not found we'll add the noun to the unknown words in a collection. We don't directly access the backend but use an UnknownStorage class for this.
   

As good as everything in Qwiery is asynchronous and there are various ways to deal with it. Below is an implementation based on the native ES2017 async/await syntax.   
   
        async function fetchUnknownNouns(input) {
            if(!_.isNil(input)) {
                const nouns = await Language.getNouns(input);
                if(nouns.length > 0) {
                    const definitions = nouns
                        .map(async noun => ({
                            noun: noun,
                            definition: await Language.lookup(noun)
                        }));
                    const what = await Promise.all(definitions);
                    const unknowns = what
                        .filter(r => r.definition.length === 0)
                        .map(r => r.noun);
                    return Promise.resolve(unknowns);
                }
            }
            return Promise.resolve([]);
        }

The easiest way to develop such a method is by creating unit tests referencing the appropriate modules and copying the working bits into a Qwiery module/service.
           
With the above detection of unknown nouns in place we can now define a little class which will take care of the storage. The approach is the following:

- inherit from the `StorageDomainBase` class. This class is designed to ease the creation of collections independently of the actual storage (MongoDB, file...).
- use the `init` method to define custom collections.
- define a method which allows to use the newly created collection(s). Here you can define custom (business rules) between the call and the actual data access. All of this is really standard ORM mechanics.

To be concrete, the data storage class for the unknowns is as simple as this:
           
           class UnknownStorage extends StorageDomainBase {
           
               init(instantiator) {
                   super.init(instantiator);
                   return this.createCollection(
                       {
                           collectionName: "Unknowns",
                           schema: {
                               word:String 
                               }
                       })
               }   
           }    
           
Within this class you can now define a simple method which takes the given noun and stores it:
           
           upsertNoun(noun){
                return this.unknowns.upsert(noun);
           }
           
The member `unknowns` is simply the lower-cased collection name defined above. Also note that all of the data access methods are asynchronous even if the underlying storage implementation is not.

How to use the storage class? You hook it up in the `init` of the Unknowns class like so
           
            class Unknowns extends ServiceBase {
                   constructor() {
                       super("unknowns");
                   }
                   init(instantiator) {
                      super.init(instantiator);
                      this.unknownStorage = new UnknownStorage(this.storage);
                      return this.unknownStorage.init(instantiator);
                  }
                  async function fetchUnknownNouns(input) {
                  ...
                  }
                  async inspect(input){
                      const nouns = await fetchUnknownNouns(input);
                      nouns.forEach(n => this.unknownStorage.upsert(noun));
                  }
               }
               
How to include this custom service in Qwiery? Simply put the JavaScript code somewhere, say "~/UnknownsService.js" and add it to the plugins:
            
            const qwiery = new Qwiery(
                {
                    plugins:[
                        {
                            path: "~/UnknownsService.js"
                        }
                    ]
                }
            );

At this point you have a working (custom) Qwiery service which can be used anywhere inside other services and interpreters. You can hook it up in various ways:

- inherit from the Qwiery class and override the `ask` method to include a call to the UnknownsService.
- create a custom interpreter which simply calls the services. This is similar to the historization service which does not perform anything else but passing a session to the historization service
- add a line of code to the default Qwiery implementation, say in the ask-method or in any of the intepreters
- define an inline interpreter like so
           
            const qwiery = new Qwiery(
            {
                   defaultApp: "MyApp",
                   apps:[
                    {
                        name: "MyApp",
                        pipeline: [
                                {
                                    processMessage: function(session) {
                                        this.services.unknowns.inspect(session.Input.Raw);
                                        return session;
                                    }
                                }
                            ]
                    }
                   ],
                   plugins:[
                       {
                           path: "~/UnknownsService.js"
                       }
                   ]
               }
           );
           

The service created above could also be defined as an inline service but it makes debugging somewhat more difficult though it's a great way to fiddle with options and ideas.
           
           