
MongoDB stores the full graph (nodes+links) in one JSON blob. Below are some details. 

- _id: is part of the MongoDB system
- userId: the unique identifier used by Qwiery
- Links: the connections between entities found in the Entities
- Entities: the nodes
- Workspaces: the groups or workspaces of entities
- Metadata: things like what other spaces there is a connection to



    {
        "_id" : ObjectId("57f36acdb6a99139916f7c81"),
        "userId" : "Sharon",
        "Links" : [ 
            {
                "IdSource" : "Login",
                "IdTarget" : "WhoAmI",
                "Id" : "h5m65iiBlH",
                "UserId" : "Sharon"
            }, 
            {
                "IdSource" : "WhoAmI",
                "IdTarget" : "SharedThought",
                "Id" : "h5m65iiRRR",
                "UserId" : "Sharon"
            }
        ],
        "Entities" : [ 
            {
                "Id" : "Login",
                "Title" : "Login",
                "Description" : "All the basic login functionality should work flawlessly. Check also the Anonymous situation.",
                "DataType" : "Task",
                "WorkspaceId" : "Sharon:default",
                "Tags" : [],
                "Users" : [ 
                    "Sharon"
                ],
                "UserId" : "Sharon"
            }, 
            {
                "Id" : "WhoAmI",
                "Title" : "Who am I",
                "Description" : "When logged in this should use the Username personalization set via Social info. Otherwise something like 'You are not known.'.",
                "Priority" : 6,
                "DataType" : "Task",
                "WorkspaceId" : "Sharon:default",
                "Tags" : [],
                "Users" : [ 
                    "Sharon"
                ],
                "UserId" : "Sharon"
            },
            {
                "Title" : "Impression",
                "DataType" : "Thought",
                "Id" : "Impression",
                "UserId" : "Sharon",
                "Users" : [ 
                    "Sharon"
                ],
                "Tags" : [],
                "WorkspaceId" : "Sharon:default",
                "Description" : "**Impressionism** is a 19th-century [art movement](https://en.wikipedia.org/wiki/Art_movement \"Art movement\") that originated with a group of Paris-based artists whose independent [exhibitions](https://en.wikipedia.org/wiki/Art_exhibition \"Art exhibition\") brought them to prominence during the 1870s and 1880s. Impressionist painting characteristics include relatively small, thin, yet visible brush strokes, open [composition](https://en.wikipedia.org/wiki/Composition_(visual_arts) \"Composition (visual arts)\"), emphasis on accurate depiction of light in its changing qualities (often accentuating the effects of the passage of time), ordinary subject matter, inclusion of *movement* as a crucial element of human perception and experience, and unusual visual angles.\n\nThe Impressionists faced harsh opposition from the conventional art community in France. The name of the style derives from the title of a [Claude Monet](https://en.wikipedia.org/wiki/Claude_Monet \"Claude Monet\") work, *Impression, soleil levant* (*[Impression, Sunrise](https://en.wikipedia.org/wiki/Impression,_Sunrise \"Impression, Sunrise\")*), which provoked the critic [Louis Leroy](https://en.wikipedia.org/wiki/Louis_Leroy \"Louis Leroy\") to [coin](https://en.wikipedia.org/wiki/Word_coinage \"Word coinage\") the term in a [satirical](https://en.wikipedia.org/wiki/Satire \"Satire\") review published in the Parisian newspaper *[Le Charivari](https://en.wikipedia.org/wiki/Le_Charivari \"Le Charivari\")*.\n\nThe development of Impressionism in the [visual arts](https://en.wikipedia.org/wiki/Visual_arts \"Visual arts\") was soon followed by analogous styles in other media that became known as [impressionist music](https://en.wikipedia.org/wiki/Impressionist_music \"Impressionist music\") and [impressionist literature](https://en.wikipedia.org/wiki/Impressionism_(literature) \"Impressionism (literature)\").\n\nRadicals in their time, early Impressionists violated the rules of academic painting. They constructed their pictures from freely brushed colours that took precedence over lines and contours, following the example of painters such as [Eugène Delacroix](https://en.wikipedia.org/wiki/Eug%C3%A8ne_Delacroix \"Eugène Delacroix\") and [J. M. W. Turner](https://en.wikipedia.org/wiki/J._M._W._Turner \"J. M. W. Turner\"). They also painted realistic scenes of modern life, and often painted outdoors. Previously, [still lifes](https://en.wikipedia.org/wiki/Still_life \"Still life\") and [portraits](https://en.wikipedia.org/wiki/Portrait \"Portrait\") as well as [landscapes](https://en.wikipedia.org/wiki/Landscape_art \"Landscape art\") were usually painted in a studio.[[1]](https://en.wikipedia.org/wiki/Impressionism#cite_note-1) The Impressionists found that they could capture the momentary and transient effects of sunlight by painting *[en plein air](https://en.wikipedia.org/wiki/En_plein_air \"En plein air\")*. They portrayed overall visual effects instead of details, and used short \"broken\" brush strokes of mixed and pure unmixed colour—not blended smoothly or shaded, as was customary—to achieve an effect of intense colour vibration.\n\nImpressionism emerged in France at the same time that a number of other painters, including the Italian artists known as the [Macchiaioli](https://en.wikipedia.org/wiki/Macchiaioli \"Macchiaioli\"), and [Winslow Homer](https://en.wikipedia.org/wiki/Winslow_Homer \"Winslow Homer\") in the United States, were also exploring *plein-air* painting. The Impressionists, however, developed new techniques specific to the style. Encompassing what its adherents argued was a different way of seeing, it is an art of immediacy and movement, of candid poses and compositions, of the play of light expressed in a bright and varied use of colour.\n\nThe public, at first hostile, gradually came to believe that the Impressionists had captured a fresh and original vision, even if the art critics and art establishment disapproved of the new style.\n\nBy recreating the sensation in the eye that views the subject, rather than delineating the details of the subject, and by creating a welter of techniques and forms, Impressionism is a precursor of various painting styles, including [Neo-Impressionism](https://en.wikipedia.org/wiki/Neo-Impressionism \"Neo-Impressionism\"), [Post-Impressionism](https://en.wikipedia.org/wiki/Post-Impressionism \"Post-Impressionism\"), [Fauvism](https://en.wikipedia.org/wiki/Fauvism \"Fauvism\"), and [Cubism](https://en.wikipedia.org/wiki/Cubism \"Cubism\")."
            }, 
            {
                "Title" : "The greatest speech ever made",
                "DataType" : "Video",
                "Id" : "GreatestSpeech",
                "UserId" : "Sharon",
                "Url" : "https://www.youtube.com/embed/WibmcsEGLKo",
                "Description" : "Charlie Chaplin's final speech in The Great Dictator.",
                "Users" : [ 
                    "Sharon"
                ],
                "Tags" : [ 
                    "YouTube", 
                    "Great", 
                    "Video"
                ],
                "WorkspaceId" : "Sharon:default"
            }, 
            {
                "Title" : "Something new",
                "Description" : "None yet",
                "Id" : "uaxDqTuqVS",
                "Users" : [ 
                    "Sharon"
                ],
                "Tags" : [],
                "WorkspaceId" : "Sharon:default",
                "UserId" : "Sharon",
                "DataType" : "Thought"
            } 
           
        ],
        "Workspaces" : [ 
            {
                "WorkspaceId" : "Sharon:default",
                "Name" : "Default workspace",
                "IsPublic" : false,
                "IsDefault" : true,
                "UserId" : "Sharon",
                "_id" : ObjectId("58b989552f0774b919f2f110"),
                "Users" : [ 
                    "Sharon"
                ]
            }, 
            {
                "WorkspaceId" : "DocumentationSpace",
                "Name" : "Documentation workspace",
                "IsPublic" : true,
                "IsDefault" : false,
                "UserId" : "Sharon",
                "_id" : ObjectId("58b989552f0774b919f2f10f"),
                "Users" : [ 
                    "Sharon", 
                    "Everyone"
                ]
            }
        ],
        "Metadata" : {
            "Workspaces" : [ 
                "Sharon:default", 
                "DocumentationSpace"
            ],
            "AccessTo" : [],
            "Tags" : [ 
                "Music", 
                "Documentation", 
                "TagIFB7JHlso4"
            ],
            "Trail" : [ 
                "HDRIRendering", 
                "Ludwig", 
                "D", 
                "Spheres", 
                "Connected", 
                "GarashCake", 
                "Green tea", 
                "Impression", 
                "Maecenas", 
                "LoremIpsum"
            ],
            "UserId" : "Sharon",
            "CurrentWorkspace" : "Sharon:default"
        }
    }