const express = require('express');
const cors = require('cors');
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

const app = express();
const port = process.env.PORT || 3002;
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('The server is up');
});

// Sign in

app.post('/signin', (req, res) => {
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

app.post('/register', async (req, res) => {
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

app.post('/createcompetition', (req, res) => {
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

// Create Athlete

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
      coachname,
    })
    .then(athlete => res.json(athlete[0]))
    .catch(e => res.status(400).json('Unable to register athlete'));
});

// Delete Athlete/Official

app.delete('/competition/:compid/deleteparticipant', (req, res) => {
  const { id, group } = req.body;
  const { compid } = req.params;

  knex(group)
    .returning('id')
    .where('id', id)
    .where('compid', '=', compid)
    .del()
    .then(response => res.json(response[0]))
    .catch(e => res.status(400).json('Unable to delete participant!'));
});

// Register official for competition

app.post('/competition/:compid/registerofficial', (req, res) => {
  const { userid, name, role, spot } = req.body;
  const { compid } = req.params;

  knex('officials')
    .count('userid')
    .where('userid', '=', userid)
    .where('compid', '=', compid)
    .then(response => {
      if (Number(response[0].count) !== 0) {
        return res.json('You have already registered as an official in this competition!')
      }
      if (role === 'judge') {
        knex('officials')
          .count('role')
          .where('role', '=', 'judge')
          .where('compid', '=', compid)
          .where('accepted', '=', true)
          .then(officials => {
            if (Number(officials[0].count) === 3) {
              return res.json('There are already 3 judges for this event');
            }
            return knex('officials')
              .returning('*')
              .insert({
                compid,
                userid,
                name,
                role,
                spot,
              })
              .then(official => res.json(official[0]))
              .catch(e => res.status(400).json('Not able to register judge!'))
          })
          .catch(e => res.status(400).json('Error!'))
          return;
      }
      knex('officials')
        .returning('*')
        .insert({
          compid,
          userid,
          name,
          role,
        })
        .then(official => res.json(official[0]))
        .catch(e => res.status(400).json('Not able to register official!'))
    })
});

// Accept official

app.patch('/competition/:compid/acceptofficial', (req, res) => {
  const { compid } = req.params;
  const { id } = req.body;

  knex('officials')
    .returning('*')
    .where('compid', '=', compid)
    .where('id', '=', id)
    .update({
      accepted: true
    })
    .then(official => res.json(official[0]))
    .catch(err => res.status(400).json('Unable to accept official!'))
})

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
