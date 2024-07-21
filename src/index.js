import express from 'express'
import { Client, Pool } from 'pg'

const DATABASE_URL = 'postgresql://projectdb_owner:rRVfs8gPJn6e@ep-tight-waterfall-a4ogt097.us-east-1.aws.neon.tech/MyDatabaseTodoList?sslmode=require'

const app = express()

app.use(express.json())

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

pool.connect((err, client, release) => {
    if (err) {
      return console.error('Erro adquirindo o cliente do pool:', err);
    }
    client.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        return console.error('Erro executando a consulta:', err);
      }
      console.log('Conexão bem-sucedida:', result.rows);
    });
  });


//------------------------------------------------------

app.get('/api/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks')
        res.json(result.rows)
    } catch (err) {
        res.status(500).send('Server Error')
    }
});

app.post('/api/task', async (req, res) => {
    const { name, category } = req.body
    if (!name || !category) {
        return res.status(400).json({ error: "Todos os campos devem ser preenchidos!" })
    }
    try {
        const result = await pool.query(
            'INSERT INTO tasks (name, category) VALUES ($1, $2) RETURNING *',
            [name.toLowerCase(), category]
        )

        res.status(201).json({ success: true, msg: 'Task cadastrada' })
    } catch (err) {
        console.error('Erro ao inserir a task ', err.message)
        res.status(500).json('Problemas com o servidor!')
    }
})

app.put('/api/task/:name', async (req, res) => {
    const { name } = req.params
    try {
        const taskHolder = await pool.query('SELECT * FROM tasks WHERE LOWER(name) = LOWER($1)', [name])
        if (taskHolder.rows.length === 0) {
            return res.status(404).json({ success: false, msg: 'Task não encontrada!' })
        }
        await pool.query('UPDATE tasks SET status = true WHERE LOWER(name) = LOWER($1) RETURNING *', [name])
        res.status(200).json({ success: true, msg: "Task atualizada" })
    } catch (err) {
        console.error('Erro ao atualizar a task ', err.message)
        res.status(500).json('Problemas com o servidor!')
    }
})

app.listen(9090, () => console.log('Servidor Iniciado'))