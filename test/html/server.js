const path = require('path');
const express = require('express');

const app = express();

app.set('port', 4040);

app.use('/', express.static('test/html'));
app.use('/src', express.static('src'));
app.use('/test', express.static('test'));

const server = app.listen(app.get('port'), () => {
  console.log('-----------------------------------------');
  console.log(' Running Mocha on:', `http://localhost:${app.get('port')}`);
  console.log('-----------------------------------------');
});
