import { generatePlan } from "./planner";
import { solveStep } from "./solver";
import type { ModeRunner } from "@/be/engine/runners/type";

export const planAndSolveRunner: ModeRunner = {
  async execute(content, contextMessages, { onToken }, signal) {
    const steps = await generatePlan(content, contextMessages, onToken, signal);

    let reply = "";
    const previousResults: string[] = [];

    for (const step of steps) {
      if (signal?.aborted) break;

      const stepOutput = await solveStep(
        step,
        steps,
        content,
        contextMessages,
        previousResults,
        onToken,
        signal,
      );

      previousResults.push(stepOutput);
      reply += stepOutput;
    }

    return reply;
  },
};
