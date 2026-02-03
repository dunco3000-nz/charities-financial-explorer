import { type NextRequest, NextResponse } from "next/server"

// Mock data for development/testing when the API is unavailable
const MOCK_CHARITIES = [
  {
    CharityRegistrationNumber: "CC12345",
    CharityName: "Sample Charity One",
    CharityStatus: "Registered",
    RegistrationDate: "2015-06-15T00:00:00.000Z",
    OrganisationId: 12345,
  },
  {
    CharityRegistrationNumber: "CC23456",
    CharityName: "Sample Charity Two",
    CharityStatus: "Registered",
    RegistrationDate: "2017-03-22T00:00:00.000Z",
    OrganisationId: 23456,
  },
  {
    CharityRegistrationNumber: "CC34567",
    CharityName: "Sample Charity Three",
    CharityStatus: "Registered",
    RegistrationDate: "2019-11-08T00:00:00.000Z",
    OrganisationId: 34567,
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")
  const query = searchParams.get("query")
  const useMock = process.env.USE_MOCK_DATA === "true"

  if (!query || !type) {
    return NextResponse.json({ error: "Missing search parameters" }, { status: 400 })
  }

  // If mock mode is enabled, return mock data
  if (useMock) {
    console.log("Using mock data for charity search")

    // Filter mock data based on search criteria
    let results = [...MOCK_CHARITIES]

    if (type === "name") {
      results = results.filter((charity) => charity.CharityName.toLowerCase().includes(query.toLowerCase()))
    } else if (type === "number") {
      results = results.filter((charity) => charity.CharityRegistrationNumber.toLowerCase() === query.toLowerCase())
    }

    return NextResponse.json(results)
  }

  try {
    // Use the correct OData API endpoint
    const baseUrl = "http://www.odata.charities.govt.nz"

    let apiUrl
    if (type === "name") {
      // Search by name using OData filter
      // Instead of 'contains', use 'substringof' which is supported in older OData versions
      // The syntax is: substringof('searchString', PropertyName) eq true
      apiUrl = `${baseUrl}/Organisations?$filter=substringof('${encodeURIComponent(query)}', Name) eq true&$select=OrganisationId,Name,CharityRegistrationNumber,DateRegistered,RegistrationStatus&$top=20`
    } else if (type === "number") {
      // Search by registration number
      // Remove any spaces and ensure uppercase
      const formattedNumber = query.toUpperCase().replace(/\s+/g, "")

      // Try to find by registration number
      apiUrl = `${baseUrl}/Organisations?$filter=CharityRegistrationNumber eq '${encodeURIComponent(formattedNumber)}'&$select=OrganisationId,Name,CharityRegistrationNumber,DateRegistered,RegistrationStatus`
    } else {
      return NextResponse.json({ error: "Invalid search type" }, { status: 400 })
    }

    console.log("Fetching from URL:", apiUrl)

    // Set a timeout for the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Charity-Search-App/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`API returned status: ${response.status}`)
      const errorText = await response.text()
      console.error(`Error response: ${errorText}`)
      throw new Error(`Charities API error: ${response.status}`)
    }

    const data = await response.json()

    // OData v2 wraps results in a 'd' property
    const charities = data.d || []

    console.log("API returned charities:", charities.length)

    // Format the response to match our expected structure
    const formattedData = charities.map((charity: any) => ({
      CharityRegistrationNumber: charity.CharityRegistrationNumber,
      CharityName: charity.Name,
      CharityStatus: charity.RegistrationStatus,
      RegistrationDate: charity.DateRegistered,
      OrganisationId: charity.OrganisationId,
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error searching charities:", error)

    // Try alternative approach - fallback to mock data
    console.log("Falling back to mock data due to API error")

    // Filter mock data based on search criteria
    let results = [...MOCK_CHARITIES]

    if (type === "name") {
      results = results.filter((charity) => charity.CharityName.toLowerCase().includes(query.toLowerCase()))
    } else if (type === "number") {
      results = results.filter((charity) => charity.CharityRegistrationNumber.toLowerCase() === query.toLowerCase())
    }

    return NextResponse.json(results)
  }
}

