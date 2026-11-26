# Anime Universe Studio

Anime Chronicles এপিসোড তৈরির ৯ ধাপের স্টুডিও: Claude দিয়ে আইডিয়া → স্ক্রিপ্ট → storyboard, ElevenLabs/Cartesia ভয়েস, আর storyboard থেকে animatic MP4।

## Vercel-এ যা সেট করতে হবে (Settings → Environment Variables)

| নাম | কী |
|---|---|
| `STUDIO_PASSWORD` | Studio-তে ঢোকার পাসওয়ার্ড (নিজে বানান) |
| `ANTHROPIC_API_KEY` | console.anthropic.com থেকে API key (আলাদা বিল হয়) |
| `ELEVENLABS_API_KEY` | ElevenLabs → Developers → API Keys |
| `CARTESIA_API_KEY` | play.cartesia.ai → API Keys |
| `ANTHROPIC_MODEL` | ঐচ্ছিক, ডিফল্ট `claude-sonnet-5-5` |

ডেটা সেভ হয় private Vercel Blob store-এ (`BLOB_READ_WRITE_TOKEN`)। env বদলানোর পর Redeploy করুন।
