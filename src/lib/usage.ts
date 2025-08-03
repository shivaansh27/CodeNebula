import {RateLimiterPrisma} from "rate-limiter-flexible"
import prisma from "./db";
import { auth } from "@clerk/nextjs/server";
import { err } from "inngest/types";

const FREE_POINTS = 10; 
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;
export async function getUsageTracker() {
    const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: FREE_POINTS,
    duration: DURATION
})
return usageTracker;
}

export async function consumeCredits() {
    const {userId} = await auth(); 
    if(!userId){
        throw new Error("User Not Authenticate");
    }
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.consume(userId, GENERATION_COST)
    return result;
}
export async function getUsageStatus() {
    const {userId} = await auth();
     if(!userId){
        throw new Error("User Not Authenticate");
    }

    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    return result;
}