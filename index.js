
const express = require('express');

const app= express();

const jwt= require('jsonwebtoken');

const cors= require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());


app.get('/',(req,res)=>{

    res.send('hello')

})







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.andsvfa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJwt=(req,res,next)=>{

  const authorization= req.headers.authorization;

  if(!authorization){

    return res.status(401).send({error: true, message: 'unAuthorization'})
  }

  const token= authorization.split(" ")[1];


  

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(error,decoded)=>{

    if(error){

      return res.status(401).send({error: true, message: 'unAuthorization'})
    }

    req.decoded = decoded;

    next();
  })

  console.log(token)

};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const database = client.db("carDoctor");
    const serviceCollection = database.collection("services");

    const bookingCollection= database.collection("bookings");


    //jwt

    app.post('/jwt',(req,res)=>{

      const user= req.body;

      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn:'1h'});
     

      res.send({token})

      

    })


    //service

  app.get('/services',async(req,res)=>{

    const result= await serviceCollection.find().toArray()

    res.send(result)
  })

  app.get('/services/:id',async(req,res)=>{

    const id = req.params.id;

    const query = { _id: new ObjectId(id) };

    const options={

        projection:{
            title: 1,
            price:1,
            service_id: 1,
            img:1,
            status: 1
        }
    }


    const result= await serviceCollection.findOne(query,options)


    res.send(result)


  })

   //  booking

   app.get('/bookings',verifyJwt,async(req,res)=>{



   const decoded= req.decoded;

   console.log('iam back',decoded)

   if (decoded.email !== req.query.email){


     return  res.status(403).send({error:1,message: ' email not match'})

   }

    let query= {};

    if(req.query?.email){

      query={email: req.query.email}
    }

     const result= await bookingCollection.find(query).toArray()

     res.send(result)


   })

   app.post('/bookings',async(req,res)=>{

    const booking= req.body;

    const doc={
      name:booking.name,
      email:booking.email,
      date:booking.date,
      amount:booking.amount,
      service_id:booking.service_id,
      service:booking.service,
      img:booking.img
    }

    const result= await bookingCollection.insertOne(doc)


    res.send(result)
    console.log(booking)

   })



   app.patch('/bookings/:id',async(req,res)=>{

    const id= req.params.id;

    const updatedBooking= req.body;

    console.log(id,updatedBooking)

   

    const filter = { _id: new ObjectId(id) };


    const updateDoc = {
      $set: {
        status: updatedBooking.status
      },
    };

    const result = await bookingCollection.updateOne(filter, updateDoc);

    res.send(result)

   })


   app.delete('/bookings/:id',async(req,res)=>{





    const id= req.params.id;

    console.log(id)

    const query={_id: new ObjectId(id)}

    const result = await bookingCollection.deleteOne(query);


    res.send(result)


   })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port,()=>{

    console.log(port,'is running')
})


