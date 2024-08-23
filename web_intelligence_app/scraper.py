import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
import sys
import openai
from dotenv import load_dotenv
import json
from datetime import datetime, timezone

def scrape(url):
    response = requests.get(url)
    html_content = response.content

    # Step 2: Parse the HTML and extract the main content
    soup = BeautifulSoup(html_content, 'html.parser')
    main_content = soup.find('main') or soup.find('article') or soup.find('body')

    # Step 3: Remove unwanted elements like ads
    if main_content:
        for ad in main_content.find_all(['aside', 'footer', 'nav', 'script']):
            ad.decompose()

        # Remove specific ad classes if necessary
        ad_classes = ['ad', 'advertisement', 'banner']
        for ad_class in ad_classes:
            for ad in main_content.find_all('div', class_=ad_class):
                ad.decompose()

        # Step 4: Convert to Markdown
        markdown_content = md(str(main_content), heading_style="ATX")
    else:
        markdown_content = None

    return markdown_content

def generate_meta_data(url):
    load_dotenv()

    markdown = scrape(url)
    if not markdown:
        return {}
    else:
        prompt = f"""
        Given the following website content in markdown format and website url:

        {url}
        {markdown}

        1. Website or company name
        2. A valid website logo image url or favicon url
        3. Please provide a summary of the website.
        4. Highlight the key topics that the website covers. if the website is a news website, then list the specific topics mentioned in the news article.
        if the website is a company website, then list the key features of the company's product. if the website doesnt fit either of these, then provide a list of
        available information that a user can find on the website
        5. Compile a list of associated links from the website

        Please respond **strictly in valid JSON format**, without additional explanations. 
        Ensure the JSON structure is properly formatted as follows:
        {{
            "website_name": "string",
            "img_url": "string",
            "summary": "string",
            "key_features": ["feature1", "feature2", ...],
            "associated_links": ["link1", "link2", ...]
        }}
        """
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.5
        )

        # Get the response content
        response_text = response.choices[0].message.content.strip()

        # Strip any code block markers if present
        if response_text.startswith("```") and response_text.endswith("```"):
            response_text = response_text[7:-3].strip()

        return response_text, markdown

if __name__ == '__main__':
    url = sys.argv[1]
    meta_data, markdown = generate_meta_data(url)
    created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    try:
        json_data = json.loads(meta_data)  # Ensure the content is valid JSON
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON returned from OpenAI"}))

    output = {
        "url": url,
        "markdown": markdown,
        "metaData": json_data,
        "createdAt": created_at
    }

    # Print the final JSON object for Node.js to capture
    print(json.dumps(output))
