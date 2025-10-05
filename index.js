import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import facultyRoutes from "./routers/facultyRouter.js"
import uploadRoutes from "./routers/uploadRouter.js"

const app = express();

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders:['Content-Type','Authorization'],
}));

app.use(express.json());

console.log(process.env.MONGO_DB_CONNECTION_STRING)

mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(()=>console.log("Connected to the Database"))
.catch((error) => console.log("Error Connecting to Database",error))

app.use("/api/faculty",facultyRoutes)
app.use("/api/upload",uploadRoutes)

process.on('SIGINT',() => {
    console.log('Shutting down server....');
    server.close(()=>{
        console.log('Server closed');
        process.exit(0);
    })
})

app.use((req,res,next) => {
    res.status(404).json({error:'Route not found'})
})

app.use((err,req,next) => {
    console.error(err.stack);
    res.status(500).json({error:'Internal Server Error'})
})

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server Running on port ${port}`)
})