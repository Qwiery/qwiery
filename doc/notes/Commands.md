Commands are are ways to interact with Qwiery's data, graph, configuration and more. For example, you can add directly an idea (a Thought entity) about 'office furniture' to your graph via
 
        add> idea> office furniture
        
and Qwiery will reply with
          
          ▶ The new node has been added.
          
          Title       : office furniture            
          DataType    : Thought                     
          Id          : gNOBxD9xqz                  
          Users       : Anonymous                   
          Tags        :                             
          WorkspaceId : Anonymous:default           
          UserId      : Anonymous                   
          Description :                             


There are various alternative to this, you can also say

        idea> office furniture
        
and if you want to specify properties you can use **named arguments** like so
        
        idea> title: office furniture, description: Ikea things look great
        
Below is an overview of the command language.
        

## Adding things
        
To add ideas, addresses and other data entities use the generic statement
        
        add>entity_name> parameters

where

        - entity_name: the name of an entity type like idea, thought, address, person...
        - parameters: either a string which will be mapped to the Title of 
                      the entity (all entitis have a Title property) or named arguments.
        
Name arguments are comma-separated properties, for example
 
        title: sunday brunch, description: with the family
        
Adding a Person could be
        
        add>person> title: John Williams, firstname: John, lastname: Williams
        
Adding an address could be
        
        add>address> street: Picard lane 124, city: London, country: UK
        
Various shortcuts are available:

    add idea ... is be mapped to add>idea> ...
    


## Deleting things
        
To delete an entity use the generic statement
        
        delete> entityId
        
and you can obtain the id of an entity by means of a search, say
        
        search> j*
        
To selete a workspace use

        delete>space> name-of-space 

or simple

        delete space ...
        
You can list your workspaces by means of
        
        spaces>
        
and the current space via
        
        get>space> 

or simply 
        
        current space
        

## Language 
        
Various language oriented commands are available as well.
        
Word definitions
        
        lookup> wisdom
        define> time
        
Sentiment analysis
        
        feelings> she was so angry at me
        
Summarizing text
        
        summarize> ....
        
Synonyms of words
        
        syms> ...

Keywords of give text
        
        keywords> ...
        keys>...
        
Part of speech:
        
        pos> ...
        
## Diverse
        
There are diverse things you can do or ask like
        
        version
        tell me your version

The terms and license
        
        terms
        
Asking for help about a topic
        
        help> plugins
        help about plugins