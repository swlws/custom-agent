import { generatePlan } from "./planner";
import { solveStep } from "./solver";
import type { ModeRunner } from "@/be/engine/runners";

export const planAndSolveRunner: ModeRunner = {
  async execute(content, contextMessages, { onToken, onEvent }, signal) {
    onEvent({ type: "plan_start" });
    const steps = await generatePlan(content, contextMessages, onToken, signal);

    let reply = "";
    const previousResults: string[] = [];

    for (const step of steps) {
      if (signal?.aborted) break;

      onEvent({ type: "step_start", index: step.index, title: step.title });

      const stepOutput = await solveStep(
        step,
        steps,
        content,
        contextMessages,
        previousResults,
        onToken,
        onEvent,
        signal,
      );

      previousResults.push(stepOutput);
      reply += stepOutput;

      onEvent({ type: "step_done", index: step.index });
    }

    return reply;
  },
};
