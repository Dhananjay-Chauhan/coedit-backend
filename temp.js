import Fastify from "fastify";
import fastifyCORS from "@fastify/cors";
import { Server } from "socket.io";

const app = Fastify();

// Enable CORS for Fastify
app.register(fastifyCORS, {
  origin: "*", // Adjust this to your frontend URL
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
});

// Create HTTP server from Fastify
const server = app.server;

// Create socket.io instance using the native HTTP server
const io = new Server(app.server, {
  cors: {
    origin: "*  ", // Frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Listen for 'text-change' events from the client
  socket.on("text-change", (delta) => {
    // Broadcast the delta to all other connected clients
    socket.broadcast.emit("text-change", delta);
  });

  // socket.on('disconnect', () => {
  //   console.log('User disconnected');
  // });
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
