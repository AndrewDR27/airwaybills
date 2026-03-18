# Airports refactor – impact checklist

Use this after the Origins/Destinations → Airports change to confirm everything still works.

---

## 1. Locations menu & pages

- [ ] **Dashboard** – Locations submenu shows **Airlines** and **Airports** only (no Origins, Destinations, or standalone Terminals).
- [ ] **Airports** – Open **Locations → Airports** (or `/airports.html`). List loads; you can add/edit an airport and add terminal-by-airline rows.
- [ ] **Redirects** – Visiting `/origins.html` or `/destinations.html` redirects to `/airports.html`.

---

## 2. Create AWB / destination

- [ ] **Destination dropdown** – On Create AWB, Routing tab: destination dropdown is populated (from Airports). Selecting an airport fills field 09 (code) and 18 (airport name).
- [ ] **Add Destination button** – Clicking “+ Add” next to Destination opens **airports.html** (in same or new tab, depending on your setup). Adding a new airport there and returning to Create AWB, then refreshing or reopening the dropdown, shows the new airport.
- [ ] **Saving AWB** – Creating/saving an AWB stores `_destinationId` (airport id). Reopening the AWB restores the selected destination and filled fields.

---

## 3. Shipment space (carrier & terminal)

- [ ] **Carrier & terminal block** – Open a shipment space for an AWB that has **Issuing Carrier** and **Destination** set. The “Carrier & terminal information” section appears.
- [ ] **General contact** – Airline “General customer service” (phone/email from Airlines page) shows when set.
- [ ] **Terminal info** – For the destination airport, if that airport has a terminal row for the issuing airline (in Airports → Edit airport → Terminals by airline), the terminal phone/email/address/pick-up hours show. If not, only general contact shows (no terminal block).
- [ ] **Fallback by code** – If the AWB has no `_destinationId` but has a 3-letter airport code in form data, the section still resolves the airport and shows terminal when configured.

---

## 4. Airlines page

- [ ] **General contact only** – In **Locations → Airlines**, edit an airline. Only “General customer service” (phone/email) is available. There is no “Terminal / location details” or “Add location” (that’s now on each airport).
- [ ] **Existing data** – Old `locationDetails` in the database are no longer shown or edited; terminal info is now managed per airport on the Airports page.

---

## 5. Data & existing AWBs

- [ ] **Existing destinations** – AWBs/shipments that already had a destination selected should still show the same destination (airport ids were preserved for former destinations in the merge). Spot-check a few.
- [ ] **Carrier/terminal for old AWBs** – For those same AWBs, open the shipment space and confirm “Carrier & terminal information” still appears when the airline and destination are set and the airport has that airline’s terminal configured.
- [ ] **Templates** – If you use templates with a destination, loading a template still sets the destination dropdown and fields correctly.

---

## 6. Permissions & roles

- [ ] **Airports add/edit/delete** – Only users who could previously edit locations (e.g. admin, issuing-carrier-agent) can add, edit, and delete airports. Others see the list but no Add button or delete.
- [ ] **Airlines** – Unchanged; same roles as before for editing airlines.

---

## 7. APIs (if you use them or run backend)

- [ ] **GET /api/airports** – Returns the merged airport list (first run may have migrated from origins + destinations). Each airport has `id`, `airportCode`, `cityName`, `stateName`, `airportName`, `terminals: [{ airlineId, terminalPhone, terminalEmail, terminalAddress, terminalPickUpHours }]`.
- [ ] **Origins/Destinations APIs** – Still exist; dashboard and Create AWB no longer use them for the main flow. Redirects send users to the Airports page.

---

## Quick smoke test

1. Open dashboard → Locations → Airports; add an airport with one terminal row for an airline.
2. Create AWB: set Issuing Carrier and Destination (your new airport), save.
3. Open the shipment from My Shipments; confirm “Carrier & terminal information” shows airline general contact and terminal details.
4. In Airports, edit the same airport and add another airline’s terminal; open the shipment again and confirm the correct terminal appears for the issuing airline.

If all of the above pass, the refactor impact is covered for normal use.
