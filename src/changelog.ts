export const changelog = [
  {
    version: "v0.3.2-alpha",
    date: "2025-09-18",
    changes: []
  },
  {
    version: "v0.3.1-alpha",
    date: "2025-09-17",
    changes: [
      "Robust login- og invite-flow: Brugere bliver nu korrekt sendt til login, hvis de er slettet eller sessionen er ugyldig.",
      "CEO-invite tildeler nu altid korrekt rolle og starter onboarding med oprettelse af firma/organisation.",
      "Onboarding-flow for CEO, admin og sælger er rollebaseret og kan udvides.",
      "Redirect-loops og netværksfejl håndteres nu korrekt – brugeren sidder ikke fast.",
      "Fallback: Automatisk log-ud og redirect til login hvis Supabase returnerer 403 (fx slettet bruger).",
      "LoginPage vises nu altid korrekt på /app/auth.",
      "Rollebaseret adgang til dashboards og sider er sikret for alle roller.",
      "Generel kodeoprydning og forbedret fejlhåndtering.",
      "\n--- CEO FLOW OG FEJLRETTELSER ---",
      "Fejl: CEO-inviterede brugere blev ikke altid onboardet korrekt og kunne ende i forkert flow eller få 404.",
      "Løsning: Onboarding-stepper og routing er nu rollebaseret. CEO får altid CEO-onboarding og sendes til /app/ceo-dashboard.",
      "Fejl: CEO-dashboard gav 404, fordi routes var defineret på /ceo i stedet for /app/ceo.",
      "Løsning: Alle CEO-routes og redirects er rettet til /app/ceo, så de matcher routerens mount path.",
      "Fejl: CEO kunne se admin-menu i sidebaren, hvis de havde lavt role-level.",
      "Løsning: Sidebar viser nu kun admin-sektion for admin og developer – aldrig for CEO.",
      "Fejl: Det var uklart hvilken rolle man var logget ind som.",
      "Løsning: Rolle vises nu tydeligt i bunden af sidebaren sammen med navn og email.",
      "UI: Spacing og alignment på rolle-label i bunden af sidebaren er forbedret og venstrejusteret.",
      "Fejl: Forkert JSX-struktur i sidebar gav build-fejl. Løst ved at wrappe sidebar i fragment og rydde op i markup.",
      "Alt routing, onboarding og navigation for CEO er nu robust, rollebeskyttet og brugervenligt."
    ]
  },
  {
    version: "v0.3.0-alpha",
    date: "2025-09-16",
    changes: [
      "Refaktorering af dashboard og navigation.",
      "Invitation forms flyttet til dedikerede sider for bedre overblik.",
      "Admin kan nu slette både organisationer og firmaer (soft delete).",
      "Soft delete implementeret for alle destruktive handlinger.",
      "Changelog-pop-up tilføjet, der viser brugere de seneste opdateringer.",
      "Changelog-knap er nu altid synlig i navigationen (sidebar).",
      "Forbedret brugeroplevelse og adgang til nye funktioner."
    ]
  },
  {
    version: "v0.2.1-alpha",
    date: "2025-09-15",
    changes: [
      "Du kan nu gendanne slettede firmaer og organisationer.",
      "Sletning er ikke længere permanent!"
    ]
  },
  {
    version: "v0.2.0-alpha",
    date: "2025-09-10",
    changes: [
      "Dashboardet har fået nyt design og flere statistikker."
    ]
  },
  {
    version: "v0.1.0-alpha",
    date: "2025-08-25",
    changes: [
      "Projekt oprettet med login og grundlæggende dashboard.",
      "Opsætning af Supabase integration.",
      "Brugerroller implementeret (admin, CEO, seller etc.)."
    ]
  }
];
