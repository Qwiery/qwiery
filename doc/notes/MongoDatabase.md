See [MongoStorage]{@link module:MongoStorage}

The SampleData directory contains a MongoDB archive which can servce as a sample but is also necessary to run the unit tests.

To restore it use

     mongorestore --archive=./SampleData/QwieryDB.gz

and change the directory appropriately.

The database can be used by specifying the MongoStorage

    const qwiery = new Qwiery({
        system: {
            coreServices: [
                {
                    name: "MongoStorage",
                    "connection": 'mongodb://localhost:27017/QwieryDB',
                    "options": {}
                }, 
                "Statistics",
                "Topics"]
        }
    });

If the port or IP is different you need to alter the connection property above.

