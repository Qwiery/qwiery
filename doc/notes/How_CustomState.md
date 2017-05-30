Let's create a few custom states to illustrate the various key-methods of a [workflow state]{@link WorkflowState}.

Imagine you need numeric input from the user and wishes to wrap this functionality in a `NumericState` state. You create a standard class inheriting from the `WorkflowState` like so:

    const Qwiery = require("qwiery");
    class NumericState extends Qwiery.WorkflowState{
        
        constructor(){
            super();
        }
    
    }
    
The user input is passed when the state is being executed, so you simply override the `execute` method and check therein the given input:
    
    execute(input){
        
        const num = parseInt(input);
        if(num === Number.NaN){
            this.reject("Please enter a number.");
        }else{
            this.accept();
        }    
    }      
    
That's it, all the rest will be taken care of. How do you use this custom state in a template? You save the custom state as a JS file somewhere and specify a path. 
    
    
    {
            "Template": {
                "Answer": "ThinkResult",
                "Think": {
                    "CreateReturn": {
                        "Workflow": {                           
                            "States": [
                                {
                                    "name": "ask it",
                                    "path": "somewhere/NumericState.js",
                                    "final": true,
                                    "initial": true    
                                }
                            ]
                        }
                    }
                }
            },
            "Questions": [
                "Test it"
            ]
        }

You can add this template in the oracle backend or inline in custom app. Upon entering "test it" the template will be picked up, the flow instantiated and "Please enter a number" will be triggered. When answered the input will flow towards your custom state and if a number is given the flow will terminate. Otherwise the flow will remain in the state and keep asking for a number.
        
How do you handle recurring bad input? Either the use uses a quit-like input (things like 'quit', 'forget about it' will work) or you need to deal with this in your custom state. This is really easy, you simply keep track of how many time there is a re-intrance and act accordingly
        
        
        if(!this.reintrance) {
            this.reintrance = 0;
        } else {
            this.reintrance += 1;
        }
        if(this.reintrance >= 4) {
            this.workflow.forgetIt("Let's forget about it, shall we?");
        } else {
            return this.reject();
        }
        
        