import express from "express";
import { userRouter } from "./routes/user";
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is up and running properly!");
});

app.use("/api/v1/user", userRouter);

app.listen(8000, () => {
  console.log("Server is running on port 3000");
});