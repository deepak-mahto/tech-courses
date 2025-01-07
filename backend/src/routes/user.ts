import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { JWT_USER_PASSWORD } from "../config";
import userMiddleware from "../middleware/user";
import { courseModel, purchaseModel, userModel } from "../database/db";
import { signupBodySchema } from "../types/signup";
import { signinBodySchema } from "../types/signin";
const userRouter: any = Router();

type signupBodyType = z.infer<typeof signupBodySchema>;

userRouter.post("/signup", async (req: Request, res: Response) => {
  const { success, data, error } = signupBodySchema.safeParse(req.body);

  if (!success) {
    res.json({
      message: "Incorrect format",
      error: error,
    });
    return;
  }

  const signupBody: signupBodyType = data;

  let errorThrown = false;
  try {
    const hashedPassword = await bcrypt.hash(signupBody.password, 5);

    await userModel.create({
      email: signupBody.email,
      password: hashedPassword,
      firstName: signupBody.firstName,
      lastName: signupBody.lastName,
    });
  } catch (error) {
    res.json({
      message: "User already exist",
    });
    errorThrown = true;
  }

  if (!errorThrown) {
    res.json({
      message: "Sign up succeeded",
    });
  }
});

type signinBodyType = z.infer<typeof signinBodySchema>;

userRouter.post("/signin", async (req: Request, res: Response) => {
  const { success, error, data } = signinBodySchema.safeParse(req.body);

  if (!success) {
    return res.status(411).json({
      message: "Error in inputs",
      error: error,
    });
  }

  const signinBody: signinBodyType = data;

  const user = await userModel.findOne({
    email: signinBody.email,
  });

  if (!user) {
    return res.status(404).json({
      message: "User does not exist",
    });
  }

  const passwordMatch = await bcrypt.compare(
    signinBody.password,
    user.password as string
  );

  if (passwordMatch) {
    const token = jwt.sign(
      {
        id: user._id,
      },
      JWT_USER_PASSWORD as string
    );

    res.json({
      token: token,
    });
  } else {
    res.json({
      message: "Incorrect credentials",
    });
  }
});

userRouter.get(
  "/purchases",
  userMiddleware,
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const purchases = await purchaseModel.find({
      userId,
    });

    const courseData = await courseModel.find({
      _id: { $in: purchases.map((x) => x.courseId) },
    });

    res.json({
      purchases,
      courseData,
    });
  }
);

export default userRouter;