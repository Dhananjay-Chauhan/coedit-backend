import Fastify from "fastify";
import fastifyCORS from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Document from "./models/document.js";
import document from './controllers/generateDocument.js';
import chat from './controllers/chat.js';
import auth from './controllers/auth/auth.js';
const app = Fastify();

// Enable CORS for Fastify
app.register(fastifyCORS, {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
});
dotenv.config();

app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
app.register(document);
app.register(chat);
app.register(auth,{prefix:"/auth"});



// Connect to MongoDB
mongoose.connect(
  "Enter Mongo URL",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

app.delete("/documents", async (request, reply) => {
  try {
    const deletedCount = await Document.deleteMany({});
    reply.send({ message: `Deleted ${deletedCount.deletedCount} documents` });
  } catch (err) {
    reply
      .code(500)
      .send({ error: "Failed to delete documents", message: err.message });
  }
});


// Create Socket.IO instance using the HTTP server
const io = new Server(app.server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


// Real-time collaboration with Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected");

  // Join a specific document room using the document hash
  socket.on("join-document", async ({ hash, user }) => {
    socket.join(hash);
    io.to(hash).emit("user-joined", user);
    console.log(`${user} joined document room: ${hash}`);

    try {
      const document = await Document.findOne({ hash });
      if (document) {
        socket.emit("load-chat", document.chat); // Send previous chat messages
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }

  });

  socket.on("cursor-position", (hash, cursorData) => {
    console.log(cursorData);
    socket.to(hash).emit("cursor-position", cursorData);
  });

  socket.on("text-change", (hash, delta) => {
    socket.to(hash).emit("text-change", delta);
  });

  // Save content to MongoDB on 'save-document' event (triggered by Ctrl+S)
  socket.on("save-document", async (hash, content) => {
    try {
      await Document.findOneAndUpdate({ hash }, { content }, { new: true });
      console.log(`Document ${hash} saved.`);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  });


 socket.on("chat-message", async ({ hash, user, message }) => {
  const chatMessage = { user, message };

  try {
    const document = await Document.findOne({ hash });
    if (document) {
      document.chat.push(chatMessage);
      await document.save();
    }
  } catch (error) {
    console.error("Error saving message:", error);
  }

  io.to(hash).emit("new-message", chatMessage);
});




  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 8000, host: "0.0.0.0" });
    console.log("Server listening on http://localhost:8000");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
