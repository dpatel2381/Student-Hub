# StudentHub — Practical 6

## What is included

- `practical6.html` — the Data Explorer page
- `practical6.css` — styles for the Practical 6 controls and cards
- `practical6.js` — Fetch API, rendering, search, filter, sort, and pagination logic
- `data/events.json` — 18 sample events
- `data/students.json` — 18 sample student records
- `data/faqs.json` — 18 sample FAQs
- `dashboard.html` — includes a Quick Links entry for the Data Explorer

The JSON records are demonstration data, not real student records.

## How to implement and run it

1. **Back up your current project folder.**
2. Copy `practical6.html`, `practical6.css`, and `practical6.js` into the same folder as your existing `styles.css` and `favicon.svg`.
3. Copy the entire `data` folder into that same project folder. Keep the JSON filenames exactly as shown.
4. Add the Practical 6 link from the included `dashboard.html` to your current dashboard. If you do not want to replace your dashboard, add this list item inside its Quick Links list:

   ```html
   <li><a href="practical6.html">JSON Data Explorer (Practical 6)</a></li>
   ```

5. Open the project folder in VS Code and install/enable **Live Server** if it is not already installed.
6. Right-click `practical6.html` and choose **Open with Live Server**. Do not double-click the HTML file, because browsers may block `fetch()` requests from a `file://` URL.
7. Click **Events**, **Students**, and **FAQs** to switch datasets.
8. Try the search field, filter dropdown, sort dropdown, and page buttons. The page displays six records per page.

## How the code works

- `fetch('data/events.json')` (or the selected JSON path) requests the file from the local server.
- `response.ok` checks whether the request succeeded; `response.json()` parses the JSON.
- `filter()` narrows records by search text and the selected category/course.
- `sort()` orders the filtered records.
- `slice()` selects six records for the current page.
- DOM elements are created using `createElement()` and `textContent` before being added to the page.
- A loading status is shown while fetching; a readable error and retry button appear if the request fails.

## Test cases for the practical report

| Test | Action | Expected result |
|---|---|---|
| 1 | Open `practical6.html` with Live Server | Events load from `events.json` |
| 2 | Click Students | Student records load from `students.json` |
| 3 | Click FAQs | FAQ questions and answers load from `faqs.json` |
| 4 | Search for a word such as `workshop` | Only matching records remain |
| 5 | Choose one category/course from Filter by | Only records in that group remain |
| 6 | Change Sort by | The displayed order changes |
| 7 | Use Next or a page number | A different set of records appears without reloading the page |
| 8 | Temporarily rename a JSON file, reload, then restore its name | A readable error and retry option appear |

## Screenshots to submit

Capture the page showing (1) Events loaded, (2) Students loaded, (3) FAQs loaded, (4) search/filter results, and (5) pagination. Restore any renamed JSON file after testing.

## Note about the uploaded project snapshot

The uploaded HTML pages refer to `main.js`, but that file was not among the supplied project files. The Practical 6 page uses its own `practical6.js` and does not depend on `main.js`. If `main.js` already exists in your original local project, keep it when copying these files into your project.
