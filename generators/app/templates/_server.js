var express = require('express');
var app = express();

app.use('/js', express.static(__dirname + '/app/js'));
app.use('/css', express.static(__dirname + '/app/css'));
app.use('/scss', express.static(__dirname + '/app/scss'));
app.use('/', function(req, res) {
	res.sendFile('app/index.html', {
		"root": __dirname
	});
});
app.listen(3000);