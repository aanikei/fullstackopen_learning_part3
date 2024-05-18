const express = require('express')
const app = express()
const morgan = require('morgan')

let persons = [
    { 
        "id": 1,
        "name": "Arto Hellas", 
        "number": "040-123456"
    },
    { 
        "id": 2,
        "name": "Ada Lovelace", 
        "number": "39-44-5323523"
    },
    { 
        "id": 3,
        "name": "Dan Abramov", 
        "number": "12-43-234345"
    },
    { 
        "id": 4,
        "name": "Mary Poppendieck", 
        "number": "39-23-6423122"
    }
]

app.use(express.json())
morgan.token('body', function (req, res) { 
    return req.method === "POST" ? JSON.stringify(req.body) : null
})
// with - at the end for non-POST, e. g. GET /api/persons/4 200 59 - 4.880 ms -
// app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// without - at the end for non-POST, e.g. GET /api/persons/4 200 59 - 3.923 ms
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res), " ",
        tokens.url(req, res), " ",
        tokens.status(req, res), " ",
        tokens.res(req, res, 'content-length'), ' - ',
        tokens['response-time'](req, res), ' ms ',
        ...(req.method === "POST" ? tokens['body'](req, res) : [])
    ].join('')
}))

app.get('/api/persons', (request, response) => {
    response.json(persons)
})

app.get('/info', (request, response) => {
    response.send(`
    <div>Phonebook has info for ${persons.length} people.</div>
    <br />
    <div>${new Date().toString()}</div>
    `)
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => person.id === id)
    if (person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)
    response.status(204).end()
})

app.post('/api/persons', (request, response) => {
    const body = request.body
  
    if (!body.name) {
        return response.status(400).json({ 
            error: 'The name is missing' 
        })
    } else if (!body.number) {
        return response.status(400).json({ 
            error: 'The number is missing' 
        })
    } else if (persons.filter(x => x.name === body.name).length) {
        return response.status(400).json({ 
            error: 'The name already exists in the phonebook' 
        })
    }
  
    const person = {
        id: Math.floor(Math.random() * Date.now()),
        name: body.name,
        number: body.number
    }
  
    persons = persons.concat(person)
    response.json(person)
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})