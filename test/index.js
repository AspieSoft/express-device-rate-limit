const {join} = require('path');
const express = require('express');
const turbx = require('turbx');
const app = express();

const rateLimit = require('../index')();

rateLimit.all(app);

app.engine('xhtml', turbx(app, {
  template: 'layout',
  components: 'components',
}));
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'xhtml');

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(3000);
