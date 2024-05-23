require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

let persons = []

app.use(express.static('dist'))
app.use(cors())
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

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }
  
    next(error)
}

app.get('/api/persons', (request, response) => {
    Person
        .find({}).then(result => {
            response.json(result)
        })
})

app.get('/info', (request, response) => {
    response.send(`
    <div>Phonebook has info for ${persons.length} people.</div>
    <br />
    <div>${new Date().toString()}</div>
    `)
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findById(id)
        .then(person => {
            if (person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error)) 
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id

    Person.findByIdAndDelete(id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))

    persons = persons.filter(person => person.id !== id)
})

app.put('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    const body = request.body

    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(id, person, { new: true })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
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
  
    const person = new Person({
        name: body.name,
        number: body.number,
    })
  
    persons = persons.concat(person)
    
    person.save()
        .then(savedPerson => {
            response.json(savedPerson)
        })
        .catch(error => next(error))
})

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})