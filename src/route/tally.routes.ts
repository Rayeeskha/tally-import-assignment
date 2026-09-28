import Router from "express";
import { TallyController } from "../controller/tally.controller";
import {
  requireTallyFile,
  tallyRequestTimeout,
  tallyUpload,
} from "../middleware/tally-upload.middleware";

class TallyRoutes {
  router = Router();
  private readonly tallyController: TallyController;
  constructor() {
    this.tallyController = new TallyController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/imports",
      tallyRequestTimeout,
      tallyUpload.single("file"),
      requireTallyFile,
      this.tallyController.import,
    );

    this.router.get("/imports/:importId", this.tallyController.details);

    this.router.get("/imports/:importId/vouchers", this.tallyController.vouchers);
  }
}

export default new TallyRoutes().router;
