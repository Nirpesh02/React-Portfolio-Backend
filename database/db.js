const mongoose = require("mongoose");

async function connectDB() {
	const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

	if (!mongoUri) {
		throw new Error("MONGO_URI is missing in environment variables");
	}

	if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
		process.env.MONGO_URI = process.env.MONGODB_URI;
	}

	await mongoose.connect(mongoUri);
	console.log("MongoDB connected");
}

module.exports = connectDB;
