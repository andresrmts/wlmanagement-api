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

  knex.select('email', 'hash')
    .from('login')
    .where('email', email)
    .then(async data => {
      const isValid = await bcrypt.compare(password, data[0].hash);
      if (isValid) {
        return knex.select('*')
          .from('users')
          .where('email', email)
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
      trx.insert({
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
  const { name, authorId, location, id } = req.body;
  knex('competitions')
    .returning('*')
    .insert({
      id,
      name,
      authorid: authorId,
      location,
    })
    .then(competition => res.json(competition[0]))
    .catch(e => console.log(e));
});

// Get Competitions

router.get('/competitions', (req, res) => {
  knex.select('id', 'authorid', 'name', 'location', 'status')
    .from('competitions')
    .then(competitions => res.json(competitions))
});

// Get single competition (enter competition)

router.post('/competitions/:compid', async (req, res) => {
  const { compid } = req.params;

  try {
    const competition = await knex.select('*')
      .from('competitions')
      .where('id', compid)

    const officials = await knex.select('*')
      .from('officials')
      .where('compid', compid);

    const athletes = await knex.select('*')
      .from('athletes')
      .where('compid', compid);

    if (competition.length === 0) {
      return res.status(400).json('Competition doesn\'t exist!')
    }
    return res.json({
      competition: competition[0],
      officials,
      athletes
    })
  } catch (e) {
    return res.status(400).json('Not able to fetch competition!')
  }
})

module.exports = router;