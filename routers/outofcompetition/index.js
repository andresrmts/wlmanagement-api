const express = require('express');
const bcrypt = require('bcryptjs');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'getandressed',
    password: '',
    database: 'wlmanagement',
  },
});

const router = new express.Router();

// Sign in

router.post('/signin', (req, res) => {
  const { email, password } = req.body;

  knex
    .select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then(async data => {
      const isValid = await bcrypt.compare(password, data[0].hash);
      if (isValid) {
        return knex
          .select('*')
          .from('users')
          .where('email', '=', email)
          .then((user) => res.json(user[0]))
          .catch((err) => res.status(400).json('unable to get user'));
      }
      res.status(400).json('Wrong credentials');
    })
    .catch(err => res.status(400).json('Wrong credentials'));
});

// Register

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 8);
  knex
    .transaction((trx) => {
      trx
        .insert({
          hash,
          email,
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              name,
              email: loginEmail[0],
              joined: new Date(),
            })
            .then(user => res.json(user[0]));
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => res.status(400).json('Unable to register'));
});

// Create competition

router.post('/createcompetition', (req, res) => {
  const { name, authorId, location } = req.body;
  knex('competitions')
    .returning('*')
    .insert({
      name,
      authorid: authorId,
      location,
    })
    .then(competition => res.json(competition[0]))
    .catch(e => res.status(400).json('Not able to create competition!'));
});

module.exports = router;