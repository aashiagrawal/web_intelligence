const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const { format } = require('date-fns');
const TurndownService = require('turndown').default; // New library for HTML to Markdown conversion
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Turndown service
const turndownService = new TurndownService();

// Convert HTML content to Markdown
function convertToMarkdown(mainContent) {
  try {
    // Use turndown to convert HTML to Markdown
    const markdownContent = turndownService.turndown(mainContent);
    return markdownContent;
  } catch (error) {
    console.error('Error converting to Markdown:', error);
    return null;
  }
}

// Scrape the website and return the content in markdown format
async function scrape(url) {
  try {
    const { data: htmlContent } = await axios.get(url);

    // Parse the HTML and extract the main content
    const $ = cheerio.load(htmlContent);
    let mainContent = $('main').html() || $('article').html() || $('body').html();

    if (mainContent) {
      // Remove unwanted elements like ads
      const unwantedTags = ['aside', 'footer', 'nav', 'script', 'img'];
      unwantedTags.forEach(tag => $(tag).remove());

      const adClasses = ['ad', 'advertisement', 'banner'];
      adClasses.forEach(adClass => {
        $(`.${adClass}`).remove();
      });

      // Convert the main content to Markdown
      const markdownContent = convertToMarkdown(mainContent);
      return markdownContent;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error scraping the website:', error);
    return null;
  }
}
// Generate metadata using the OpenAI API
async function generateMetaData(url) {
  const markdown = await scrape(url);
  if (!markdown) {
    return {};
  }

  // Configure the OpenAI client
//   const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
//   });
  // console.log("this is markdown: ", markdown)
  const openai = new OpenAI();

  const prompt = `
  Given the following website content in markdown format and website url:

  ${url}
  ${markdown}

  1. Website or company name
  2. A valid website logo image url or favicon url
  3. Please provide a summary of the website.
  4. Highlight the key topics that the website covers. if the website is a news website, then list the specific topics mentioned in the news article.
  if the website is a company website, then list the key features of the company's product. if the website doesnt fit either of these, then provide a list of
  available information that a user can find on the website
  5. Compile a list of associated links from the website

  Please respond **strictly in valid JSON format**, without additional explanations. 
  Ensure the JSON structure is properly formatted as follows:
  {
      "website_name": "string",
      "img_url": "string",
      "summary": "string",
      "key_features": ["feature1", "feature2", ...],
      "associated_links": ["link1", "link2", ...]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt}
     ],
      max_tokens: 800,
      temperature: 0.5,
    });

    let responseText = response.choices[0].message.content.trim()
    if (responseText.startsWith("```") && responseText.endsWith("```")) {
        responseText = responseText.slice(7, -3).trim();
    }    
    const metaData = JSON.parse(responseText);
    return [metaData, markdown];

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
}

// Main Next.js API handler
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'A valid URL must be provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await generateMetaData(url);
    const metaData = res[0]
    const markdown = res[1]
    const createdAt = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");

    if (metaData) {
      return new Response(
        JSON.stringify({
          url,
          markdown: markdown || 'N/A',
          metaData,
          createdAt,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to generate metadata' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An error occurred during the request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// // Main execution
// (async () => {
//   const url = process.argv[2];

//   if (!url) {
//     console.error('Please provide a URL as the first argument.');
//     process.exit(1);
//   }

//   const metaData = await generateMetaData(url);
//   const createdAt = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");

//   const output = {
//     url: url,
//     markdown: metaData.markdown || 'N/A',
//     metaData: metaData,
//     createdAt: createdAt,
//   };

//   // Print the final JSON object for Node.js to capture
//   console.log(JSON.stringify(output, null, 2));
// })();
