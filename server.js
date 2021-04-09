const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3002;
app.use(express.json())
app.use(cors());

app.get('/', (req, res) => {
  res.send('The server is up')
});

app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  const user = {
    id: 72,
    name: "Kasutaja",
    email: 'kasutaja@kasutaja.ee'
  }

  if (!email || !password) {
    return res.status(404).json('Incorrect submission!')
  }

  if (email === 'email@email.com' && password === 'minuparool') {
    return res.json(user);
  }
  res.status(400).json('Wrong credentials');
})

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(404).json('Incorrect submission!')
  }

  const user = {
    id: Math.floor(Math.random() * 100),
    name,
    email
  };

  res.json(user);
})

app.listen(port, () => {
  console.log(`Server running on ${port}`)
})