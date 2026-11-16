# Recreate This Trip

I've watched Kara and Nate's travel videos since 8th grade, and every time they fly something like Air France La Première I want to know how I'd book it myself. This is a small site for that.

Click "Try the demo" on the front page. There's no sign up and no login: it opens straight into a demo with a few card balances filled in. Pick one of their flight videos and you get:

- the route, cabin, plane and the points program they booked with
- which credit card points transfer to that program, and at what ratio
- a progress bar for your own balances ("62% of the way there") and the transfers that would close the gap
- a preview of a seat alert for that exact route

Inside there are three tabs:

- **Trips**: every flight from their videos, how close your points get you, and a box to paste a YouTube link
- **My flights**: a log of flights you've taken on a map, with Kara and Nate's routes as an optional layer
- **Points**: your card balances, with every priced trip ranked by how close you are

**Live:** https://adamzhu.dev/recreate-this-trip/

Fan-made. Not affiliated with Kara and Nate or Daily Drop.

## What's real

- Video info comes from YouTube's oEmbed endpoint (no API key, works from the browser).
- The trip library in `js/data/trips.js` is filled in by hand from the videos and their write-ups. Every trip has sources. Points prices are what was shown at the time, so they're out of date the moment they're published.
- Transfer partners in `js/data/transfers.js` come from the banks' public partner lists as of Nov 2026.
- There's no server and no real account. The demo fills your browser with starter balances and the flights from their videos.
- The seat alert is a preview. Real award availability needs live data, and I'm not scraping anyone.

## Running it

No build step. Any static server works:

```
python3 -m http.server
```

then open http://localhost:8000.

Airport data is from [OurAirports](https://ourairports.com/data/) (public domain). `tools/build_airports.py` trims their CSV down to airports with scheduled service.

## Layout

```
index.html
css/style.css
js/app.js            hash router
js/util.js           storage, distance, airport lookup
js/links.js          parsing YouTube / dailydrop.com links
js/data/             trips, transfer partners, airports
js/views/            one file per page or section
```

Balances and flights are saved in localStorage and never leave the browser.
