Everything in Qwiery is stored as JSON and a lightweight ORM allows you to easily store or fetch stuff to or from an underlying storage system. Out of the box there is a file and MongoDB storage implementation but it's quite easy to add custom ones.

Each service can access the storage directly or make use of an intermediate layer, call it the business layer or entity layer. For example, in order to store graph-like instances the Graph service makes use of a GraphStorage class. This class inherits from the [StorageDomainBase]{@link StorageDomainBase} class which contains some utility methods to create custom storage collections.

Because the ORM is generic you have settings which can be defined but not necessarily used. For example, defining a schema is necessary for MongoDB but is irrelevant if the file-system is used. The WorkflowStorage contains for instance the following

        init(instantiator) {
            super.init(instantiator);
            return this.createCollections(
                {
                    collectionName: "Workflows",
                    schema: {
                        id: String,
                        workflow: Object,
                        isActive: Boolean,
                        isSuspended: Object,
                        userId: String
                    },
                    index: "id"
                },
                {
                    collectionName: "WorkflowLibrary",
                    schema: {
                        id: String,
                        workflow: Object,
                        userId: String
                    },
                    index: "id"
                });
        }
        
which defines schema's and an index for the collections but only the collectionName is actually used in the MemoryStorage implementation.
If you create a custom service which stores stuff in a custom collection you should define the schema to ensure compatibility with every storage type. Unless you really focus on a particular (private) solution and do not care about portability. 
        
In the above example the 'Workflows' collection will be automatically created and inside the class you get an instance of a [StorageProxy]{@link StorageProxy} to the collection. So, for example you use 
        
        
        this.Workflows.findOne(...)
        this.Workflows.upsert(...)
        
and so on. The StorageProxy is really only present to make things more readable. See the [How to Store Things]{@tutorial How_StoreThings} tutorial for more info.

The MemoryStorage and MongoStorage implementation are just another service and can be configured as such when instantiation Qwiery:

        const qwiery = new Qwiery(
            {
                system: {
                        coreServices: [
                            // {
                            //     name: "MemoryStorage",
                            //     /**
                            //      * This defines how/where things are stored and accessed by the default file-based storage.
                            //      */
                            //     "filePath": path.join(__dirname, "QwieryDB.json"),
                            //     "autosaveInterval": 5000,
                            //     "autoload": true
                            // },
                            {
                                "name": "MongoStorage",
                                "connection": "mongodb://localhost:27017/QwieryDB"
                            },
                            
                            ...
            }
        )

or via the plugins configuration. Note that a Qwiery instance can have only one storage service (i.e. something inheriting from the [StorageBase]{@link StorageBase} class). Of course you can have your custom connect to a particular backend beside the generic storage but in that case you have to define your storage pipeline fro A to Z yourself.
        