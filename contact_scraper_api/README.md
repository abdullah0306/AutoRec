# Contact Scraper API

A Flask-based API for scraping contact information from websites using Apify.

## Setup

1. Install Python 3.7+ if not already installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Running the API

```
python app.py
```

The API will run on http://localhost:5000 by default.

## API Endpoints

### Scrape Contacts

**Endpoint:** `POST /api/scrape-contacts`

**Request Body:**

```json
{
  "url": "https://example.com",  // Can be a string or array of strings
  "maxPages": 30,                // Optional, default: 30
  "includeEmail": true,          // Optional, default: true
  "includePhone": true,          // Optional, default: true
  "includeSocial": true          // Optional, default: true
}
```

**Response:**

```json
{
  "success": true,
  "contacts": [
    {
      "name": "example.com",
      "position": "",
      "company": "example.com",
      "email": "contact@example.com",
      "phone": "+1234567890",
      "website": "https://example.com",
      "linkedIn": "https://linkedin.com/company/example",
      "twitter": "https://twitter.com/example",
      "facebook": "https://facebook.com/example",
      "instagram": "https://instagram.com/example",
      "address": "",
      "city": "",
      "state": "",
      "country": "",
      "zipCode": "",
      "industry": "",
      "companySize": "",
      "foundedYear": "",
      "description": "",
      "source": "https://example.com"
    }
  ],
  "contactsPerSearch": 30,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalResults": 5,
    "hasMore": false,
    "searchedUrl": "https://example.com"
  },
  "message": "Found 5 contacts"
}
```

## Integration with Frontend

To use this API with your existing frontend, update the contact scraper function to call this API instead of directly calling Apify.
