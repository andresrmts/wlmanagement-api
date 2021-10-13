const express = require('express');
const compAuth = require('../../../util/compAuth');
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
// router.use(compAuth());

// Create Athlete

router.post('/competition/:compid/createathlete', (req, res) => {
  const { name, age, snatch, cnj, coachname } = req.body;
  const { id } = req.user;
  const { compid } = req.params;

  knex('athletes')
    .returning('*')
    .insert({
      name,
      compid2: compid,
      age,
      snatch,
      cnj,
      coachid: id,
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
});

// Delete comp

router.delete('/competition/:compid/delete', (req, res) => {
  const { compid } = req.params;

  knex.transaction(trx => {
    trx('competitions')
      .where('id', compid)
      .del()
      .returning('id')
      .then(competitionid => {
        return trx('officials')
          .where('compid', competitionid[0])
          .del()
          .returning('compid')
          .then(athcompid => {
            return trx('athletes')
              .where('compid', compid)
              .del()
              .then(response => res.json('Competition successfully deleted!'))
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
  })
  .catch(err => res.status(400).json('Unable to delete competition!'))
})

// Toggle competition status

router.patch('/competition/:compid/status', (req, res) => {
  const { compid } = req.params;
  const { status, time } = req.body;

  knex('competitions')
    .returning(['id', 'status', 'timer', 'attemptend'])
    .where('id', compid)
    .update({
      status,
      attemptend: time
    })
    .then(competition => res.json(competition[0]))
    .catch(e => res.status(400).json('Unable to toggle comp status!'))
});

module.exports = router;