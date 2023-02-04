const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

// allow cors origin
const corsConfig = {
	origin: true,
	credentials: true,
};
app.use(cors(corsConfig));
app.use("*", cors(corsConfig));
app.use(express.json());

app.get("/", (req, res) => {
	res.send("running server");
});

const uri =
	"mongodb+srv://new_user23:aOzjFkLCup00ve9A@cluster0.dhxbr.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

// verify token
function verifyToken(req, res, next) {
	// get token from header
	const auth = req.headers.authorization;
	if (!auth) {
		return res.status(401).send({ message: "unauthorize" });
	}
	const token = auth.split(" ")[1];
	// verify token

	try {
		jwt.verify(token, process.env.TOKEN, (err, decode) => {
			if (err) {
				return res.status(403).send({ error: "forbidden" });
			}
			req.decode = decode;
			next();
		});
	} catch (err) {
		res.status(403).send({ err });
	}
}

async function databaseInterface() {
	try {
		await client.connect();
		const bikeCollection = client.db("inventory").collection("bikes");
		const teamCollection = client.db("inventory").collection("teams");

		// team collection data for the team page
		app.get("/teams", async (req, res) => {
			const cursor = teamCollection.find({});
			const teams = await cursor.toArray();
			res.send(teams);
		});
		// show six bike in inventory section
		app.get("/inventory", async (req, res) => {
			const cursor = bikeCollection.find({}).limit(6);
			const result = await cursor.toArray();
			res.send(result);
		});

		// show inventory in id
		app.get("/inventory/:id", async (req, res) => {
			const id = req.params.id;
			const cursor = bikeCollection.find({ _id: ObjectId(id) });
			const result = await cursor.toArray();
			res.send(result);
		});

		// increase inventory quantity by id
		app.put("/inventory/addQuantity/:id", async (req, res) => {
			const id = req.params.id;
			const userQuantity = req.body.quantity;
			const cursor = bikeCollection.find({ _id: ObjectId(id) });
			const result = await cursor.toArray();
			const quantity = result[0].quantity;
			const newQuantity = parseInt(quantity) + parseInt(userQuantity);
			const update = await bikeCollection.updateOne(
				{ _id: ObjectId(id) },
				{ $set: { quantity: newQuantity } }
			);
			res.send(update);
		});

		// mines inventory quantity by id
		app.put("/inventory/delivery/:id", async (req, res) => {
			const id = req.params.id;
			const cursor = bikeCollection.find({ _id: ObjectId(id) });
			const result = await cursor.toArray();
			const quantity = result[0].quantity;
			const newQuantity = parseInt(quantity) - 1;
			const update = await bikeCollection.updateOne(
				{ _id: ObjectId(id) },
				{ $set: { quantity: newQuantity } }
			);
			res.send(update);
		});

		// show all inventory
		app.get("/allInventory", async (req, res) => {
			const cursor = bikeCollection.find({});
			const result = await cursor.toArray();
			res.send(result);
		});

		// delete inventory by id
		app.delete("/inventory/:id", async (req, res) => {
			const id = req.params.id;
			const result = await bikeCollection.deleteOne({
				_id: ObjectId(id),
			});
			res.send(result);
		});

		// add new bike to user
		app.post("/addItemByUser", async (req, res) => {
			const body = req.body;
			const result = await bikeCollection.insertOne(body);
			res.send(result);
		});

		// show inventory item by user email
		app.get("/userItem/:email", verifyToken, async (req, res) => {
			const tokenEmail = req.decode.email.email;
			const email = req.params.email;

			if (email == tokenEmail) {
				const cursor = bikeCollection.find({ email });
				const result = await cursor.toArray();
				res.send(result);
			}
		});

		// jwt token for user
		app.post("/addToken", async (req, res) => {
			const email = req.body;

			jwt.sign(
				{ email },
				process.env.TOKEN,
				{ expiresIn: "1d" },
				(err, token) => {
					res.send({ token });
				}
			);
		});

		console.log("DB connection successfully");
	} finally {
		// client.close();
	}
}
databaseInterface();
app.listen(port, () => {
	console.log("server is running on port " + port);
});
