# StudioSpace — Project Rules
- Next.js App Router (JavaScript) client + Express + MongoDB native driver server. Same database: studiospaceDB.
- Categories (exact strings): "Photo Studio", "Film Stage", "Podcast Lounge", "Music Suite", "Art Workshop"
- NEVER use alert()/confirm() — use react-hot-toast + custom modals. NEVER use Lorem ipsum. Use the new X logo, never the Twitter bird.
- Protected server routes require the httpOnly "token" JWT cookie → 401 if missing/invalid. Client fetch for protected routes: credentials: "include".
- Bookings: server must reject overlapping Pending/Confirmed bookings for same studio+date with 409.
- Design: charcoal/zinc + amber accent, Space Grotesk headings, Inter body, equal-size cards (aspect 4/3 images), light/dark theme toggle persisted in localStorage.
- Never hardcode secrets or localhost URLs in client code — use environment variables.
- Commit after every completed feature with a meaningful message. Client needs 15+ commits, server 8+.
- Before finishing any task: run the relevant build/test and fix errors.