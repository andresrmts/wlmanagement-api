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
});

app.post('/createcompetition', (req, res) => {
  const { name, authorId, location } = req.body;
  knex('competitions')
    .returning('*')
    .insert({
      name,
      authorid: authorId,
      location
  })
  .then(competition => res.json(competition[0]))
  .catch(e => res.status(400).json('Not able to create competition!'))
});

app.post('/competition/:id/createathlete', (req, res) => {
  const { name, age, snatch, cnj, coachid, coachname } = req.body;
  const { id } = req.params;

  knex('athletes')
    .returning('*')
    .insert({
      name,
      compid: id,
      age,
      snatch,
      cnj,
      coachid,
      coachname
    })
    .then(athlete => res.json(athlete[0]))
    .catch(e => res.status(400).json('Unable to register athlete'));
});

app.delete('/competition/deleteathlete', (req, res) => {
  const { athleteid } = req.body;

  knex('athletes')
    .where('id', athleteid)
    .del()
    .then(response => res.json('Athlete succesfully deleted!'))
    .catch(e => res.status(400).json('Unable to delete athlete!'))
})

app.listen(port, () => {
  console.log(`Server running on ${port}`)
})