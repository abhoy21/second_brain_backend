import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import authMiddleware, { AuthReqProps } from "../middleware";

const JWT_SECRET: string = process.env.JWT_SECRET || "";

const router = express.Router();
const client = new PrismaClient({
  log: ["query"],
});

interface SignupProps {
  email: string;
  username: string;
  password: string;
}

interface SigninProps {
  email: string;
  password: string;
}

interface CreateContentProps extends AuthReqProps  {
  title: string;
  link: string;
  contentType: string

}

router.post("/signup", async (req: Request<{}, {}, SignupProps>, res: Response): Promise<void> => {
  const { email, username, password } = req.body;
  try {
    const hashPassword = await bcrypt.hash(password, 10);

    const response = await client.user.create({
      data: {
        email,
        username,
        password: hashPassword,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      response: response,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/signin", async (req: Request<{}, {}, SigninProps>, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const existingUser = await client.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const validatePassword = await bcrypt.compare(password, existingUser.password);
    if (!validatePassword) {
      res.status(401).json({ message: "Invalid password" });
      return
    }

    try {
      const token = jwt.sign(
        { userId: existingUser.id },
        JWT_SECRET,
        { expiresIn: "3 days" }
      );

      res.status(200).json({
        message: "User signed in successfully",
        response: token,
      });
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      res.status(500).send("Internal Server Error");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/create-content", authMiddleware, async (req: CreateContentProps, res: Response): Promise<void> => {
  const userId = req.userId;
})



export const userRouter = router;