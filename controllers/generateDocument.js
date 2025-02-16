import mongoose from "mongoose";
import Document from "../models/document.js";

const document = (app, options, done) => {
  // API to create a new document if it doesn’t exist
  app.post("/documents", async (request, reply) => {
    const { hash } = request.body;

    // Check if document already exists
    let document = await Document.findOne({ hash });
    if (!document) {
      // Create a new document if it does not exist
      document = new Document({ hash, content: {} }); // Default empty content
      await document.save();
      console.log(`Document with hash ${hash} created.`);
    } else {
      console.log(`Document with hash ${hash} already exists.`);
    }

    reply.send({ hash });
  });

  // API to fetch document by hash
  app.get("/documents/:hash", async (request, reply) => {
    const { hash } = request.params;
    const document = await Document.findOne({ hash });
    if (!document) {
      return reply.status(404).send({ message: "Document not found" });
    }
    reply.send(document);
  });
  done();
};

export default document;
