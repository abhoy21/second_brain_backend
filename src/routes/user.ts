import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import authMiddleware, { AuthReqProps } from "../middleware";
import generateShareableLink from "../utils/generateShareableLink";
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;


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

interface TagProps {
  name: string;
}
interface CreateContentProps extends AuthReqProps  {
  title?: string;
  content?: string;
  type?: ContentType
  tags?: TagProps[]
  isPublic?:  Boolean
}
enum ContentType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  LINK = "link"
}

interface DeleteProps extends AuthReqProps {
  body: {
    id: number;
  }
}

interface ShareBrainProps extends AuthReqProps {
  body: {
    share: boolean;
  }
}

interface GetBrainProps extends Request {
  params: {
    shareLink: string;
  }
}

interface UpdateContentStatusProps extends AuthReqProps {
  body: {
    id:number,
    isPublic: boolean
  }
}

interface TagProps {
  id: number;
  name: string;
  contentId: number;
}



router.post("/signup", async (req: Request<{}, {}, SignupProps>, res: Response): Promise<void> => {
  const { email, username, password } = req.body;
  try {
    const existUser = await client.user.findUnique({
      where: {
        email,
        username,
      },
    });
    if (existUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
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
        
      );

      res.status(200).json({
        message: "User signed in successfully",
        response: {
          token: token,
          user: existingUser.username
        },
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

  try {
    if(!userId) {
      res.status(401).json({ message: "Unauthorized! Cannot create content!" });
      return;
    }
    const { title, content, type, tags, isPublic } = req.body;

    if(!title || !content || !type) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const response = await client.content.create({
      data: {
        title,
        content,
      type,
      tags: {
        create: tags.map((tag: string) => ({name: tag}))
      },
      user: {
        connect: { id: userId },
      },
      isPublic: isPublic || true
      
      }
    })

    res.status(201).json({
      message: "Content created successfully",
      response: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
})

router.get("/get-contents", authMiddleware, async (req: AuthReqProps, res: Response): Promise<void> => {
  const userId = req.userId;
  try {
    if (!userId) {
      res.status(401).json({ message: "Unauthorized! Cannot get content!" });
      return;
    }

    const response = await client.content.findMany({
      where: {
        userId: userId,
      }
    });

    const tags: TagProps[] = await client.tag.findMany({
      where: {
        contentId: {
          in: response.map((content) => content.id)
        }
      }
    });

    const tagsList = tags.reduce<Record<number, string[]>>((acc, tag) => {
      if (!acc[tag.contentId]) {
        acc[tag.contentId] = [];
      }
      acc[tag.contentId].push(tag.name); 
      return acc; 
    }, {} as Record<number, string[]>);

    const responseWithTags = response.map((content) => {
      return {
        ...content,
        tags: tagsList[content.id] || [] 
      };
    });

    res.status(200).json({
      message: "Content retrieved successfully",
      response: responseWithTags,
    });
    
  } catch (error) {
    console.error("Error retrieving contents:", error);
    res.status(500).send("Internal Server Error");
  }
});


router.delete("/delete-content", authMiddleware, async (req: DeleteProps, res: Response): Promise<void> => {
  const userId = req.userId;
  try {
    if(!userId) {
      res.status(401).json({ message: "Unauthorized! Cannot delete content!" });
      return;
    }
    const id = req.body.id;
    await client.tag.deleteMany({
      where: {
        contentId: id,
      }
    })
    const response = await client.content.delete({
      where: {
        id: id,
        userId: userId,
      }
    })

    res.status(200).json({
      message: "Content deleted successfully",
      response: response,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
})

router.post("/update-content-status", authMiddleware, async (req: UpdateContentStatusProps, res: Response): Promise<void> => {
  const userId = req.userId;
  try {
    if(!userId){
      res.status(401).json({ message: "Unauthorized! Cannot update content status!" });
      return;
    }

    const {id, isPublic} = req.body;
    const rresponse = await client.content.update({
      where: {
        id: id,
      }, 
      data: {
        isPublic: isPublic
      }
    })

    res.status(200).json({
      message: "Content status updated successfully",
      response: rresponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
})

router.post("/share-brain", authMiddleware, async (req: ShareBrainProps, res: Response) => {
  const userId = req.userId;
  try {
    if(!userId) {
      res.status(401).json({ message: "Unauthorized! Cannot share brain!" });
      return;
    }

    const {share} = req.body;
    console.log("share", share)
    if(share) {
      
      const check = await client.link.findUnique({
        where: {
          userId: userId,
        }
      })
    
      if(!check) {
        const shareableString = generateShareableLink(userId, 10);
        const response = await client.link.create({
          data: {
            hash: shareableString,
            user: {
              connect: { id: userId },
            },
          }
        })
        res.status(201).json({
          message: "Brain shared successfully",
          response: response,
        });
      } else {
        res.status(400).json({ message: "Brain already shared", response: check.hash });
      }
    } else {
      const check = await client.link.findUnique({
        where: {
          userId: userId,
        }
      })
      if(!check) {
        res.status(400).json({ message: "Brain is not present", response: check });
        return;
      }
      await client.link.delete({
        where: {
          userId: userId,
        }
      })

      res.status(200).json({
        message: "Brain unshared successfully",
        response: null,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
})

router.get("/brain/:shareLink", async (req: GetBrainProps, res: Response) => {
  const hash = req.params.shareLink;
  try {
    if(!hash) {
      res.status(400).json({ message: "Invalid share link" });
      return;
    }
    const link = await client.link.findUnique({
      where: {
        hash: hash,
      }
    });

    if(!link) {
      res.status(404).json({ message: "Brain not found" });
      return;
    }
    const user = await client.user.findUnique({
      where: {
        id: link.userId,
      }
    })

    const response = await client.content.findMany({
      where: {
        userId: link.userId,
        isPublic: true
      }
    })

    res.status(200).json({
      message: "Brain retrieved successfully",
      response: {
        username: user?.username,
        content: response,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
})

router.get("/content-counts", authMiddleware, async (req: AuthReqProps, res: Response): Promise<void> => {
  const userId = req.userId;
  try {
    if(!userId){
      res.status(401).send("Unauthorized Access!");
      return;
    }
    const totalCount = await client.content.count({
      where: {
        userId: userId
      }
    })

    const publicCount = await client.content.count({
      where: {
        userId: userId,
        isPublic: true
      }
    })

    const privateCount = await client.content.count({
      where: {
        userId: userId,
        isPublic: false
      }
    })

    res.status(200).json({
      message: "Stats retrieved successfully",
      stats: {
        total: totalCount,
        public: publicCount,
        private: privateCount
      }
    });
  } catch(err){
    res.status(500).send("Internal Server Error!");
  }
})



export const userRouter = router;