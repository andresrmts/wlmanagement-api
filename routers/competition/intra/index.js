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

// Update competition

router.patch('/competition/:compid/update', (req, res) => {
  const { compid } = req.params;
  const { property, propertyValue } = req.body;

  knex('competitions')
    .returning(['id', property])
    .where('id', compid)
    .update({
      [property]: propertyValue
    })
    .then(response => res.json(response[0]))
    .catch(err => res.status(400).json(`Unable to update ${property}`));
})

// Update judge verdict

router.patch('/competition/:compid/judge', (req, res) => {
  const { compid } = req.params;
  const { spot, decision } = req.body;

  const judge = `verdict${spot}`

  knex('competitions')
    .returning(['verdict1', 'verdict2', 'verdict3'])
    .where('id', compid)
    .update({
      [judge]: decision
    })
    .then(decisions => res.json(decisions[0]))
    .catch(err => res.status(400).json('Unable to update verdict!'))
})

// Increase attempt & set attempt result

router.patch('/competition/:compid/setresult', (req, res) => {
  const { compid } = req.params;
  const { athleteid, attempt, result, lift } = req.body;

  const liftResult = `${lift}result[${attempt + 1}]`

  knex('athletes')
    .returning('*')
    .where('compid', compid)
    .where('id', athleteid)
    .update({
      [liftResult]: result
    })
    .increment({
      attempt: 1,
      [lift]: 1
    })
    .then(athlete => res.json(athlete[0]))
    .catch(err => res.status(400).json('Unable to update result!'))
});

module.exports = router;