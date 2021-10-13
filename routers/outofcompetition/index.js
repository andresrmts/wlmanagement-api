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
const generateToken = require('../../util/generateToken');
const auth = require('../../util/auth');

const router = new express.Router();

// Sign in

router.post('/signin', (req, res) => {
  const { email, password } = req.body;
  const token = generateToken(email);

  knex.select('email', 'hash')
    .from('login')
    .where('email', email)
    .then(async data => {
      const isValid = await bcrypt.compare(password, data[0].hash);
      if (isValid) {
        return knex.select('tokens')
          .from('users')
          .where('email', email)
          .then(tokens => {
            const tokensLength = tokens[0].tokens.length;
            const tokenVar = `tokens[${tokensLength + 1}]`
            knex.select()
            .from('users')
            .returning('*')
            .where('email', email)
            .update({
              [tokenVar]: token
            })
            .then(user => res.json({
              user: user[0],
              token
            }))
            .catch(err => res.json(err))
          })
          .catch((err) => res.status(400).json('unable to get user'));
      }
      res.status(400).json('Wrong credentials');
    })
    .catch(err => res.status(400).json('Wrong credentials'));
});

// Register

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const token = generateToken(email);

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
              tokens: [token]
            })
            .then(user => res.status(201).json({
              user: user[0],
              token
            }
            ));
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => res.status(400).json('Unable to register'));
});

// Log out

router.post('/logout', auth, async (req, res) => {
  const { user, token } = req;

  try {
    const selectUser = await knex.select('*')
    .from('users')
    .where('email', user.email)
  
    if (selectUser.length !== 0) {
      let newTokenArr = selectUser[0].tokens.filter(tok => tok !== token);

      console.log(newTokenArr);
  
      await knex.select('tokens')
      .from('users')
      .where('email', user.email)
      .update('tokens', newTokenArr);

      res.send();

    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(400).send({ err: 'User not found' })
  }
  
})

// Create competition

router.post('/createcompetition', auth, (req, res) => {
  const { name, location, id } = req.body;
  const authorid = req.user.id;
  knex('competitions')
    .returning('*')
    .insert({
      compid: id,
      name,
      authorid,
      location,
    })
    .then(competition => res.json(competition[0]))
    .catch(e => console.log(e));
});

// Get Competitions

router.get('/competitions', auth, (req, res) => {
  knex.select('compid', 'authorid', 'name', 'location', 'status')
    .from('competitions')
    .then(competitions => res.json(competitions))
});

// Get single competition (enter competition)

router.post('/competitions/:compid', auth, async (req, res) => {
  const { compid } = req.params;

  try {
    const competition = await knex.select('*')
      .from('competitions')
      .where('compid', compid)

    const officials = await knex.select('*')
      .from('officials')
      .where('compid2', compid);

    const athletes = await knex.select('*')
      .from('athletes')
      .where('compid2', compid);

    if (competition.length === 0) {
      return res.status(400).json('Competition doesn\'t exist!')
    }
    return res.json({
      competition: competition[0],
      officials,
      athletes
    })
  } catch (e) {
    console.log(e);
    return res.status(400).json('Not able to fetch competition!')
  }
})

module.exports = router;