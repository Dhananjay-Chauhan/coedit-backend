import User from "../../models/user.js";
import bcrypt from "bcrypt";

const auth = (app, options, done) => {
  // Middleware to verify JWT
  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });

  // User registration
  app.post("/register", async (request, reply) => {
    const { username, email, password } = request.body;

    if (!username || !email || !password) {
      return reply.code(400).send({ message: "All fields are required." });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return reply.code(400).send({ message: "Email is already registered." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save new user
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      reply.code(201).send({ message: "User registered successfully." });
    } catch (error) {
      app.log.error(error);
      reply.code(500).send({ message: "Server error. Please try again later." });
    }
  });

  // User login
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ message: "Email and password are required." });
    }

    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return reply.code(401).send({ message: "Invalid email or password." });
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send({ message: "Invalid email or password." });
      }

      // Generate token
      const token = app.jwt.sign({ id: user._id, email: user.email }, { expiresIn: "1h" });

      reply.send({ token });
    } catch (error) {
      app.log.error(error);
      reply.code(500).send({ message: "Server error. Please try again later." });
    }
  });

  // Protected route example
  app.get("/profile", { preValidation: [app.authenticate] }, async (request, reply) => {
    reply.send({ message: "You are viewing a protected route.", user: request.user });
  });

  done();
};

export default auth;
