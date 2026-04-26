import { textRunner } from "./text/index";
import { planAndSolveRunner } from "./plan-and-solve";
import { reactRunner } from "./re-act";
import { imageGenRunner } from "./image-gen/index";
import { ModeRunner } from "./type";
import { reflectionRunner } from "./reflection";

export const modeRunners = new Map<string, ModeRunner>([
  ["text", textRunner],
  ["image-gen", imageGenRunner],
  ["plan-and-solve", planAndSolveRunner],
  ["react", reactRunner],
  ["reflection", reflectionRunner],
]);
