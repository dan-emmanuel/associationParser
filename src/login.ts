import axios from "axios";
import UserSingleton from "./user";
import { LoginDto } from "./log.type";
import  { Request, Response } from "express";

export const loginFnct = async (req: Request<{}, {}, LoginDto>, res: Response): Promise<void> => {
  try {
    const lecompteAssoUrlLogin ="https://lecompteasso.associations.gouv.fr/gw/auth-server/login";
    const loginResponse = await axios.post(lecompteAssoUrlLogin, req.body, {
      headers: { "Content-Type": "application/json" },
    });

    if (loginResponse.status === 200) {
      const userData = loginResponse.data;
      UserSingleton.getInstance(userData);        
      res.json(userData);
    } else {
      res
        .status(loginResponse.status)
        .json({ message: "API request failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}