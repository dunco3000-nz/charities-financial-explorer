"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { track } from "@vercel/analytics"

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [searchType, setSearchType] = useState<"name" | "number">(
    (searchParams.get("type") as "name" | "number") || "name",
  )
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term",
        variant: "destructive",
      })
      return
    }

    // Validate charity number format if that's the search type
    if (searchType === "number" && !/^CC\d{4,6}$/i.test(searchQuery.trim())) {
      toast({
        title: "Invalid charity number",
        description: "Charity number must be in the format CC followed by 4-6 digits",
        variant: "destructive",
      })
      return
    }

    // Track the search event
    track("charity_search", {
      searchType,
      query: searchQuery.trim(),
    })

    setIsLoading(true)

    // Update URL with search parameters
    const params = new URLSearchParams()
    params.set("type", searchType)
    params.set("query", searchQuery.trim())

    router.push(`/?${params.toString()}`)

    // The loading state will be reset when the results component fetches data
    setTimeout(() => setIsLoading(false), 500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mb-8">
      <div className="space-y-4">
        <RadioGroup
          defaultValue={searchType}
          onValueChange={(value) => setSearchType(value as "name" | "number")}
          className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="name" id="name" className="text-primary border-primary" />
            <Label htmlFor="name">Search by Charity Name</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="number" id="number" className="text-primary border-primary" />
            <Label htmlFor="number">Search by Charity Number (CC12345)</Label>
          </div>
        </RadioGroup>

        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder={searchType === "name" ? "Enter charity name..." : "Enter charity number (CC12345)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-primary/30 focus-visible:ring-primary"
          />
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Searching...
              </span>
            ) : (
              <span className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Search
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

