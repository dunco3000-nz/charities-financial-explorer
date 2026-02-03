"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CharityDetails } from "@/components/charity-details"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDate } from "@/utils/format-date"

type Charity = {
  CharityRegistrationNumber: string
  CharityName: string
  CharityStatus: string
  RegistrationDate: string
  OrganisationId?: number
}

export function CharityResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const searchType = searchParams.get("type") as "name" | "number"
  const searchQuery = searchParams.get("query")

  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null)

  useEffect(() => {
    async function fetchCharities() {
      if (!searchQuery) return

      setLoading(true)
      setError(null)
      setSelectedCharity(null)

      try {
        const response = await fetch(
          `/api/search-charities?type=${searchType}&query=${encodeURIComponent(searchQuery)}`,
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Error: ${response.status} - ${errorData.error || "Unknown error"}`)
        }

        const data = await response.json()

        console.log("Received data:", data)

        if (!Array.isArray(data) || data.length === 0) {
          setError("No charities found matching your search criteria.")
        } else {
          setCharities(data)

          // If there's only one result, automatically select it
          if (data.length === 1) {
            setSelectedCharity(data[0])
          }
        }
      } catch (err) {
        console.error("Error fetching charities:", err)
        setError("Failed to fetch charities. Please try again later.")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch charities. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCharities()
  }, [searchQuery, searchType, toast])

  if (!searchQuery) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Enter a search term to find charities.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Searching for charities...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (selectedCharity) {
    return <CharityDetails charity={selectedCharity} onBack={() => setSelectedCharity(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Search Results</h2>
        <p className="text-muted-foreground">Found {charities.length} charities matching your search.</p>
      </div>

      <div className="space-y-4">
        {charities.map((charity) => (
          <Card
            key={charity.CharityRegistrationNumber}
            className="hover:border-primary cursor-pointer transition-colors"
            onClick={() => setSelectedCharity(charity)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">{charity.CharityName}</CardTitle>
              <CardDescription>
                {charity.CharityRegistrationNumber} • {charity.CharityStatus}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Registered: {formatDate(charity.RegistrationDate)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
