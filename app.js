const express = require ('express');
const router = express.Router();
const app = express()
const Controller = require('./taxi-controller.js')

app.get('/', (req, res)=>{
    res.send('Taxi service app')
})

app.use(express.json());
app.use('/', router)

// app.get('/drivers', async (req, res) => {
//     try {
//         const drivers = await Controller.getDrivers();
//         res.json(drivers);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ err: 'Something went wrong' });
//     }
// });

const port = process.env.port || 3000;

app.listen(port, () => {
    console.log(`listening on port port`);
});