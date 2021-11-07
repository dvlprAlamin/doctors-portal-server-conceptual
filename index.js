const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb');
require('dotenv').config();
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;






const serviceAccount = require('./real-doctors-portal-firebase-adminsdk-ap64h-c0c53499c2.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


async function verifyToken(req, res, next) {
    if (req.headers?.authorization) {
        const token = req.headers.authorization.split('Bearer ')[1];
        try {
            const user = await admin.auth().verifyIdToken(token)
            req.email = user.email;
        } catch {

        }
    }
    next()

}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vsgsy.mongodb.net/doctorsPortal?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const appointmentCollection = client.db('doctorsPortal').collection('appointment');
        const adminCollection = client.db('doctorsPortal').collection('admin');
        console.log('db connected')
        app.post('/addAppointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentCollection.insertOne(appointment)
            res.json(result.acknowledged)
        })

        app.get('/appointments', verifyToken, async (req, res) => {
            // console.log(req.email)
            // console.log(req.query.email)
            if (req.email && req.email === req.query.email) {
                const cursor = appointmentCollection.find({})
                const appointments = await cursor.toArray();
                res.json(appointments)
            } else {
                res.status(401).json([{ message: 'Unauthorized' }])
            }

        })
        app.get('/isAdmin', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (email) {
                const cursor = adminCollection.find({ email: email })
                const isAdmin = await cursor.toArray();
                res.send(isAdmin.length > 0);
            }

        })
    }
    finally {

    }
}

run().catch(console.dir)
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

app.listen(port)