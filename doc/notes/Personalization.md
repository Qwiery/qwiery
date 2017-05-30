Personalization can mean several things in Qwiery:

- recording some preference via a specific question, e.g. the question 'what is your favorite color?' leading to a name-value pair being stored for the current user
- inference of semantic relationships in the graph, e.g. the user input 'quantum computing is the future of technology' leading to a relationship between 'quantum computing' and 'technology'
- emotional or psychological profiling leading to custom answers
- custom answers for specific users
- custom categories for some users


The most basic personalization amounts to recording name-value pairs which can be reused. The usage of workflows is particularly useful in this context. For example, if the user asks 'what is my favorite color?' the following template will answer or ask for input.

         {
            "Template": {
                "Answer": "ThinkResult",
                "Think": {
                    "CreateReturn": {
                        "Workflow": {
                            Name: "Favorite color flow",
                            States: [
                                {
                                    name: "Switch",
                                    type: "decision",
                                    transition: "%{hasPersonalization('favcolor')}",
                                    initial: true
                                },
                                {
                                    name: "HasNot",
                                    type: "QA",
                                    enter: "I don't know yet. What is yours?",
                                    variable: "favoritecolor",
                                    deactivate: {"%eval": "setPersonalization('favcolor', variables.favoritecolor)"}
                                },
                                {
                                    name: "OK",
                                    type: "Dummy",
                                    enter: "Your favorite color is %favcolor",
                                    final: true
                                }
                            ],
                            Transitions: ["Switch->OK, true", "Switch->HasNot,false", "HasNot->OK,*"]
                        }
                    }
                }
            },
            "Questions": [
                "What is my favorite color?"
            ]
        }
        
        
The logic of the state machine is quite straightforward here:
        
  - Qwiery has a personalization value for 'favcolor' and the flow transitions to the OK-state
  - Qwiery does not have the 'favcolor' in the personalization store for the user and the flow transitions to the 'HasNot' state
  - in either case the answer is the favorite color and the value is stored
  
The flow dynamically interpretes the JSON values at each step:
  
  - by setting the variable name to 'favoritecolor' the value can be reused in subsequent states
  - by means of the `hasPersonalization` and `setPersonalization` methods the flow accesses the personalization store
  
These methods are specific to the workflow mechanics. If you want to develop your own plugins or workflow states you can access the [Personalization service]{@link Personalization}.