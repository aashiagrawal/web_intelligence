/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/yOs3QtsI871
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
'use client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Component() {

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [metaData, setMetaData] = useState(null)
  const [error, setError] = useState(null)
  const [webUrl, setWebUrl] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null) // Reset any previous errors

    try {
      const response = await fetch(`/api/webinfo?url=${encodeURIComponent(url)}`)
      const result = await response.json()
      
      if (response.ok) {
        setMetaData(result.metaData)
        setWebUrl(result.url)

      } else {
        setError(result.error || "Error fetching data")
      }
    } catch (error) {
      setError("Failed to make API call: " + error.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-2xl w-full px-4 sm:px-6 md:px-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">✨ Website Intelligence</h1>
            <p className="mt-2 text-muted-foreground">Enter a website URL to see a summary of its key features.</p>
          </div>
          <form className="flex items-center gap-4" onSubmit={handleSubmit}>
            <Input 
              type="text" 
              placeholder="Enter website URL" 
              className="flex-1" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : "Submit"}
            </Button>
          </form>
          
          {/* Error handling */}
          {error && <div className="text-red-500 mt-4">{error}</div>}

          {/* Displaying Metadata */}
          {metaData && (
            <div className="rounded-lg shadow-lg overflow-y-auto" style={{ maxHeight: "500px"}}>
              <div className="px-6 py-8 sm:px-10 sm:py-10">
                <div className="flex items-center gap-4">
                  <div className="object-cover flex-shrink-0">
                    <img
                      src={metaData.img_url}
                      width="60"
                      height="60"
                      alt="Website Logo"
                      className="rounded-full"
                      style={{ aspectRatio: "60/60", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{metaData.website_name}</h2>
                    <p className="text-muted-foreground">{webUrl}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-foreground">About the Website</h3>
                  <p className="mt-2 text-muted-foreground">{metaData.summary}</p>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-foreground">Key Topics</h3>
                  <ul className="mt-2 space-y-2 text-muted-foreground">
                    {metaData.key_features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className="w-5 h-5 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
