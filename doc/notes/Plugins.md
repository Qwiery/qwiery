
Qwiery is in essence a box of plugins which put together create a processing pipeline for text-based interfaces. Almost everything is a plugin and hence almost everything can be changed, replaced, augmented in function of the desired output or interactions.
Below you can find an overview of the plugin mechanics and how you can configure Qwiery.


See also the [Instantiator]{@link module:Instantiator} class for details on how plugins are instantiated and managed.

## Plugin definitions

Plugins can be defined in three ways; internal, external and inline. The inline format is suitable for experimentation and defined inside the configuration. The internal are the ones shipped with Qwiery. The external ones are files and modules you can define outside the Qwiery package and add to the configuration. The plugin validation and instantiaton occurs transparently, you only need to specify a couple of things when instantiating Qwiery.
 
Note that the plugin definitions are unrelated to the plugin types. A plugin type is the function a plugin has in the framework and corresponds to the class it inherits from. There are four plugin types (service, command, interpreter, storage) corresponding to the four plugin base classes (ServiceBase, CommandBase, InterpreterBase, StorageBase).
  

### Internal

An internal plugin has its source in the Qwiery package itself. You can specify this plugin via its name:

    {
        plugins:["Documents"]
    }
   
If you wish to specify settings specific to an internal plugin you need to use a bucket with the `name` of the internal plugin:

    {
        plugins: 
        [
            name: "Documents",
            option1: "something",
            option2: "something else"
        ]
    }
    
### External
    
An external plugin is specified with a `path` property:
    
    {
        plugins: 
        [
            {
                path: "~/QwieryPlugins/MyPlugin"
            }
        ]
    }

and if you need to add some settings:
   
     {
           plugins: 
           [
               {
                    path: "~/QwieryPlugins/MyPlugin",
                    option1: "something",
                    option2: "something else"
               }
           ]
       }

The `path` uniquely identifies a plugin and an error is raised if the same path is used multiple times. Qwiery knows which plugin type you import by means of the base class on which the plugin is based.

A plugin can be created using one the following base classes:
       
- `CommandBase`: a plugin augmenting the `Command` interpreter
- `ServiceBase`: a plugin implementing a service
- `StorageBase`: a plugin implementing a storage system
- `InterpreterBase`: a plugin attempting to answer user input   
    
The base classes can be imported with the usual `require` or accessed via the `Qwiery` class. For example, the `ServiceBase` can be used like so
    
    class MyService extends Qwiery.ServiceBase{
        constructor(){
            ...
        }
        
        init(settings, services){
            super.init(settings, services);
            ...
        }
    }

### Inline

An inline plugin has no separate file but is defined as a plain object in the plugins array itself.
For example:
    
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

With an inline plugin you need the following members:
    
- a unique `name` withing the plugins collection (including core services and other plugins). Using an existing plugin name (e.g. `MemoryStorage`) will raise an error.
- the plugin `type`: interpreter, service, storage, command. This corresponds to the aforementioned base classes.
- one or more methods specific to the type. In the example above the interpreter interface has a `processMessage` method. You can look up the necessary method by looking at the corresponding base classes.
    
**Note** If you do not specify the `type` above the plugin definition will be considered as an internal plugin with the specified name. This allows you to use an internal plugin with custom settings. So, the combination of properties is crucial for Qwiery to understand what is being definition and where the implementation needs to be fetched from.

With the definition as above the plugin becomes availabe in lower-case:

    class SomeOtherPlugin extends ServiceBase{
        ...
        this.services.myplugin
        ...
    }

If you define a plugin via file (i.e. an external plugin as described above) you can specify the name  with the `pluginName` but not with an inline one. The inline plugins should be considered for testing purposes only, the external format offers more infrastructure and debuggin facitlities.
    