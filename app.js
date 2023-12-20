const express = require ('express');
const app = express()
const router = require('./taxi-router.js')

app.get('/', (req, res)=>{
    res.send('Taxi service app')
})

app.use(express.json());
app.use('/', router);



const port = process.env.port || 3000;

app.listen(port, () => {
    console.log(`listening on port port`);
});