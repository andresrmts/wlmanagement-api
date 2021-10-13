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

const compAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'thisisasecret');
    const { compid } = req.params;
    
    let user = await knex.select('*')
    .from('users')
    .where('email', decoded.email);

    if (user[0].tokens.includes(token)) {
      let compOfficial = await knex.select('name')
      .from('officials')
      .where({
        compid2: compid,
        userid: user[0].id 
      });

      let compAdmin = await knex.select('authorid')
      .from('competitions')
      .where({
        compid,
        authorid: user[0].id
      })
      if (compOfficial.length !== 0 || compAdmin.length !== 0) {
        req.user = user[0];
        next();
      } else {
        throw new Error();
      }
    } else {
      throw new Error();
    }

  } catch (e) {
    res.status(401).send({ err: 'please authenticate' })
  }
}

module.exports = compAuth;