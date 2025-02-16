
import mongoose from "mongoose";
import Document from "../models/document.js";

const chat =(app,options,done)=>{
    // Add a chat message
    app.post("/documents/:hash/chat", async (request, reply) => {
        const { hash } = request.params;
        const { user, message } = request.body;
    
        const document = await Document.findOne({ hash });
        if (!document)
        return reply.status(404).send({ message: "Document not found" });
    
        document.chat.push({ user, message });
        await document.save();
        reply.send(document.chat);
    });
    
    // Fetch chat messages for a document
    app.get("/documents/:hash/chat", async (request, reply) => {
        const { hash } = request.params;
        const document = await Document.findOne({ hash });
        if (!document)
        return reply.status(404).send({ message: "Document not found" });
    
        reply.send(document.chat);
    });
    done();
}


export default chat;