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

module.exports = router;