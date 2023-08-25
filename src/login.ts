import axios, { AxiosResponse } from "axios";
import UserSingleton from "./user";
import { LoginDto } from "./log.type";
import { Request, Response } from "express";
import { Logger } from "./logger";

const logger = new Logger("login");

export const loginFnct = async (req: Request<{}, {}, LoginDto> | LoginDto, res?: Response): Promise<boolean> => {
  try {
    const lecompteAssoUrlLogin = "https://lecompteasso.associations.gouv.fr/gw/auth-server/login";
    const dataToSend = ((req as Request<{}, {}, LoginDto>)?.body) || req;
    console.log({ dataToSend });

    const loginResponse: AxiosResponse = await axios.post(lecompteAssoUrlLogin, dataToSend, {
      headers: { "Content-Type": "application/json" },
    });

    return returnHandler(loginResponse, req, res);
  } catch (error) {
    console.error(error);
    if (res) {
      res.status(500).json({ message: "Internal server error" });
    }
    return false;
  }
}

const returnHandler = (loginResponse: AxiosResponse, req?: Request | LoginDto, res?: Response): boolean => {
  if (loginResponse.status === 200) {
    const userData = loginResponse.data;
    UserSingleton.getInstance(userData);

    if (res) {
      res.json(userData);
    }
    return true;
  } else {
    if (res) {
      res.status(loginResponse.status).json({ message: "API request failed" });
    }
    return false;
  }
}
