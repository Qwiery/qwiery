The [Qwiery]{@link module:Qwiery} class has a single configuration parameter through which all tuning and behavior of Qwiery happens. The given configuration file does not have to specify all properties however, the given settings are merged with defaults. Whatever is not specified in your configuration will be taken from the defaults. The defaults can be found in the `config.default.js` file and you can also alter that one. If you instantiate Qwiery without a configuration the whole behavior will be deduced from that default configuration file.

The [Configurator class]{@link Configurator} deals with validation and merging of settings. You can find therein all the details of acceptable settings.

## Adding an external plugin

The Qwiery mechanics is based on plugins and you can assemble things through the configuration. Each plugin can have its own settings, so if you have created a custom plugin `MyPlugin` it can be added like so

    {
        plugins:[
            {
                path:"~/MyPlugin",
                myPluginParameter1: "10",
                someOtherSettings: true
            }
        ]
    }
    
Inside the plugin class you can access the plugin configuration section via the `getPluginSettings` method (defined in the [FrameworkBase]{@link module:FrameworkBase} class).

## Adding an internal plugin

Out of the box Qwiery has a default configuration which defines a set of core plugins. You can redefine, remove or alter these plugins as well. Note that some of these plugins are essential for certain things and if by removing them you drop the functionality. For example, the `Graph` plugin manages the semantic networks and if you remove it you effectively drop Qwiery's internal memory.

The core plugins are defined in the `system` section of the `config.default.js` file:

    {
        system:{
            coreServices:[
                 "System",
                "Graph",
                "Topics",
                ...
            ]
        }

    }

Most of the internal plugins can be specified through their directory name. Some of the internal plugins need some additional configuration, like the `MemoryStorage`:

    {
        system:{
            coreServices:[
                ...
                 {
                    "name": "MongoStorage",
                    "connection": "mongodb://localhost:27017/QwieryDB"
                 },
                ...
            ]
        }

    }    

In general:

- if you only use a string it will be interpreted as the name of the directory in the Services directory of the Qwiery package
- if you specify a name in a JSON section you can also add additional options

**Important remarks:**

- names have to be unique across a Qwiery instance
- names are lower-cased internally so 'plugin1' and 'PlugIn1' can not coexist
- plugins are loaded in the order they appear, so the specified sequence matters. Plugins are not added when instantiated but after their `init()` method has been called. 
- because almost everything in Qwiery happens asynchronously you can detect when something has been fully instantiated and initialized through the `whenPluginLoaded` method. This method returns a Promise and gets resolved only after the specified plugin finished initialization


    const qwiery = new Qwiery();
    qwiery.whenPluginLoaded("memorystorage").then(function() {
                    console.log("The MemoryStorage is on.");
                });

## Adding an inline plugin

Inline plugins are great for experimenting but will not get you very far. The reason is that external plugins inherit from base classes with some predefined functionality. Still, it's lots of fun for prototyping ideas. You can add an inline plugin like so

    {
        plugins:
        [
            {
                name: "MyPlugin",
                type: "Interpreter",
                processMessage(session) {
                        session.Output.Answer = "What an interesting remark.";
                        return session;
                }
            }
        ]
    }

See the [Plugins]{@tutorial Plugins} page for more details.

## defaultApp

When input contains a name prefixed with '@' (e.g. '@Ian what will be the weather tomorrow?') it will be directed to the corresponding app with that name. If nothing is given (e.g. 'I love walking in the rain!') the input will be directed to the default app specified by the `defaultApp` property in the configuration.
Of course, this default app name has to exist and it's checked internally. Specifically, the following configuration

    {
        defaultApp: "Mira",
        apps:[
            {
                name: "Mira"                
            }
        ]
    }
is valid but

     {
        defaultApp: "Mira",
        apps:[
            {
                name: "Miranda"                
            }
        ]
    }
is not valid (an Error will be thrown). The apps can however also be `*` or `all` 

    {
        defaultApp: "Mira",
        apps: "*"
    }
in which case all apps in the backend storage will be considered and the default app is not checked during configuration but when first addressed.    

## apps

Qwiery allows you to define multiple agents (called 'apps' in Qwiery) per instance. You can define these apps either in the configuration or use `*` (or `all`) to tell Qwiery that the apps are defined in the backend. The backend is accesses via the defined storage and it means that the app configurations sit in a JSON collection somewhere. Out of the box you have a `MemoryStorage` and a `MongoStorage` which manage the `AppConfiguration` collection (in file respectively MongoDB).

An app definition has some default which can be altered just like every other Qwiery configuration. The defaults are found in the `defaults` section of the `config.default.js` file:

     "defaults": {        
        "noAnswer": "I have no idea.",

        "pipeline": [
            "Spam",
            "Parsers",
            "RandomAnswers",
            "Edictor"
        ],

        "parsers": ["YouTube"],

        "categories": "*",
    }

**noAnswer** 

If the whole pipeline fails to find an answer and the app does not have a noAnswer defined then this is the fallback answer.    

**pipeline**

This defines the interpreter sequence used to handle input. The intepreters used have to be included in the plugins (or coreServices). You cannot define a plugin here, you can only refer to an existing plugin definition.

The philosophy behind the pipeline mechanics is that each plugin gets the input (in the shape of a session object) and can decide whether or not it can handle it. If an intepreter has successfully handled the input it supposedly sets the `Handled` flag to `true`. Subsequent interpreters can opt to augment or alter the handled input. Some intepreters do not attempt to handle the input but can have a contextual influence. For example, the historization interpreter stores the end-result while the parsers parse the input for certain entities (URL's, dates etc.).

**parsers**

This defines which parsers are active. The available parsers sit in the `Parsers` module in the interpreters directory. Additional parsers and interpreters can be added as plugins.

**categories**

If the pipeline contains the Oracle/Edictor mechanism (a rule-based, templated answering system) this gives the option to narrow down which templates are used. Oracle templates are organized in categories and you could define in this way an app which only answers questions in the category 'sports' or 'politics'. 
If '*' is specified here it means that all categories are accessible.

## checkIdentity

Qwiery can check whether the given user identifier has been registered. If set to false any user will pass. 
The following makes this clear

     const qwiery = new Qwiery({
        system: {
            "coreServices": [
                {
                    "name": "MongoStorage",
                    "connection": "mongodb://localhost:27017/QwieryDB"
                },
                "System",
                "Graph",
                "Topics",
                "Personalization",
                "Pipeline",
                "Oracle",
                "Identity",
                "Apps"
            ],
            coreInterpreters: ["Spam",
                "Parsers",
                "RandomAnswers",
                "Edictor"],
            checkIdentity: true
        }
    });
    
    let userId = utils.randomId();
    qwiery.ask("test1", {userId: userId}).catch(function(e) {
        console.log(e.message);       
    }).then(function() {
        qwiery.services.identity.registerLocal(userId + "@qwiery.com", "123").then(function(newUser) {
            qwiery.ask("test2", {userId: newUser.id}).then(function() {
               console.log("All is well now.");
            });
        });
    });

the first time the input will raise an error. 

The `Identity` plugin is typically is used in the context of a web application where a user is stored after being authenticated via OAuth (say, Facebook or Google). So, although the example above allows you to register a username/password type of user, the Identity module is not meant as a full-fledged authentication module but rather to store authentication bits from an external OAuth authority.