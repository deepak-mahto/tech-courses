import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "courses",
  });
});

app.listen(3000);