There is a [special interpreter]{@link Alias} which sits in the very beginning of the processing pipeline and which allows you to rephrase input. This rephrasing helps to increase input flexibility of commands but you can use it for any preprocessing. It should be noted that this preprocessing does not deal with punctuation and alike, this happens independently just before a question is pushed through the pipeline. Things like reformatting "what's" to "what is" to ensure uniformity of language happens there.

The current implementation of the Alias interpreter uses regular expressions but a a proper parser/interpreter (like the Pratt parser used by the workflows) will be implemented in the future.

Adding more rules to this Alias is very easy. For example, the rule which allows one to use simplye "agenda" instead of the more verbose "get>agenda>" to fetch the user's agenda is implemted as    
    
    {
        what: "agenda * => get>agenda>",
        rex: /^\s?(agenda\s?:?>?\s?|show agenda|display agenda)/gi,
        with: "get>agenda>"
    }

and you can see that "show agenda" or "display agenda" would work as well. The replacement also accepts functions, so you can have things like


    {
        what: "remove tag from => delete>tag>",
        rex: /^\s?(?:(delete|remove) tag )(\w+)(?: from )(\w+)/gi,
        with: function(input) {
            let r = /^\s?(?:(delete|remove) tag )(\w+)(?: from )(\w+)/gi.exec(input);
            return `delete>tag> name: ${r[2]}, id: ${r[3]}`;
        }
    }
    
thus giving a whole lot of flexibility to reformat things before any other interpreter attempts to answer the question.

If you need even more power you can of course implement a custom interpreter and through this do anything and everything you like with the session.    
    
    
