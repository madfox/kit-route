## Installation

```
$ npm install kit-route
```


## Example

```js
var koa = require("koa");
var app = koa();

var Route = require("kit-route");

var r1 = Route();

r1.get(function*(next){
	this.body = "get one";
});

r1.get("/readme", function*(next){
	this.body = "ReadMe";
});

r1.post("/post", function*(next){
	/* ... */
});

r1.addHandle("/", "get,post,delete,put", function*(next){
	this.body = "....";
});

app.use(r1.gen());

app.listen(12345);
```