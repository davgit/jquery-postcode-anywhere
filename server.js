var path    = require('path');
var express = require('express');
var app     = express();

app.use(express.compress());
app.use(express.static(__dirname));

app.get('/*', function(req,res)
{
    res.sendfile(path.resolve(__dirname, 'sample/index.html'));
});

app.listen(3000);

console.log('Listening on port 3000');
