import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const prisma = new PrismaClient();

// Convert exec to return a promise
const execPromise = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const webUrl = searchParams.get("url");

  if (!webUrl) {
    return NextResponse.json({ error: "A valid URL must be provided" }, { status: 400 });
  }

  try {
    // Check if the URL is already in the database
    let record = await prisma.websiteInfo.findFirst({
      where: { url: webUrl },
    });

    if (record) {
      // If the record exists, return it
      return NextResponse.json(record);
    } else {
      // Run the Python scraper as a promise
      try {
        const { stdout, stderr } = await execPromise(`python3 scraper.py ${webUrl}`);
        
        if (stderr) {
          console.error(`Script stderr: ${stderr}`);
          return NextResponse.json({ error: "Error executing Python script" }, { status: 500 });
        }

        const scrapedData = JSON.parse(stdout);

        // Create a new record in the database with the scraped data
        record = await prisma.websiteInfo.create({
          data: {
            url: scrapedData.url,
            markdown: scrapedData.markdown,
            metaData: scrapedData.metaData,
            createdAt: scrapedData.createdAt
          },
        });

        // Return the newly created record
        return NextResponse.json(record);

      } catch (execError: any) {
        console.error(`Error executing Python script: ${execError.message}`);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error("Error handling request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
