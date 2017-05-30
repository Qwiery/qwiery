
Topics are tags on templates which indicate what subject is being discussed during an exchange. Topics are crucial to diverse services (e.g. emotions, personality) because they are used as input for profiling and machine learning.

A typical template (sitting in an app definition or in the backend)like the following

        apps: [{
            name: "Jonas",
            id: "Jonas",
            oracle: [
                {
                    "Id": "KQERTADSN",
                    "UserId": "Everyone",
                    "Template": {
                        "Answer": {
                            "String": "Through this template I have registered a couple of topics."
                        }
                    },
                    "Category": "Diverse",
                    "Topics": [
                        "Topic 1", 
                        "Topic 2"
                    ],
                    "Questions": [
                        "Hello"
                    ]
                }
            ]
        }]

can define one or more topics which are being registered in 
        
- the topics history of a user: this is a time-order stack of topics for each user
- the topic statistics of a user: this collects how many times each topic has been used
 
 The topic history has a maximum of 50 items and checks for multiplicity. That is, if the same topics is used several times one after another only the first time is recorded. This history helps for example to refer to previous topics in a discussion.
 
 The topic statistics can serve as input for classifications or inside templates. A personality profile, for instance, can be based on this statistical data and this is indeed what happens in the personality service.
 
 