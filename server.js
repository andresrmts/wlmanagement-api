const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'getandressed',
    password : '',
    database : 'wlmanagement'
  }
});

const app = express();
const port = process.env.PORT || 3002;
app.use(express.json())
app.use(cors());

app.get('/', (req, res) => {
  res.send('The server is up')
});

app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  knex.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(async data => {
      const isValid = await bcrypt.compare(password, data[0].hash);
      if (isValid) {
        return knex.select('*').from('users')
          .where('email', '=', email)
          .then(user => res.json(user[0]))
          .catch(err => res.status(400).json('unable to get user'))
      }
      res.status(400).json('Wrong credentials');
    })
    .catch(err => res.status(400).json('Wrong credentials'))
})

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 8);
  knex.transaction(trx => {
    trx.insert({
      hash,
      email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => { 
      return trx('users')
        .returning('*')
        .insert({
          name,
          email: loginEmail[0],
          joined: new Date()
        })
        .then(user => res.json(user[0]))
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json('Unable to register'));
})

app.listen(port, () => {
  console.log(`Server running on ${port}`)
})