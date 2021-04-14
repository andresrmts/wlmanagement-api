const express = require('express');
const cors = require('cors');
const preCompRouter = require('./routers/competition/pre');
const outOfCompRouter = require('./routers/outofcompetition');

const app = express();
const port = process.env.PORT || 3002;
app.use(express.json());
app.use(cors());
app.use(preCompRouter, outOfCompRouter)

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
