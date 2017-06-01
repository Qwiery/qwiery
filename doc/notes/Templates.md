
## General concepts

A template is a bit of JSON describing:
 
- which questions can be answered with the template
- what the answer(s) is (are)
- what side-effects it has, e.g. changing personalization values or creating an entity graph
- whether it applies to one particular user or to everyone
- in which category the question/answer is situated.

This template language (sometimes referred to as QTL for Qwiery Template Language) allows a lot of flexibility and covers a wide randge of needs. In cases where the JSON format is too limited one can use calls to the Qwiery plugins and, hence, access as good as everything (including child processes to, say, Python).

A template is stored either in the apps definition of the configuration or in the backend. The whole mechanism which allows to use these templates sits in the **Oracle service** and this service it usually called via the **Edictor interpreter**. In essence, the Oracle services looks templates up and the Edictor processes the most appropriate template. 

The Oracle service attempts to find a matching question for the given input. This answering mechanism justifies the title of rule-based AI. Each template can have one or more parametrized questions (strings). For example

        "This $1 is not OK"
        "On $1_date I fly to $2_location"
        "A $1 is a $2"
        
are parametrized input which could match respectively
        
        "This car is not OK"
        "On Wednesday 3rd of July I fly to New York"
        "A tree is a plant"

Note that punctuation is usually not included because most of it is discarded before matching occurs. Usually the Oracle service finds multiple matches and various things affect the best fit.

When the best fit is handed over to the Edictor a process starts which transforms the template in several steps:

- parameters are replaced
- if joins, choices, randomness...are defined the options are reduced and choices are made
- side-effects are executed and potentially returned values are inserted back into the template
- things are looked up (e.g. a REST weather service or Yahoo stock API)
- personalization, topics, history... are executed
- the actual answer is formulated

A QTL template can be seen as little bits of code which are executed (interpreted) like a DSL (domain specific language). 


## Root members

A template does not have to be complex, the most basic example being

        {
            Questions: "What is time",
            Template:{
                Answer: "Time is the essence of life"
            }
        }
        
This example also shows the only mandatory members, everything else is either inferred through defaults or augments the richness of the interaction. For instance, if topics are of no value to your case you can drop the Topics service and ignore the Topics member in a template. Also, the whole answering portion does not have to immediately meaningful. For instance, the following is perfectly fine:
          
          {
              Questions: "==AS431faASD#%13==",
              Template:{
                  Answer: "data:image/jpeg;base64, LzlqLzRBQ...<!-- base64 data -->"
              }
          }

and so is this template

          {
              Questions: "Get $13",
              Template:{
                  Answer: [
                  {
                    day: 142,
                    temp: "98-a785521-89"
                   },
                   {
                    car: "AD4785-RR",
                    type: "NA",
                    price: "Nil"
                   }
                  ]
              }
          }
These examples show that the QTL schema is not strict; the Answer member can be a string, a plain object or an array. Internally things are normalized in Qwiery but you have a lot of freedom to make schema 'errors' (read: variations). This normalization means that when processed input is returned in the shape of a session everything is schema-valid.
  
Below we review the various root elements of QTL and in the section below focus on the Template member because it has on its own a wide variety of possibilities.  

### Id

The template identifier is optional but if not supplied a random one will be generated. This identifier is needed for identification internally but has no effect on the processing or the output.

### Questions

Questions can be a single parametrized string or an array. 

Wildcards are recognized by the '$' prefix followed by an alpha-numeric name; $1, $x, $John, $country... You can have as many wildcards as you like. 

Wildcard can be tuned with two elements:

- an entity type, for example: $1_country, $country_location...
- a default, for example: $66:Nope, $name:(John Field)...

The two can be combined as well. You can have wildcards like $country_location:(United Kingdom),...


### UserId

This tells Qwiery whether the template is specific for a user or valid for everyone. So, the value of this member is either "Everyone" or the user identifier of a particular user. This allows to have private answers or side-effects for only one particular user.

### Template

The template defines the answer, how an answer has to be assembled and the side-effects. We describe this member more in detail below.

### Category

Categories organize templates and this can be helpful if you want to keep complexity under control. It also allows to constrain apps to a particular category. When defining an app you can specify one or more categories:
 
        apps: [
            {
                name: "SportGenius",
                id: "Kevin",
                categories: ["Sports", "News"]
            }
        ]

The default value is "*" which means that all categories are available to the app. Note that you can also define a set of templates within the configuration like so

        apps: [
            {
                name: "SportGenius",
                id: "Kevin",
                oracle:[
                    {
                            Questions: "What is time",
                            Template:{
                                Answer: "Time is the essence of life"
                            }
                    },
                    ...
                ]
            }
        ]

By specifying an oracle member you overrule the access to templates in the backend. A category specification is honored however and in this case the constraint then applies to the template categories defined in the app.

### Topics

Topics define subjects being discussed and have an effect on recalling previous discussions, emotional state and personality. More details about topics can be found [in the Topics document]{@tutorial Topics}

 

