# flashcards

Repository for the PDF2List website.

To clone and run the website yourself, you must provide the required environment variables for the [Webit translation service](https://webit.re/cognitive-web-services/language).
These are `WEBIT_API_KEY` and `WEBIT_URL`.

Additionally, a further environment variable (`DB_URI`) for the URI of the MongoDB instance the application should connect to is required.

Lastly, a `WORDS_PER_QUERY` variable is required. Webit supports 10.
