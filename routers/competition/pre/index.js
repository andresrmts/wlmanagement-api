const express = require('express');
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

// Create Athlete

router.post('/competition/:id/createathlete', (req, res) => {
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

router.delete('/competition/:compid/deleteparticipant', (req, res) => {
  const { id, group } = req.body;
  const { compid } = req.params;

  knex(group)
    .returning('id')
    .where('id', id)
    .where('compid', compid)
    .del()
    .then(response => res.json(response[0]))
    .catch(e => res.status(400).json('Unable to delete participant!'));
});

// Register official for competition

router.post('/competition/:compid/registerofficial', (req, res) => {
  const { userid, name, role, spot } = req.body;
  const { compid } = req.params;

  knex('officials')
    .count('userid')
    .where('userid', userid)
    .where('compid', compid)
    .then(response => {
      if (Number(response[0].count) !== 0) {
        return res.json('You have already registered as an official in this competition!')
      }
      if (role === 'judge') {
        knex('officials')
          .count('role')
          .where('role', 'judge')
          .where('compid', compid)
          .where('accepted', true)
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

router.patch('/competition/:compid/acceptofficial', (req, res) => {
  const { compid } = req.params;
  const { id } = req.body;

  knex('officials')
    .returning('*')
    .where('compid', compid)
    .where('id', id)
    .update({
      accepted: true
    })
    .then(official => res.json(official[0]))
    .catch(err => res.status(400).json('Unable to accept official!'))
});

// Edit athlete

router.patch('/competition/:compid/editathlete', (req, res) => {
  const { compid } = req.params;
  const { athleteid, property, propertyValue } = req.body;

  knex('athletes')
    .returning('*')
    .where('compid', compid)
    .where('id', athleteid)
    .update({
      [property]: propertyValue
    })
    .then(athlete => res.json(athlete[0]))
    .catch(err => res.status(400).json(`Unable to edit ${property}!`))
})

module.exports = router;