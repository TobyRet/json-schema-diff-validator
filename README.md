json-schema-diff-validator
==========================
This package allows comparision of two versions of schema file and detect any breaking change.
The new version is considered as non-backward compatible when
* a new node with minimum requirement is added.
* when a node is removed.
* when a node is replaced.

Usage
-----
``` 
npm install json-schem-diff-validator -g
json-schem-diff-validator oldschema.json newschema.json
```
This will return with exit code 0 if there is no breaking change.
Throws an exception if there is a breaking change 

```$xslt
Error: The schema is not backward compatible. Difference include breaking change = 
[{"op":"remove","path":"/definitions/code_inline_node/allOf/1/properties"},{"op":"replace","path":"/definitions/code_inline_node/allOf/1/type","value":"string"}]

```

###To use it in code
```$xslt
 const difftool = require('json-schema-diff-validator')
 #to validate files
 difftool.validateSchemaFiles(file1,file2);
 #to validate json objects 
 difftool.validateSchemaCompatibility(oldjson , newjson)
```


