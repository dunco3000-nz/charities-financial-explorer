"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, Download, FileText, ExternalLink, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialChart } from "@/components/financial-chart"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { track } from "@vercel/analytics"
import { formatDate } from "@/utils/format-date"

type Charity = {
  CharityRegistrationNumber: string
  CharityName: string
  CharityStatus: string
  RegistrationDate: string
  OrganisationId?: number
}

type AnnualReturn = {
  AnnualReturnId: number | string
  FinancialYear: string
  FinancialYearEnd: string
  TotalGrossIncome: number
  TotalGrossExpenditure: number
  TotalAssets: number
  TotalLiabilities: number
  WorkingCapital?: number
  SurplusForYear?: number
  ReportingTier?: number
  CertifiedBy?: string
  DonationsAndGrants?: number
  ServiceDeliveryContracts?: number
  MembershipFees?: number
  RevenueGeneration?: number
  InterestAndInvestmentIncome?: number
  OtherRevenue?: number
  FundraisingExpenses?: number
  EmployeeExpenses?: number
  VolunteerExpenses?: number
  ServiceDeliveryExpenses?: number
  GrantsAndDonationsMade?: number
  OtherExpenses?: number
}

// Define available fields for custom graph
const customGraphFields = [
  { id: "TotalGrossIncome", name: "Total Gross Income" },
  { id: "TotalGrossExpenditure", name: "Total Gross Expenditure" },
  { id: "TotalAssets", name: "Total Assets" },
  { id: "TotalLiabilities", name: "Total Liabilities" },
  { id: "WorkingCapital", name: "Working Capital" },
  { id: "SurplusForYear", name: "Surplus For Year" },
  { id: "DonationsAndGrants", name: "Donations & Grants" },
  { id: "ServiceDeliveryContracts", name: "Service Delivery Contracts" },
  { id: "MembershipFees", name: "Membership Fees" },
  { id: "RevenueGeneration", name: "Revenue Generation" },
  { id: "InterestAndInvestmentIncome", name: "Interest & Investment Income" },
  { id: "OtherRevenue", name: "Other Revenue" },
  { id: "FundraisingExpenses", name: "Fundraising Expenses" },
  { id: "EmployeeExpenses", name: "Employee Expenses" },
  { id: "VolunteerExpenses", name: "Volunteer Expenses" },
  { id: "ServiceDeliveryExpenses", name: "Service Delivery Expenses" },
  { id: "GrantsAndDonationsMade", name: "Grants & Donations Made" },
  { id: "OtherExpenses", name: "Other Expenses" },
]

// Define colors for custom graph
const customGraphColors = ["#5C7933", "#BA484A", "#5B3ABA", "#333333"]

export function CharityDetails({
  charity,
  onBack,
}: {
  charity: Charity
  onBack: () => void
}) {
  const { toast } = useToast()
  const [annualReturns, setAnnualReturns] = useState<AnnualReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Full width toggle removed
  const [yearRange, setYearRange] = useState<"5" | "10" | "all">("all")
  const [selectedCustomFields, setSelectedCustomFields] = useState<string[]>([])

  // Filter annual returns based on selected year range
  const filteredAnnualReturns = annualReturns.filter((ar, index) => {
    if (yearRange === "all") return true
    const limit = Number.parseInt(yearRange)
    return index < limit
  })

  // Check if the most recent annual return is older than 18 months
  const isLastReturnOld = () => {
    if (annualReturns.length === 0) return false

    const mostRecentReturn = annualReturns[0] // Assuming returns are sorted newest first
    const returnDate = new Date(mostRecentReturn.FinancialYearEnd)
    const eighteenMonthsAgo = new Date()
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18)

    return returnDate < eighteenMonthsAgo
  }

  useEffect(() => {
    async function fetchAnnualReturns() {
      setLoading(true)
      setError(null)

      try {
        // Use organisationId if available, otherwise use charity number
        const idParam = charity.OrganisationId
          ? `organisationId=${charity.OrganisationId}`
          : `charityNumber=${charity.CharityRegistrationNumber}`

        const response = await fetch(`/api/annual-returns?${idParam}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Error: ${response.status} - ${errorData.error || "Unknown error"}`)
        }

        const data = await response.json()

        if (!Array.isArray(data) || data.length === 0) {
          setError("No annual returns found for this charity.")
        } else {
          // Sort by financial year end date (newest first)
          const sortedData = data.sort(
            (a: AnnualReturn, b: AnnualReturn) =>
              new Date(b.FinancialYearEnd).getTime() - new Date(a.FinancialYearEnd).getTime(),
          )
          setAnnualReturns(sortedData)

          // Track charity view event
          track("view_charity_details", {
            charityNumber: charity.CharityRegistrationNumber,
            charityName: charity.CharityName,
            returnsCount: sortedData.length,
          })
        }
      } catch (err) {
        console.error("Error fetching annual returns:", err)
        setError("Failed to fetch annual returns. Please try again later.")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch annual returns. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnnualReturns()
  }, [charity.CharityRegistrationNumber, charity.OrganisationId, toast])

  const handleDownloadCSV = () => {
    if (annualReturns.length === 0) return

    // Track the CSV download event
    track("download_csv", {
      charityNumber: charity.CharityRegistrationNumber,
      charityName: charity.CharityName,
      recordCount: annualReturns.length,
    })

    // Create CSV content
    const headers = [
      "Financial Year",
      "Year End",
      "Gross Income",
      "Gross Expenditure",
      "Total Assets",
      "Total Liabilities",
      "Working Capital",
      "Surplus For Year",
      "Reporting Tier",
      "Certified By",
    ]
    const rows = annualReturns.map((ar) => [
      ar.FinancialYear,
      formatDate(ar.FinancialYearEnd),
      ar.TotalGrossIncome,
      ar.TotalGrossExpenditure,
      ar.TotalAssets,
      ar.TotalLiabilities,
      ar.WorkingCapital || 0,
      ar.SurplusForYear || 0,
      ar.ReportingTier || "Unknown",
      ar.CertifiedBy || "Unknown",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${charity.CharityName.replace(/[^a-z0-9]/gi, "_")}_financial_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const charityRegisterUrl = `https://www.register.charities.govt.nz/Charity/${charity.CharityRegistrationNumber}`

  const toggleCustomField = (fieldId: string) => {
    setSelectedCustomFields((prev) => {
      // If already selected, remove it
      if (prev.includes(fieldId)) {
        return prev.filter((id) => id !== fieldId)
      }

      // If not selected and we have less than 4 fields, add it
      if (prev.length < 4) {
        return [...prev, fieldId]
      }

      // If we already have 4 fields, show a toast and don't change
      toast({
        title: "Maximum fields selected",
        description: "You can select a maximum of 4 fields for the custom graph.",
        variant: "destructive",
      })
      return prev
    })
  }

  // Get field name for a given field ID
  const getFieldName = (fieldId: string) => {
    const field = customGraphFields.find((f) => f.id === fieldId)
    return field ? field.name : fieldId
  }

  // Get color for a custom field based on its position
  const getCustomFieldColor = (fieldId: string) => {
    const index = selectedCustomFields.indexOf(fieldId)
    return index >= 0 ? customGraphColors[index] : undefined
  }

  // Check if an annual return is Tier 1 or 2
  const isHighTier = (tier?: number) => {
    return tier === 1 || tier === 2
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to results
          </Button>

          <div className="flex items-center">
            {annualReturns.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="mr-2">
                <Download className="h-4 w-4 mr-1" />
                Download CSV
              </Button>
            )}
            <div className="w-24 hidden sm:block">
              <Image src="/duncan-digital-logo.png" alt="Duncan Digital Logo" width={100} height={50} priority />
            </div>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-primary">{charity.CharityName}</CardTitle>
                <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <Link
                      href={charityRegisterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-primary flex items-center"
                    >
                      {charity.CharityRegistrationNumber}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Registered: {formatDate(charity.RegistrationDate)}
                  </span>
                </CardDescription>

                {/* Warning for old annual returns */}
                {!loading && annualReturns.length > 0 && isLastReturnOld() && (
                  <div className="mt-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-[#BA484A] mt-0.5 flex-shrink-0" />
                    <p className="text-[#BA484A] text-sm">
                      Note, this charity's last annual return was over 18 months ago.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="mb-4">
                  <Tabs defaultValue="income-expenditure" className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <TabsList className="w-full max-w-md h-auto grid grid-cols-4">
                        <TabsTrigger
                          value="income-expenditure"
                          className="text-xs sm:text-sm px-1 py-3 h-auto min-h-[3rem] whitespace-normal"
                        >
                          Income & Expenditure
                        </TabsTrigger>
                        <TabsTrigger
                          value="assets-liabilities"
                          className="text-xs sm:text-sm px-1 py-3 h-auto min-h-[3rem] whitespace-normal"
                        >
                          Assets & Liabilities
                        </TabsTrigger>
                        <TabsTrigger
                          value="surplus-capital"
                          className="text-xs sm:text-sm px-1 py-3 h-auto min-h-[3rem] whitespace-normal"
                        >
                          Surplus & Working Capital
                        </TabsTrigger>
                        <TabsTrigger
                          value="custom"
                          className="text-xs sm:text-sm px-1 py-3 h-auto min-h-[3rem] whitespace-normal"
                        >
                          Custom
                        </TabsTrigger>
                      </TabsList>

                      <Select value={yearRange} onValueChange={(value) => setYearRange(value as "5" | "10" | "all")}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select year range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Last 5 years</SelectItem>
                          <SelectItem value="10">Last 10 years</SelectItem>
                          <SelectItem value="all">All years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <TabsContent value="income-expenditure" className="pt-4">
                      <FinancialChart
                        data={filteredAnnualReturns}
                        keys={["TotalGrossIncome", "TotalGrossExpenditure"]}
                        labels={["Gross Income", "Gross Expenditure"]}
                        xAxisKey="FinancialYear"
                        colors={["#5C7933", "#BA484A"]}
                      />
                    </TabsContent>

                    <TabsContent value="assets-liabilities" className="pt-4">
                      <FinancialChart
                        data={filteredAnnualReturns}
                        keys={["TotalAssets", "TotalLiabilities"]}
                        labels={["Total Assets", "Total Liabilities"]}
                        xAxisKey="FinancialYear"
                        colors={["#5C7933", "#BA484A"]}
                      />
                    </TabsContent>

                    <TabsContent value="surplus-capital" className="pt-4">
                      <FinancialChart
                        data={filteredAnnualReturns}
                        keys={["SurplusForYear", "WorkingCapital"]}
                        labels={["Surplus For Year", "Working Capital"]}
                        xAxisKey="FinancialYear"
                        colors={["#5C7933", "#5B3ABA"]}
                      />
                    </TabsContent>

                    <TabsContent value="custom" className="pt-4">
                      <div className="mb-6 border p-4 rounded-md">
                        <h3 className="font-medium mb-2">Select up to 4 fields to display:</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {customGraphFields.map((field) => {
                            const isSelected = selectedCustomFields.includes(field.id)
                            const color = getCustomFieldColor(field.id)

                            return (
                              <div key={field.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`field-${field.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleCustomField(field.id)}
                                  className={
                                    isSelected
                                      ? `border-0 ${
                                          color === "#5C7933"
                                            ? "bg-[#5C7933]"
                                            : color === "#BA484A"
                                              ? "bg-[#BA484A]"
                                              : color === "#5B3ABA"
                                                ? "bg-[#5B3ABA]"
                                                : "bg-[#333333]"
                                        }`
                                      : ""
                                  }
                                />
                                <Label
                                  htmlFor={`field-${field.id}`}
                                  className={`text-sm ${
                                    isSelected
                                      ? color === "#5C7933"
                                        ? "text-[#5C7933]"
                                        : color === "#BA484A"
                                          ? "text-[#BA484A]"
                                          : color === "#5B3ABA"
                                            ? "text-[#5B3ABA]"
                                            : "text-[#333333]"
                                      : ""
                                  }`}
                                >
                                  {field.name}
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {selectedCustomFields.length > 0 ? (
                        <FinancialChart
                          data={filteredAnnualReturns}
                          keys={selectedCustomFields}
                          labels={selectedCustomFields.map(getFieldName)}
                          xAxisKey="FinancialYear"
                          colors={selectedCustomFields.map((_, index) => customGraphColors[index])}
                        />
                      ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-md">
                          <p className="text-muted-foreground">Select at least one field to display the graph</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!loading && annualReturns.length > 0 && (
          <Card>
            <CardHeader className="bg-secondary/5">
              <CardTitle className="text-secondary">Annual Returns</CardTitle>
              <CardDescription>Financial data for the past {annualReturns.length} years</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <TooltipProvider>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Financial Year</th>
                        <th className="text-center py-2 px-2 w-10"></th> {/* New column for warning icon */}
                        <th className="text-left py-2 px-4">Year End</th>
                        <th className="text-right py-2 px-4">Surplus</th>
                        <th className="text-right py-2 px-4">Working Capital</th>
                        <th className="text-right py-2 px-4">Gross Income</th>
                        <th className="text-right py-2 px-4">Gross Expenditure</th>
                        <th className="text-right py-2 px-4">Total Assets</th>
                        <th className="text-right py-2 px-4">Total Liabilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annualReturns.map((ar) => (
                        <tr key={ar.AnnualReturnId} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{ar.FinancialYear}</td>
                          <td className="py-2 px-2 text-center">
                            {isHighTier(ar.ReportingTier) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help inline-block">
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs bg-white p-3 border border-gray-200 rounded shadow-lg z-50"
                                  >
                                    <p>
                                      This is a Tier {ar.ReportingTier} return. Some financial data may be incomplete or
                                      presented differently than in Tier 3 and 4 returns.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </td>
                          <td className="py-2 px-4">{formatDate(ar.FinancialYearEnd)}</td>
                          <td
                            className="text-right py-2 px-4"
                            style={{
                              color: (ar.SurplusForYear || 0) >= 0 ? "#5C7933" : "#5B3A8A",
                            }}
                          >
                            ${(ar.SurplusForYear || 0).toLocaleString()}
                          </td>
                          <td
                            className="text-right py-2 px-4"
                            style={{
                              color: (ar.WorkingCapital || 0) >= 0 ? "#5C7933" : "#5B3A8A",
                            }}
                          >
                            ${(ar.WorkingCapital || 0).toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-4 text-[#5C7933]">
                            ${ar.TotalGrossIncome.toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-4 text-[#5B3A8A]">
                            ${ar.TotalGrossExpenditure.toLocaleString()}
                          </td>
                          <td className="text-right py-2 px-4 text-[#5C7933]">${ar.TotalAssets.toLocaleString()}</td>
                          <td className="text-right py-2 px-4 text-[#5B3A8A]">
                            ${ar.TotalLiabilities.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
