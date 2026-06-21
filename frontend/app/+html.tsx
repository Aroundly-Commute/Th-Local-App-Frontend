// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        
        {/* Standard SEO Meta Tags */}
        <title>Aroundly - Smart Carpooling, Public Transit & Cab Share (Cab Buddy)</title>
        <meta name="description" content="Aroundly is India's premium smart transport platform. Save money with corporate and daily carpooling, track public transport, and use Cab Buddy to match with random passengers heading your way to share a cab and split the fare." />
        <meta name="keywords" content="Aroundly, Aroundly India, aroundly.in, carpool, carpooling India, cab sharing, split cab bill, split fare, cab buddy, shared ride, taxi sharing, public transport tracker, corporate carpool Bangalore, ride sharing app Delhi NCR, commute, green travel, save travel cost" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://aroundly.in/" />

        {/* Open Graph / Facebook Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aroundly.in/" />
        <meta property="og:title" content="Aroundly - Smart Carpooling, Public Transit & Cab Share" />
        <meta property="og:description" content="Save on your daily commute. Match with colleagues for carpooling, view live transit data, or use Cab Buddy to share a cab and split the cost." />
        <meta property="og:image" content="https://aroundly.in/assets/images/app_Icon.png" />

        {/* Twitter Card Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://aroundly.in/" />
        <meta property="twitter:title" content="Aroundly - Smart Carpooling, Public Transit & Cab Share" />
        <meta property="twitter:description" content="Save on your daily commute. Match with colleagues for carpooling, view live transit data, or use Cab Buddy to share a cab and split the cost." />
        <meta property="twitter:image" content="https://aroundly.in/assets/images/app_Icon.png" />

        {/* Structured Data: JSON-LD for Software Application (Search Engine Rich Snippet) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Aroundly",
              "operatingSystem": "iOS, Android, Web",
              "applicationCategory": "TravelApplication",
              "url": "https://aroundly.in",
              "logo": "https://aroundly.in/assets/images/app_Icon.png",
              "description": "Aroundly is India's premium smart commuting platform. We offer corporate carpooling, real-time public transport tracking, and 'Cab Buddy' - a unique concept matching random passengers traveling to the same destination to share a cab and split the fare.",
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "INR"
              },
              "featureList": [
                "Corporate and Daily Carpooling",
                "Public Transport route search and scheduling",
                "Cab Buddy: Match with nearby random commuters going the same way, book a cab, and split the fare to save 50%"
              ],
              "keywords": "aroundly, aroundly app, aroundly.in, carpool, carpooling app india, cab share, split cab bill, split fare, cab buddy, taxi sharing, shared ride, public transport tracker, corporate carpooling bangalore, delhi NCR carpool, mumbai transit"
            })
          }}
        />

        {/* Structured Data: FAQ Schema Markup to display rich snippets in search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does hyper-local carpooling work?",
                  "acceptedAnswer": {
                    "@type": "AcceptedAnswer",
                    "text": "Aroundly matches drivers who have empty seats with riders heading in the same direction within your local society or workplace. Drivers post rides, and riders can request a seat."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is there a cost for sharing rides?",
                  "acceptedAnswer": {
                    "@type": "AcceptedAnswer",
                    "text": "Riders share fuel costs with drivers. The cost is calculated transparently based on distance and vehicle type, and is visible before booking."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How are society and workplace verified?",
                  "acceptedAnswer": {
                    "@type": "AcceptedAnswer",
                    "text": "Aroundly uses local community and corporate email domain checks to verify user associations, ensuring high trust in hyper-local carpools."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I register my vehicle details?",
                  "acceptedAnswer": {
                    "@type": "AcceptedAnswer",
                    "text": "Navigate to your Profile screen, tap 'My Vehicles,' and complete the registration. Once saved, you can immediately begin offering rides."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the cancellation policy?",
                  "acceptedAnswer": {
                    "@type": "AcceptedAnswer",
                    "text": "You can cancel a ride up to 30 minutes before the start time. We recommend coordinating directly with your match via chat before cancelling."
                  }
                }
              ]
            })
          }}
        />
        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              input, textarea, select { outline: none !important; box-shadow: none !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
