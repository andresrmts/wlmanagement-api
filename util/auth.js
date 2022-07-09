const jwt = require('jsonwebtoken');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'getandressed',
    password: '',
    database: 'wlmanagement',
  },
});

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'thisisasecret');
    let user = await knex.select('*')
    .from('users')
    .where('email', decoded.email);

    if (user[0].tokens.includes(token)) {
      req.user = user[0];
      req.token = token;
      next();
    }
      throw new Error();
  } catch (e) {
    res.status(401).send({ err: 'please authenticate' })
  }
}

module.exports = auth;