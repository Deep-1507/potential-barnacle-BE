import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

import facultyRoutes from "./routers/facultyRouter.js";
import uploadRoutes from "./routers/uploadRouter.js";

const app = express();

// Serve static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders:['Content-Type','Authorization'],
}));

app.use(express.json());

// Routes
app.use("/api/faculty", facultyRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
    res.send("Server is running!");
});


// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// MongoDB Connection
let isConnected = false; // Prevent multiple connections in serverless
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        isConnected = true;
        console.log("Connected to the Database");
    } catch (error) {
        console.log("Error Connecting to Database", error);
    }
};
connectDB();

export default app;