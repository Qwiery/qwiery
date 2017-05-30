A session is an object which wraps everything need and known about a [request]{@link Ask}. It's passed through the processing pipeline and return as an 'answer'. It contains a lot of information which can be used on the UI level to present an answer.

 - **ExchangeId** is a counter corresponding to the amount of exchanges occurred between Qwiery and the user.
 - **AppId** is the identifier of the app (bot) which processed the request.
 - **Historize** is a boolean value which specifies whether the session was or should be historized. If the historization service is not set or defined there will, of course, be no historization.
 - **Input** is an object comprised of **Raw**, the raw input, and **Timestamp** a timestamp of when the request was received. Throughout the processing the `Session.Input.Raw` is effectively the input being analyzed and attempted to answer.
 - **Key** consists of the **userId** and a **correlationId**. The correlation id is the unique identifier across all users and sessions.
 - **Context** is the security context consisting of the **userId** and the **appId**. This context is passed to almost every service request to identify the permissions and data of the user.
 _ **Output** consists of the **Answer** and a **Timestamp** when the processing finished the session. The Answer is typically an array of [pods](@link Pods) but interpreters and services have quite a bit of freedom to put here whatever can be an 'answer' to the request. The texturizer (a collection of methods extracting parts of an answer) at the end of the processing can help to transform or extract an appropriate answer if needed.
 - **Format** the requested format (plain text, HTML...) which can be used by interpreters to tune the answer in function of the medium (web, CLI...) and form factor.
 - **OriginalSettings** the options passed to Qwiery. This allows custom modules to use/define custom settings which are not defined above through the default Session members.
 
 