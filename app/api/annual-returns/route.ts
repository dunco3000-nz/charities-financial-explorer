import { type NextRequest, NextResponse } from "next/server"

// Mock data for development/testing when the API is unavailable
const MOCK_ANNUAL_RETURNS = {
  CC12345: [
    {
      AnnualReturnId: "ar1",
      FinancialYear: "2022-2023",
      FinancialYearEnd: "2023-03-31T00:00:00.000Z",
      TotalGrossIncome: 125000,
      TotalGrossExpenditure: 115000,
      TotalAssets: 350000,
      TotalLiabilities: 75000,
      WorkingCapital: 50000,
      SurplusForYear: 10000,
      ReportingTier: 3,
      CertifiedBy: "Jane Smith",
    },
    {
      AnnualReturnId: "ar2",
      FinancialYear: "2021-2022",
      FinancialYearEnd: "2022-03-31T00:00:00.000Z",
      TotalGrossIncome: 110000,
      TotalGrossExpenditure: 105000,
      TotalAssets: 320000,
      TotalLiabilities: 80000,
      WorkingCapital: 45000,
      SurplusForYear: 5000,
      ReportingTier: 3,
      CertifiedBy: "Jane Smith",
    },
    {
      AnnualReturnId: "ar3",
      FinancialYear: "2020-2021",
      FinancialYearEnd: "2021-03-31T00:00:00.000Z",
      TotalGrossIncome: 95000,
      TotalGrossExpenditure: 90000,
      TotalAssets: 300000,
      TotalLiabilities: 85000,
      WorkingCapital: 40000,
      SurplusForYear: 5000,
      ReportingTier: 3,
      CertifiedBy: "John Doe",
    },
  ],
  CC23456: [
    {
      AnnualReturnId: "ar4",
      FinancialYear: "2022-2023",
      FinancialYearEnd: "2023-03-31T00:00:00.000Z",
      TotalGrossIncome: 250000,
      TotalGrossExpenditure: 230000,
      TotalAssets: 500000,
      TotalLiabilities: 150000,
      WorkingCapital: 100000,
      SurplusForYear: 20000,
      ReportingTier: 2,
      CertifiedBy: "Robert Johnson",
    },
    {
      AnnualReturnId: "ar5",
      FinancialYear: "2021-2022",
      FinancialYearEnd: "2022-03-31T00:00:00.000Z",
      TotalGrossIncome: 220000,
      TotalGrossExpenditure: 210000,
      TotalAssets: 450000,
      TotalLiabilities: 160000,
      WorkingCapital: 90000,
      SurplusForYear: 10000,
      ReportingTier: 2,
      CertifiedBy: "Robert Johnson",
    },
  ],
  CC34567: [
    {
      AnnualReturnId: "ar6",
      FinancialYear: "2022-2023",
      FinancialYearEnd: "2023-03-31T00:00:00.000Z",
      TotalGrossIncome: 75000,
      TotalGrossExpenditure: 70000,
      TotalAssets: 200000,
      TotalLiabilities: 40000,
      WorkingCapital: 30000,
      SurplusForYear: 5000,
      ReportingTier: 4,
      CertifiedBy: "Sarah Williams",
    },
    {
      AnnualReturnId: "ar7",
      FinancialYear: "2021-2022",
      FinancialYearEnd: "2022-03-31T00:00:00.000Z",
      TotalGrossIncome: 65000,
      TotalGrossExpenditure: 60000,
      TotalAssets: 180000,
      TotalLiabilities: 45000,
      WorkingCapital: 25000,
      SurplusForYear: 5000,
      ReportingTier: 4,
      CertifiedBy: "Sarah Williams",
    },
    {
      AnnualReturnId: "ar8",
      FinancialYear: "2020-2021",
      FinancialYearEnd: "2021-03-31T00:00:00.000Z",
      TotalGrossIncome: 55000,
      TotalGrossExpenditure: 50000,
      TotalAssets: 160000,
      TotalLiabilities: 50000,
      WorkingCapital: 20000,
      SurplusForYear: 5000,
      ReportingTier: 4,
      CertifiedBy: "Michael Brown",
    },
  ],
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const charityNumber = searchParams.get("charityNumber")
  const organisationId = searchParams.get("organisationId")
  const useMock = process.env.USE_MOCK_DATA === "true"

  if (!charityNumber && !organisationId) {
    return NextResponse.json({ error: "Missing charity number or organisation ID" }, { status: 400 })
  }

  // If mock mode is enabled, return mock data
  if (useMock) {
    console.log("Using mock data for annual returns")

    const formattedNumber = charityNumber ? charityNumber.toUpperCase().replace(/\s+/g, "") : ""
    const mockData = MOCK_ANNUAL_RETURNS[formattedNumber as keyof typeof MOCK_ANNUAL_RETURNS] || []

    return NextResponse.json(mockData)
  }

  try {
    // Use the correct OData API endpoint
    const baseUrl = "http://www.odata.charities.govt.nz"

    let orgId = organisationId

    // If we don't have an organisation ID but we have a charity number, look up the ID first
    if (!orgId && charityNumber) {
      // Format the charity number (remove spaces and ensure uppercase)
      const formattedNumber = charityNumber.toUpperCase().replace(/\s+/g, "")

      // Find the organisation ID using the registration number
      const orgSearchUrl = `${baseUrl}/Organisations?$filter=CharityRegistrationNumber eq '${encodeURIComponent(formattedNumber)}'&$select=OrganisationId`

      console.log("Fetching organisation ID from URL:", orgSearchUrl)

      const orgResponse = await fetch(orgSearchUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Charity-Search-App/1.0",
        },
        cache: "no-store",
      })

      if (!orgResponse.ok) {
        console.error(`Organisation search API returned status: ${orgResponse.status}`)
        const errorText = await orgResponse.text()
        console.error(`Error response: ${errorText}`)
        throw new Error(`Charities API error: ${orgResponse.status}`)
      }

      const orgData = await orgResponse.json()

      // OData v2 wraps results in a 'd' property
      const organisations = orgData.d || []

      if (!organisations || organisations.length === 0) {
        return NextResponse.json([])
      }

      orgId = organisations[0].Id
    }

    if (!orgId) {
      return NextResponse.json({ error: "Could not determine organisation ID" }, { status: 400 })
    }

    // Now get the annual returns using the organisation ID and the navigation property
    const annualReturnsUrl = `${baseUrl}/Organisations(${orgId})/AnnualReturn`

    console.log("Fetching annual returns from URL:", annualReturnsUrl)

    const annualReturnsResponse = await fetch(annualReturnsUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Charity-Search-App/1.0",
      },
      cache: "no-store",
    })

    if (!annualReturnsResponse.ok) {
      console.error(`Annual returns API returned status: ${annualReturnsResponse.status}`)
      const errorText = await annualReturnsResponse.text()
      console.error(`Error response: ${errorText}`)
      throw new Error(`Charities API error: ${annualReturnsResponse.status}`)
    }

    const annualReturnsData = await annualReturnsResponse.json()

    // OData v2 wraps results in a 'd' property
    const annualReturns = annualReturnsData.d?.results || annualReturnsData.d || []

    console.log("Annual returns data:", annualReturns)

    // If there are no annual returns, return an empty array
    if (!annualReturns || annualReturns.length === 0) {
      return NextResponse.json([])
    }

    // Process each annual return to extract financial information
    const financialDetails = annualReturns.map((ar: any) => {
      // Extract the financial year from the period end date
      const periodEnd = new Date(ar.YearEnded || Date.now())
      const financialYear = `${periodEnd.getFullYear() - 1}-${periodEnd.getFullYear()}`

      // Extract financial data
      return {
        AnnualReturnId: ar.Id || ar.AnnualReturnId || Math.random().toString(36).substring(2, 10),
        FinancialYear: ar.FinancialYear || financialYear,
        FinancialYearEnd: ar.YearEnded || ar.DateReceived,
        TotalGrossIncome: ar.TotalGrossIncome || ar.GrossIncome || 0,
        TotalGrossExpenditure: ar.TotalExpenditure || ar.GrossExpenditure || 0,
        TotalAssets: ar.TotalAssets || 0,
        TotalLiabilities: ar.TotalLiabilities || 0,
        SurplusForYear:
          ar.NetSurplusDeficitForTheYear ||
          ar.SurplusDeficit ||
          (ar.TotalGrossIncome || ar.GrossIncome || 0) - (ar.TotalExpenditure || ar.GrossExpenditure || 0) ||
          0,
        WorkingCapital:
          ( ar.AllCurrentAssets || (ar.CashAndBankBalances || 0)  + (ar.OtherCurrentAssets || 0)) + (ar.DebtorsAndPrepayments || 0)) + (ar.CashAndShortTermDeposits || 0)) - ar.AllCurrentLiabilities || 0,
        ReportingTier: ar.ReportingTierId || 0,
        CertifiedBy: ar.CertifyingOfficerName || "Not provided",
        DonationsAndGrants: ar.DonationsKoha + ar.AllOtherGrantsAndSponsorship || ar.DonationsKoha || 0,
        ServiceDeliveryContracts: ar.GovtGrantsContracts || 0,
        MembershipFees: ar.MembershipFees || 0,
        RevenueGeneration: ar.ServiceTradingIncome || 0,
        InterestAndInvestmentIncome:
          ar.NewZealandDividends + ar.OtherInvestmentIncome ||
          ar.NewZealandDividends ||
          ar.InterestOfDividendsReceived ||
          0,
        OtherRevenue: ar.AllOtherIncome || 0,
        FundraisingExpenses: ar.FundRaisingExpenses || 0,
        EmployeeExpenses: ar.SalariesAndWages || 0,
        VolunteerExpenses: ar.VolunteerRelatedExpenses || 0,
        ServiceDeliveryExpenses:
          ar.CostOfTradingOperations + ar.CostOfServiceProvision || ar.CostOfTradingOperations || 0,
        GrantsAndDonationsMade: ar.GrantsorDonationsPaid || 0,
        OtherExpenses: ((ar.MaterialExpense1 || 0) + 
         (ar.MaterialExpense2 || 0) + 
         (ar.MaterialExpense3 || 0) + 
         (ar.MaterialExpense4 || 0) + 
         (ar.AllOtherExpenditure || 0)) || 0,
      }
    })

    // Sort by financial year end date (newest first)
    financialDetails.sort(
      (a: any, b: any) => new Date(b.FinancialYearEnd).getTime() - new Date(a.FinancialYearEnd).getTime(),
    )

    return NextResponse.json(financialDetails)
  } catch (error) {
    console.error("Error fetching annual returns:", error)

    // Fallback to mock data
    console.log("Falling back to mock data due to API error")

    const formattedNumber = charityNumber ? charityNumber.toUpperCase().replace(/\s+/g, "") : ""
    const mockData = MOCK_ANNUAL_RETURNS[formattedNumber as keyof typeof MOCK_ANNUAL_RETURNS] || []

    return NextResponse.json(mockData)
  }
}
