import { SearchForm } from "@/components/search-form"
import { CharityResults } from "@/components/charity-results"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-48 mb-4">
          <Image src="/duncan-digital-logo.png" alt="Duncan Digital Logo" width={300} height={150} priority />
        </div>
        <h1 className="text-3xl font-bold text-center text-primary">Charity Financials Explorer</h1>
        <p className="text-muted-foreground mt-2">
          Search the New Zealand Charities Register and explore financial data
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <SearchForm />
        <CharityResults />
      </div>
      <footer className="mt-16 text-center text-sm text-muted-foreground space-y-4">
        <div className="max-w-3xl mx-auto border-t pt-4">
          <p className="mb-4">
            © {new Date().getFullYear()}{" "}
            <Link
              href="https://duncandigital.co.nz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Duncan Digital Limited
            </Link>
            . All rights reserved.
          </p>

          <div className="bg-muted/30 p-4 rounded-md text-left mb-4">
            <h3 className="font-medium mb-2">Disclaimer:</h3>
            <p>
              This tool is for informational purposes only and is best suited to Teir 3 and 4 charities. It relies on
              the data provided to the Charities Register, and given the changes in reporting standards and API over the
              years, at times may be inaccurate. We recommend you review an organisation's financial statements to
              ensure accuracy when needed.
            </p>
          </div>

          <div className="flex justify-center">
            <a
              href="https://forms.office.com/Pages/ResponsePage.aspx?id=natxmOsIwE2TZ1KQIeA74F33klsOw0NCk6BJXEgWdShUMDg1NzUxTUNVVkI4M1ZON0dUVUlaWkNVQi4u"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center"
            >
              Report bugs or provide feedback
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

