import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants";
import { TallyResource } from "../resources/tally.resource";
import { TallyService } from "../service/tally.service";
import { asyncHandler } from "../utils/async-handler";
import { resourceResponse } from "../utils/response";

export class TallyController {
  import = asyncHandler(async (request: Request, response: Response) => {
    const result = await TallyService.importFile(request.file!.path);
    return resourceResponse(
      response,
      result.duplicate ? HTTP_STATUS.OK : HTTP_STATUS.CREATED,
      TallyResource.transformImportResult(result.record, result.duplicate),
    );
  });

  details = asyncHandler(async (request: Request, response: Response) => {
    console.log(request.params.importId, "request.params.importId");
    const record = await TallyService.getImport(String(request.params.importId));
    return resourceResponse(response, HTTP_STATUS.OK, TallyResource.transformImport(record));
  });

  vouchers = asyncHandler(async (request: Request, response: Response) => {
    const items = await TallyService.getVouchers(String(request.params.importId));
    return resourceResponse(response, HTTP_STATUS.OK, TallyResource.transformVouchers(items));
  });
}
