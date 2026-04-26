# AidConnect — Demo Data Files

These files represent **real-world data formats** that volunteers collect in the field.
They can be uploaded directly into the AidConnect system to demonstrate how AI structures scattered community data.

---

## Files Included

| File | Format | What it represents |
|------|--------|-------------------|
| `field-notes-sample.txt` | Plain text | Hand-written volunteer field survey notes |
| `survey-data.csv` | CSV/Excel | Structured community survey data (household level) |
| `whatsapp-messages.txt` | Text | WhatsApp group messages from a community alert group |

---

## How to Demo

1. Login as a Volunteer account
2. Go to **Upload Report** in the sidebar
3. Select the data type tab (WhatsApp / CSV / Field Notes)
4. Upload or paste the corresponding file
5. Click **"Analyse with Gemini AI"**
6. Review the structured output — severity score, key findings, affected groups, location
7. Click **"Submit Report to NGO"**

Then:

8. Login as an NGO account
9. Go to **Needs Board** in the sidebar
10. See the AI-ranked community need appear
11. Click **"AI Dispatch"** to see Gemini match the best available volunteer
12. Click **"Dispatch"** — task is auto-created and volunteer is assigned

---

## Why These Files Exist

In the real world, NGOs deal with data scattered across:
- Paper surveys typed up as `.txt` files
- WhatsApp group conversations
- Excel/Google Sheets exported as `.csv`
- Google Form responses

AidConnect's AI layer normalizes all of these into a single structured format with severity scoring — solving the core problem of data being siloed and unactionable.
