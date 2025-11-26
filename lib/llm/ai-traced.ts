import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";


const { generateText } = wrapAISDK(ai);
export { generateText };
